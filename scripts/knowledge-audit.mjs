#!/usr/bin/env node
/**
 * Knowledge base hygiene audit — run with: node scripts/knowledge-audit.mjs
 *
 * Checks the knowledge/ library for:
 *  - frontmatter that fails to parse or misses summary/source
 *  - broken `related` links (target file does not exist)
 *  - orphans (no incoming `related` link)
 *  - case-study cross-linking coverage
 *
 * Self-contained (inlines a flat-frontmatter parser matching src/storage.ts),
 * so it works on a fresh checkout without a build. Resolves the knowledge dir
 * from MARKETING_CONTEXT_DIR, else ../knowledge relative to this script.
 * Exits non-zero if broken links or missing source/summary are found.
 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.env.MARKETING_CONTEXT_DIR || resolve(here, '..', 'knowledge'));

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return {};
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return {};
  const fm = {};
  for (const line of raw.slice(4, end).split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const [, k, rawv] = m;
    const v = rawv.trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      fm[k] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (/^-?\d+(\.\d+)?$/.test(v)) fm[k] = Number(v);
    else fm[k] = v.replace(/^["']|["']$/g, '');
  }
  return fm;
}

async function walk(d) {
  const out = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = resolve(d, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = await walk(root);
const docs = {};
for (const f of files) {
  const rel = f.replace(root + '/', '');
  // Client logs use a different schema and are not library articles.
  if (rel === 'INDEX.md' || rel.startsWith('clients/')) continue;
  const fm = parseFrontmatter(await readFile(f, 'utf8'));
  docs[rel] = {
    related: Array.isArray(fm.related) ? fm.related : fm.related ? [fm.related] : [],
    hasSource: !!fm.source,
    hasSummary: !!fm.summary,
  };
}

const all = new Set(Object.keys(docs));
const incoming = Object.fromEntries([...all].map((k) => [k, 0]));
let broken = 0;
let meta = 0;

console.log('# Knowledge audit —', root);
console.log(`Files (excl INDEX.md): ${all.size}\n`);

console.log('## Frontmatter gaps (missing summary/source)');
for (const [k, v] of Object.entries(docs)) {
  const gaps = [];
  if (!v.hasSummary) gaps.push('summary');
  if (!v.hasSource) gaps.push('source');
  if (gaps.length) { console.log(`  ${k}: missing ${gaps.join(', ')}`); meta++; }
}
if (!meta) console.log('  (none)');

console.log('\n## Broken related links');
for (const [k, v] of Object.entries(docs))
  for (const r of v.related) {
    if (!all.has(r)) { console.log(`  ${k} -> ${r}`); broken++; }
    else incoming[r]++;
  }
if (!broken) console.log('  (none)');

console.log('\n## Orphans (no incoming related link)');
const orphans = [...all].filter((k) => incoming[k] === 0).sort();
console.log(orphans.length ? orphans.map((o) => '  ' + o).join('\n') : '  (none)');

console.log('\n## Case-study cross-linking');
const cs = 'general/case-studies.md';
if (docs[cs]) console.log(`  incoming links to ${cs}: ${incoming[cs]}`);
else console.log('  (no case-studies.md)');

const failed = broken + meta;
console.log(`\n${failed ? 'FAIL' : 'OK'} — broken:${broken} meta-gaps:${meta} orphans:${orphans.length}`);
process.exit(broken || meta ? 1 : 0);
