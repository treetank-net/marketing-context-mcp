/**
 * Semantic ranking service hosted by the long-running MCP server process.
 *
 * The one-shot hook process cannot hold an embedding model, so the MCP server
 * does: it lazily loads a small multilingual ONNX model (transformers.js),
 * embeds every knowledge article once (frontmatter is the database: title +
 * keywords + summary), and exposes a loopback-only HTTP endpoint the hook can
 * query per prompt. Discovery happens through a JSON file in the hook's state
 * dir carrying {port, token}.
 *
 * Everything here is fail-open by design: no deps installed → background
 * npm install into CLAUDE_PLUGIN_DATA and answer 503 until ready; any error →
 * the hook falls back to the keyword scorer. The MCP server must never crash
 * or block on this feature. Escape hatch: MARKETING_CONTEXT_EMBED=0.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { isEnabled, type MarketingContextConfig } from './config.js';
import { listKnowledgeFiles } from './storage.js';
import { frontmatterList } from './retrieval.js';

const EMBED_PKG = '@huggingface/transformers';
const DEFAULT_MODEL = 'Xenova/multilingual-e5-small';
// Retry a failed/interrupted dependency install after this long.
const INSTALL_RETRY_MS = 60 * 60 * 1000;

interface DocVector {
  path: string;
  appliesTo: string[];
  hash: string;
  vector: number[];
}

interface EngineState {
  status: 'idle' | 'installing' | 'warming' | 'ready' | 'error';
  detail?: string;
  embed?: (texts: string[]) => Promise<number[][]>;
  docs?: DocVector[];
  model: string;
}

const engine: EngineState = { status: 'idle', model: process.env.MARKETING_CONTEXT_EMBED_MODEL || DEFAULT_MODEL };

// --- paths -------------------------------------------------------------------

function dataDir(): string {
  return process.env.CLAUDE_PLUGIN_DATA || join(tmpdir(), 'marketing-context-embed');
}

function depsDir(): string {
  return join(dataDir(), 'embed-deps');
}

// Must match stateDir() in hook.ts — the hook reads the discovery file there.
function hookStateDir(): string {
  return join(tmpdir(), 'marketing-context-hook');
}

function discoveryPath(): string {
  return join(hookStateDir(), 'embed-endpoint.json');
}

// --- dependency bootstrap ------------------------------------------------------

function resolvePkgEntry(): string | null {
  const pkgDir = join(depsDir(), 'node_modules', '@huggingface', 'transformers');
  const pkgJsonPath = join(pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    const root = pkg.exports?.['.'];
    const rel =
      (typeof root === 'string' ? root : root?.node?.import || root?.import || root?.require || root?.default) ||
      pkg.module ||
      pkg.main ||
      'index.js';
    const entry = join(pkgDir, rel);
    return existsSync(entry) ? entry : null;
  } catch {
    return null;
  }
}

// esbuild's CJS output rewrites import() into require(), which cannot load an
// ESM package — this indirection preserves the native dynamic import.
const dynamicImport = new Function('url', 'return import(url)') as (url: string) => Promise<any>;

/**
 * Kick off `npm install` of the embedding stack into CLAUDE_PLUGIN_DATA,
 * detached and logged to a file. A marker file throttles retries so a broken
 * environment does not respawn npm on every server start.
 */
function ensureDepsInstalling(): void {
  const marker = join(dataDir(), 'embed-install.json');
  try {
    if (existsSync(marker)) {
      const info = JSON.parse(readFileSync(marker, 'utf8'));
      if (Date.now() - Number(info.startedAt || 0) < INSTALL_RETRY_MS) return;
    }
    mkdirSync(depsDir(), { recursive: true });
    writeFileSync(marker, JSON.stringify({ startedAt: Date.now(), pkg: EMBED_PKG }), 'utf8');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const log = join(dataDir(), 'embed-install.log');
    const child = spawn(npm, ['install', '--prefix', depsDir(), '--no-audit', '--no-fund', `${EMBED_PKG}@^3`], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
      env: { ...process.env, npm_config_loglevel: 'error', npm_config_logs_dir: log },
    });
    child.unref();
  } catch {
    // fail-open: hook keeps using the keyword scorer
  }
}

// --- engine -------------------------------------------------------------------

async function loadEngine(cfg: MarketingContextConfig): Promise<void> {
  if (engine.status === 'ready' || engine.status === 'warming') return;
  const entry = resolvePkgEntry();
  if (!entry) {
    engine.status = 'installing';
    engine.detail = 'embedding dependencies not installed yet';
    ensureDepsInstalling();
    return;
  }
  engine.status = 'warming';
  try {
    const transformers = await dynamicImport(pathToFileURL(entry).href);
    if (transformers.env) {
      transformers.env.cacheDir = join(dataDir(), 'model-cache');
      transformers.env.allowLocalModels = true;
    }
    const pipe = await transformers.pipeline('feature-extraction', engine.model, { dtype: 'q8' });
    engine.embed = async (texts: string[]) => {
      const output = await pipe(texts, { pooling: 'mean', normalize: true });
      return output.tolist();
    };
    engine.docs = await buildDocIndex(cfg, engine.embed);
    engine.status = 'ready';
    engine.detail = undefined;
  } catch (error) {
    engine.status = 'error';
    engine.detail = String((error as Error)?.message || error).slice(0, 300);
  }
}

