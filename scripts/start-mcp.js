#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bundle = join(root, 'bundle.cjs');
const pkgPath = join(root, 'package.json');
const stampPath = join(root, '.update-stamp.json');

const REPO_RAW = 'https://raw.githubusercontent.com/treetank-net/marketing-context-mcp/master';
const REPO_TREE = 'https://api.github.com/repos/treetank-net/marketing-context-mcp/git/trees/master?recursive=1';

function localVersion() {
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function download(remotePath, localPath) {
  const res = await fetch(`${REPO_RAW}/${remotePath}`);
  if (!res.ok) return false;
  const staging = `${localPath}.download`;
  try {
    mkdirSync(dirname(localPath), { recursive: true });
    writeFileSync(staging, Buffer.from(await res.arrayBuffer()));
    renameSync(staging, localPath);
    return true;
  } catch {
    rmSync(staging, { force: true });
    return false;
  }
}

// Knowledge articles ship with the git install but were never refreshed by
// self-update. Pull the current file list from the repo tree so content
// updates reach installs without /plugin update. Best-effort per file.
async function syncKnowledge() {
  try {
    const res = await fetch(REPO_TREE);
    if (!res.ok) return;
    const tree = (await res.json()).tree || [];
    const files = tree.filter((e) => e.type === 'blob' && e.path.startsWith('knowledge/'));
    await Promise.all(files.map((e) => download(e.path, join(root, e.path)).catch(() => false)));
  } catch {
    // keep the local copy
  }
}

// Durable opt-out lives in the context dir's .marketing-context.json
// (update_config auto_update=false); the env var stays as a kill-switch. It now
// governs the knowledge refresh only — code updates never run on start.
function knowledgeSyncDisabled() {
  if (process.env.MARKETING_CONTEXT_NO_UPDATE === '1') return true;
  try {
    const contextDir = process.env.MARKETING_CONTEXT_DIR || process.env.MARKETING_KNOWLEDGE_DIR;
    if (!contextDir) return false;
    const marker = JSON.parse(readFileSync(join(contextDir, '.marketing-context.json'), 'utf8'));
    return marker.auto_update === false;
  } catch {
    return false;
  }
}

// The stamp certifies a COMPLETE install: bundle.cjs and hook.cjs both present
// at the recorded version. package.json alone can lie — pre-0.3.1 updaters
// fetched it without hook.cjs, leaving installs half-new with no mismatch to
// trigger a retry.
// Code updates run ONLY through the update_plugin tool. A start-up fetch used
// to overwrite freshly installed newer files with whatever raw.githubusercontent
// had cached, so the wrapper now downloads the runtime exactly once: when there
// is no bundle or hook on disk.
async function fetchRuntimeOnce() {
  process.stderr.write('marketing-context-mcp: runtime files missing, fetching them once...\n');
  try {
    const okBundle = existsSync(bundle) || (await download('bundle.cjs', bundle));
    const hookPath = join(root, 'hook.cjs');
    const okHook = existsSync(hookPath) || (await download('hook.cjs', hookPath));
    await download('package.json', pkgPath);
    if (okBundle && okHook) {
      const target = localVersion();
      writeFileSync(`${stampPath}.download`, JSON.stringify({ version: target }));
      renameSync(`${stampPath}.download`, stampPath);
      process.stderr.write(`marketing-context-mcp: runtime fetched (${target}).\n`);
    } else {
      process.stderr.write('marketing-context-mcp: fetch incomplete (network error); will retry on next start.\n');
    }
  } catch {
    // Network error: fall through to the existence check below.
  }
}

if (!existsSync(bundle) || !existsSync(join(root, 'hook.cjs'))) await fetchRuntimeOnce();

// Knowledge articles are CONTENT, not code: they carry no version and are
// refreshed on every start so library edits reach installs without an update.
if (!knowledgeSyncDisabled()) await syncKnowledge();

if (!existsSync(bundle)) {
  process.stderr.write(`Missing MCP server bundle at ${bundle} and it could not be fetched. Reinstall the plugin.\n`);
  process.exit(1);
}

const child = spawn('node', [bundle], {
  cwd: root,
  env: { ...process.env, CLAUDE_PLUGIN_ROOT: root },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 1));
