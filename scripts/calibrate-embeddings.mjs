#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const prompts = process.argv.slice(2);
if (prompts.length === 0) {
  prompts.push(
    'Review a Google Ads account with Performance Max campaigns and a product feed.',
    'How should we test creatives in Meta Ads and scale the budget?',
    'Refactor the TypeScript hook code without doing any advertising account work.',
  );
}

const discoveryPath = process.env.MARKETING_CONTEXT_EMBED_DISCOVERY ||
  join(tmpdir(), 'marketing-context-hook', 'embed-endpoint.json');

let endpoint;
try {
  endpoint = JSON.parse(readFileSync(discoveryPath, 'utf8'));
} catch {
  console.error(`No embedding endpoint discovery file found at ${discoveryPath}. Start the MCP server first.`);
  process.exit(1);
}

const port = Number(endpoint.port);
const token = String(endpoint.token || '');
if (!port || !token) {
  console.error(`Invalid embedding endpoint discovery file at ${discoveryPath}.`);
  process.exit(1);
}

for (const prompt of prompts) {
  const res = await fetch(`http://127.0.0.1:${port}/rank`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: prompt, limit: 8 }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`\n# ${prompt}`);
  if (!res.ok) {
    console.log(`${res.status} ${JSON.stringify(data)}`);
    continue;
  }
  for (const match of data.matches || []) {
    console.log(`${Number(match.similarity).toFixed(4)}\t${match.path}`);
  }
}
