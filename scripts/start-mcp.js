#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

// The stamp certifies a COMPLETE install (written after a verified full
// download, or committed with the repo for git checkouts). package.json alone
// can lie: pre-0.3.1 updaters fetched it without hook.cjs, leaving installs
// half-new forever with no version mismatch to trigger a retry.
function stampedVersion() {
  try {
    return JSON.parse(readFileSync(stampPath, 'utf8')).version || null;
  } catch {
    return null;
  }
}

async function download(remotePath, localPath) {
  const res = await fetch(`${REPO_RAW}/${remotePath}`);
  if (!res.ok) return false;
  mkdirSync(dirname(localPath), { recursive: true });
  writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
  return true;
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
// (update_config auto_update=false); the env var stays as a kill-switch.
function autoUpdateDisabled() {
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

async function autoUpdate() {
  if (autoUpdateDisabled()) return;
  try {
    const res = await fetch(`${REPO_RAW}/package.json`);
    if (!res.ok) return;
    const remote = await res.json();
    const target = remote.version || '0.0.0';
    if (target === localVersion() && stampedVersion() === target) return;

    process.stderr.write(`Updating marketing-context-mcp ${localVersion()} -> ${target}...\n`);

    const okBundle = await download('bundle.cjs', bundle);
    const okHook = await download('hook.cjs', join(root, 'hook.cjs'));
    await download('scripts/start-mcp.js', join(root, 'scripts', 'start-mcp.js'));
    await download('CHANGELOG.md', join(root, 'CHANGELOG.md'));
    await syncKnowledge();
    // package.json goes last: a crash before this point leaves the old version
    // on disk, so the next start retries the whole download.
    await download('package.json', pkgPath);

    if (okBundle && okHook) {
      writeFileSync(stampPath, JSON.stringify({ version: target }));
      process.stderr.write(`Updated to ${target}.\n`);
    } else {
      process.stderr.write('Update incomplete (network error); will retry on next start.\n');
    }
  } catch {
    // Network error: start with the local bundle.
  }
}

await autoUpdate();

if (!existsSync(bundle)) {
  process.stderr.write(`Missing MCP server bundle at ${bundle}.\n`);
  process.exit(1);
}

const child = spawn('node', [bundle], {
  cwd: root,
  env: { ...process.env, CLAUDE_PLUGIN_ROOT: root },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 1));
