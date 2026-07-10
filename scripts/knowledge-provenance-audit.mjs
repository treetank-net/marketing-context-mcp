#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.env.MARKETING_CONTEXT_DIR || resolve(here, '..', 'knowledge'));

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

const legacyBaseline = new Set([
  'INDEX.md',
  'analytics/consent-mode-gtm-operational.md',
  'analytics/ga4-gtm-operational.md',
  'general/account-management-philosophy.md',
  'general/copywriting-principles.md',
  'general/polish-language-style.md',
  'general/task-operating-model.md',
  'google-ads/account-hygiene-diagnostics.md',
  'google-ads/always-never-checklist.md',
  'google-ads/bidding-strategies.md',
  'google-ads/budget-scaling-seasonality.md',
  'google-ads/conversions-analytics-tracking.md',
  'google-ads/display-youtube-demandgen-remarketing.md',
  'google-ads/feed-optimization-detailed.md',
  'google-ads/google-ads-api-gotchas.md',
  'google-ads/google-ads-daily-check.md',
  'google-ads/google-ads-monthly-review.md',
  'google-ads/industries-platforms-special-cases.md',
  'google-ads/keyword-planner-api.md',
  'google-ads/merchant-center-feed.md',
  'google-ads/product-bucketing-detailed.md',
  'google-ads/product-bucketing.md',
  'google-ads/search-keywords-copywriting.md',
  'google-ads/shopping-pmax.md',
  'google-ads/zz-google-ads-baby-implications.md',
  'reporting/looker-studio.md',
  'reporting/monthly-client-review.md',
]);

const legacy = [];
const missingSource = [];
for (const file of await walk(root)) {
  const rel = file.slice(root.length + 1);
  if (rel.startsWith('clients/')) continue;
  const body = await readFile(file, 'utf8');
  if (/\bBDOS(?:-AI)?\b/i.test(body)) legacy.push(rel);
  if (rel !== 'INDEX.md' && !/^source:\s*\[[^\]]+\]/m.test(body)) missingSource.push(rel);
}

const newLegacy = legacy.filter((file) => !legacyBaseline.has(file));
const resolved = [...legacyBaseline].filter((file) => !legacy.includes(file));
const strict = process.env.PROVENANCE_STRICT === '1';

console.log(`# Provenance audit — ${root}`);
console.log(`Legacy markers: ${legacy.length}; resolved from baseline: ${resolved.length}`);
if (legacy.length) console.log(legacy.map((file) => `  legacy: ${file}`).join('\n'));
if (resolved.length) console.log(resolved.map((file) => `  resolved: ${file}`).join('\n'));
if (missingSource.length) console.log(missingSource.map((file) => `  missing source: ${file}`).join('\n'));
if (newLegacy.length) console.error(newLegacy.map((file) => `  NEW legacy dependency: ${file}`).join('\n'));

const failed = missingSource.length > 0 || newLegacy.length > 0 || (strict && legacy.length > 0);
console.log(failed ? 'FAIL' : 'OK');
process.exit(failed ? 1 : 0);
