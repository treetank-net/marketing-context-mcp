#!/usr/bin/env node
// Conformance check for the mutation-safety contract.
// Verifies each ads-platform plugin exposes the shared kernel tools by exact name,
// logs to mutation-history.jsonl, and carries the required log-record fields.
// The contract (docs/mutation-safety-contract.md) is the single source of truth:
// this script parses the machine-readable regions from it, so editing the contract
// changes what is enforced. No dependencies.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
// .claude/skills/plugin-contract-guard/ -> repo root is three levels up.
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const CONTRACT_PATH = join(REPO_ROOT, 'docs', 'mutation-safety-contract.md');

function fail(msg) {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}
function ok(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

// --- parse the contract's machine-readable regions ---
function parseRegion(text, name) {
  const re = new RegExp(`<!-- ${name}:start -->([\\s\\S]*?)<!-- ${name}:end -->`);
  const m = text.match(re);
  if (!m) throw new Error(`contract region "${name}" not found in ${CONTRACT_PATH}`);
  const fence = m[1].match(/```([\s\S]*?)```/);
  const body = fence ? fence[1] : m[1];
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

let contract;
try {
  contract = readFileSync(CONTRACT_PATH, 'utf-8');
} catch {
  fail(`cannot read contract at ${CONTRACT_PATH}`);
  process.exit(2);
}

const KERNEL_TOOLS = parseRegion(contract, 'kernel-tools');
// log fields: lines look like "timestamp   required  ISO-8601 string"
const REQUIRED_LOG_FIELDS = parseRegion(contract, 'log-fields')
  .map((l) => l.split(/\s+/))
  .filter((parts) => parts[1] === 'required')
  .map((parts) => parts[0])
  .filter((f) => !f.startsWith('<')); // <accountId> is a variation point, skip

// --- locate plugins ---
const args = process.argv.slice(2);
const pluginPaths =
  args.length > 0
    ? args
    : [resolve(REPO_ROOT, '..', 'google-ads-baby'), resolve(REPO_ROOT, '..', 'meta-ads-baby')];

// --- helpers ---
function walkTs(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e === 'node_modules' || e === 'dist') continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walkTs(p, acc);
    else if (e.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

function extractToolNames(srcDir) {
  const names = new Set();
  const re = /server\.tool\(\s*['"]([a-z0-9_]+)['"]/g;
  for (const file of walkTs(srcDir)) {
    const content = readFileSync(file, 'utf-8');
    let m;
    while ((m = re.exec(content)) !== null) names.add(m[1]);
  }
  return names;
}

function readAll(srcDir) {
  return walkTs(srcDir)
    .map((f) => {
      try {
        return readFileSync(f, 'utf-8');
      } catch {
        return '';
      }
    })
    .join('\n');
}

// --- run ---
console.log(`Contract: ${KERNEL_TOOLS.length} kernel tools, ${REQUIRED_LOG_FIELDS.length} required log fields\n`);

let violations = 0;

for (const pluginPath of pluginPaths) {
  const name = pluginPath.split('/').filter(Boolean).pop();
  const srcDir = join(pluginPath, 'server', 'src');
  let stat;
  try {
    stat = statSync(srcDir);
  } catch {
    fail(`${name}: no server/src at ${srcDir} — skipping (pass an explicit path?)`);
    violations++;
    continue;
  }
  if (!stat.isDirectory()) continue;

  console.log(`\n=== ${name} ===`);

  // 1. kernel tools present by exact name
  const tools = extractToolNames(srcDir);
  const missing = KERNEL_TOOLS.filter((t) => !tools.has(t));
  if (missing.length === 0) {
    ok(`all ${KERNEL_TOOLS.length} kernel tools present`);
  } else {
    for (const t of missing) fail(`kernel tool missing or renamed: ${t}`);
    violations += missing.length;
  }

  const src = readAll(srcDir);

  // 2. mutation-history.jsonl filename
  if (src.includes('mutation-history.jsonl')) {
    ok('logs to mutation-history.jsonl');
  } else {
    fail('mutation-history.jsonl filename not found');
    violations++;
  }

  // 3. required log fields present in a HistoryEntry-like type
  const entryMatch = src.match(/interface\s+HistoryEntry\s*\{([\s\S]*?)\}/);
  if (!entryMatch) {
    fail('no HistoryEntry interface found');
    violations++;
  } else {
    const body = entryMatch[1];
    const missingFields = REQUIRED_LOG_FIELDS.filter(
      (f) => !new RegExp(`\\b${f}\\b\\s*[?:]`).test(body)
    );
    if (missingFields.length === 0) {
      ok(`all ${REQUIRED_LOG_FIELDS.length} required log fields present`);
    } else {
      for (const f of missingFields) fail(`log field missing: ${f}`);
      violations += missingFields.length;
    }
    // account-id variation point: must have exactly one of the known names
    if (/\bcustomerId\b/.test(body) || /\badAccountId\b/.test(body)) {
      ok('account-id field present (variation point)');
    } else {
      fail('no account-id field (expected customerId or adAccountId)');
      violations++;
    }
  }
}

console.log('');
if (violations === 0) {
  ok('contract conformant');
  process.exit(0);
} else {
  fail(`${violations} contract violation(s) — reconcile against docs/mutation-safety-contract.md`);
  process.exit(1);
}