/**
 * Embed every knowledge article (frontmatter fields only — the summaries are
 * hand-written briefs, better retrieval targets than raw bodies) with the e5
 * "passage:" prefix. Vectors are cached on disk keyed by content hash, so a
 * warm start embeds nothing and a single edited article re-embeds alone.
 */
async function buildDocIndex(
  cfg: MarketingContextConfig,
  embed: (texts: string[]) => Promise<number[][]>,
): Promise<DocVector[]> {
  const cachePath = join(dataDir(), 'doc-vectors.json');
  let cache: Record<string, { hash: string; vector: number[] }> = {};
  try {
    const parsed = JSON.parse(readFileSync(cachePath, 'utf8'));
    if (parsed.model === engine.model && parsed.entries) cache = parsed.entries;
  } catch {
    // cold cache
  }

  const docs = await listKnowledgeFiles(cfg);
  const result: DocVector[] = [];
  const pending: Array<{ path: string; appliesTo: string[]; hash: string; text: string }> = [];

  for (const doc of docs) {
    const summary = String(doc.frontmatter.summary || '').trim();
    const keywords = frontmatterList(doc.frontmatter, 'keywords').join(' ');
    const text = `${doc.title}\n${keywords}\n${summary}`.trim();
    if (!text) continue;
    const appliesTo = frontmatterList(doc.frontmatter, 'applies_to');
    const hash = createHash('sha1').update(`${engine.model}\n${text}`).digest('hex');
    const cached = cache[doc.path];
    if (cached && cached.hash === hash) {
      result.push({ path: doc.path, appliesTo, hash, vector: cached.vector });
    } else {
      pending.push({ path: doc.path, appliesTo, hash, text });
    }
  }

  if (pending.length > 0) {
    const vectors = await embed(pending.map((item) => `passage: ${item.text}`));
    pending.forEach((item, i) => result.push({ ...item, vector: vectors[i], text: undefined } as unknown as DocVector));
  }

  try {
    mkdirSync(dataDir(), { recursive: true });
    const entries = Object.fromEntries(result.map((d) => [d.path, { hash: d.hash, vector: d.vector }]));
    writeFileSync(cachePath, JSON.stringify({ model: engine.model, entries }), 'utf8');
  } catch {
    // cache write is best-effort
  }
  return result;
}

function cosine(a: number[], b: number[]): number {
  // embed() normalizes, so the dot product IS the cosine similarity.
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

// --- HTTP service ---------------------------------------------------------------

async function handleRank(body: { text?: unknown; limit?: unknown }, res: ServerResponse): Promise<void> {
  const text = String(body.text || '').slice(0, 8000);
  const limit = Math.min(Number(body.limit) || 8, 25);
  if (!text.trim()) {
    respond(res, 400, { status: 'error', detail: 'text is required' });
    return;
  }
  if (engine.status !== 'ready' || !engine.embed || !engine.docs) {
    respond(res, 503, { status: engine.status, detail: engine.detail });
    return;
  }
  const [query] = await engine.embed([`query: ${text}`]);
  const matches = engine.docs
    .map((doc) => ({ path: doc.path, applies_to: doc.appliesTo, similarity: cosine(query, doc.vector) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
  respond(res, 200, { status: 'ok', model: engine.model, matches });
}

function respond(res: ServerResponse, code: number, payload: unknown): void {
  const data = JSON.stringify(payload);
  res.writeHead(code, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) });
  res.end(data);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * Start the loopback ranking endpoint. Never throws; never blocks MCP startup.
 * Model/index warmup runs in the background — /rank answers 503 until ready
 * and the hook falls back to keyword scoring.
 */
export function startEmbedService(cfg: MarketingContextConfig): void {
  if (!isEnabled(cfg, 'embeddings')) return;
  try {
    const token = randomBytes(16).toString('hex');
    const server = createServer(async (req, res) => {
      try {
        if ((req.headers.authorization || '') !== `Bearer ${token}`) {
          respond(res, 401, { status: 'unauthorized' });
          return;
        }
        if (req.method === 'GET' && req.url === '/health') {
          respond(res, 200, { status: engine.status, model: engine.model, detail: engine.detail });
          return;
        }
        if (req.method === 'POST' && req.url === '/rank') {
          if (engine.status === 'idle' || engine.status === 'installing') void loadEngine(cfg);
          await handleRank(JSON.parse((await readBody(req)) || '{}'), res);
          return;
        }
        respond(res, 404, { status: 'not_found' });
      } catch (error) {
        respond(res, 500, { status: 'error', detail: String((error as Error)?.message || error).slice(0, 200) });
      }
    });

    server.on('error', () => {
      // fail-open — no discovery file means the hook never calls us
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') return;
      try {
        mkdirSync(hookStateDir(), { recursive: true });
        writeFileSync(
          discoveryPath(),
          JSON.stringify({ port: address.port, token, model: engine.model, pid: process.pid, startedAt: Date.now() }),
          'utf8',
        );
      } catch {
        // no discovery file → feature stays dormant
      }
      // Warm up in the background so the first prompt after startup can
      // already be served (or cleanly told 503).
      void loadEngine(cfg);
    });

    server.unref();
    const cleanup = () => {
      try {
        const info = JSON.parse(readFileSync(discoveryPath(), 'utf8'));
        if (info.pid === process.pid) unlinkSync(discoveryPath());
      } catch {
        // best-effort
      }
    };
    process.on('exit', cleanup);
  } catch {
    // fail-open
  }
}
