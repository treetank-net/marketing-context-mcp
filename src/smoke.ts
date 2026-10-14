import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderClientContext, tailLogEntries } from './tools/knowledge.js';
import { readKnowledgeMode, SETTING_DEFAULTS, type MarketingContextConfig } from './config.js';
import { appendJsonl, appendMarkdownLog, appendTaskNote, computeNextDue, copyBundledKnowledge, createTask, detectShadowedKnowledge, listClientNotes, listDueTasks, listKnowledgeFiles, listTasks, markTaskRun, readKnowledgeFile, resolveInsideRoot, updateContextSettings, updateTaskStatus, upsertMarkdownSection } from './storage.js';

const rootDir = await mkdtemp(join(tmpdir(), 'marketing-context-smoke-'));
const cfg: MarketingContextConfig = { rootDir, knowledgeMode: 'plugin', settings: { ...SETTING_DEFAULTS } };

// A shared knowledge doc plus per-client notes under clients/.
await upsertMarkdownSection(cfg, 'general/sample.md', 'Note', 'Shared knowledge.');
await upsertMarkdownSection(cfg, 'clients/acme/profile.md', 'Basics', 'Sells widgets.');
await appendMarkdownLog(cfg, 'clients/acme/decision-log.md', 'google-ads', 'Do not scale above api_key=secret123.');
await appendJsonl(cfg, 'clients/acme/mutation-log.jsonl', { token: 'abc123', result: 'ok' });

// clients/ notes must NOT appear in the knowledge pool.
const docs = await listKnowledgeFiles(cfg);
if (docs.length !== 1) throw new Error(`Expected 1 knowledge doc (clients/ excluded), got ${docs.length}.`);

// Client notes are read separately, markdown only (no JSONL logs).
const notes = await listClientNotes(cfg);
if (notes.length !== 2) throw new Error(`Expected 2 client notes (md only), got ${notes.length}.`);

const decision = await readFile(resolveInsideRoot(cfg, 'clients/acme/decision-log.md'), 'utf8');
if (!decision.includes('[REDACTED]')) throw new Error('Secret redaction failed.');

try {
  resolveInsideRoot(cfg, '../escape.md');
  throw new Error('Path traversal was not rejected.');
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('escapes')) throw error;
}

// --- layered knowledge: bundled base + context-dir overlay ---
const bundledDir = await mkdtemp(join(tmpdir(), 'marketing-context-bundled-'));
const overlayDir = await mkdtemp(join(tmpdir(), 'marketing-context-overlay-'));
await mkdir(join(bundledDir, 'google-ads'), { recursive: true });
await writeFile(join(bundledDir, 'google-ads', 'base.md'), '# Base article\nShipped.', 'utf8');
await writeFile(join(bundledDir, 'google-ads', 'override.md'), '# Shipped version\nOld.', 'utf8');
await mkdir(join(overlayDir, 'google-ads'), { recursive: true });
await writeFile(join(overlayDir, 'google-ads', 'override.md'), '# User version\nNew.', 'utf8');
await writeFile(join(overlayDir, 'google-ads', 'own.md'), '# Own article\nMine.', 'utf8');
const layered: MarketingContextConfig = { rootDir: overlayDir, bundledDir, knowledgeMode: 'unset', settings: { ...SETTING_DEFAULTS } };

const layeredDocs = await listKnowledgeFiles(layered);
if (layeredDocs.length !== 3) throw new Error(`Layered pool should have 3 docs, got ${layeredDocs.length}.`);
if ((await readKnowledgeFile(layered, 'google-ads/override.md')).title !== 'User version') throw new Error('Context overlay should win on path conflict.');
if ((await readKnowledgeFile(layered, 'google-ads/base.md')).title !== 'Base article') throw new Error('Bundled fallback read failed.');

const shadowed = await detectShadowedKnowledge(layered);
if (shadowed.length !== 1 || shadowed[0].path !== 'google-ads/override.md' || shadowed[0].identical) {
  throw new Error(`Shadow detection wrong: ${JSON.stringify(shadowed)}`);
}

// copy mode: seed never overwrites, marker persists, context dir owns the pool
const seeded = await copyBundledKnowledge(layered);
if (seeded.copied.length !== 1 || seeded.skipped.length !== 1) {
  throw new Error(`Seed should copy 1 and skip 1, got ${seeded.copied.length}/${seeded.skipped.length}.`);
}
if ((await readKnowledgeFile(layered, 'google-ads/override.md')).title !== 'User version') throw new Error('Seed overwrote a user file.');
await updateContextSettings(layered, { knowledge_mode: 'copy', auto_update: false }, { seeded_version: 'smoke' });
if (layered.knowledgeMode !== 'copy') throw new Error('updateContextSettings did not update cfg mode in place.');
if (layered.settings.auto_update !== false) throw new Error('updateContextSettings did not update cfg settings in place.');
if (readKnowledgeMode(overlayDir) !== 'copy') throw new Error('Knowledge mode marker not persisted.');
const copyDocs = await listKnowledgeFiles(layered);
if (copyDocs.length !== 3) throw new Error(`Copy-mode pool should have 3 docs (context dir only), got ${copyDocs.length}.`);

// --- setup tools: get_context_health + update_config round-trip ---
const { registerSetupTools } = await import('./tools/setup.js');
const setupHandlers: Record<string, (args: any) => Promise<{ content: Array<{ text: string }> }>> = {};
registerSetupTools({ tool: (name: string, _d: string, _s: unknown, h: any) => { setupHandlers[name] = h; } } as any, layered);

const health = JSON.parse((await setupHandlers['get_context_health']({})).content[0].text);
if (health.knowledge_mode !== 'copy') throw new Error(`Health should report copy mode, got ${health.knowledge_mode}.`);
if (health.config.stored.auto_update !== false) throw new Error('Health should report stored auto_update=false.');
if (health.knowledge.active_docs !== 3) throw new Error('Health active_docs wrong.');

const cfgOut = JSON.parse((await setupHandlers['update_config']({ knowledge_mode: 'plugin', debug: true })).content[0].text);
if (cfgOut.status !== 'ok') throw new Error(`update_config failed: ${JSON.stringify(cfgOut)}`);
if ((layered.knowledgeMode as string) !== 'plugin' || layered.settings.debug !== true) throw new Error('update_config did not apply to live config.');
if (readKnowledgeMode(overlayDir) !== 'plugin') throw new Error('update_config did not persist knowledge_mode.');

// --- knowledge tools: plain markdown out, router metadata stripped ---
const knowledgeDir = await mkdtemp(join(tmpdir(), 'marketing-context-knowledge-'));
await mkdir(join(knowledgeDir, 'google-ads'), { recursive: true });
await writeFile(
  join(knowledgeDir, 'google-ads', 'rendered.md'),
  [
    '---',
    'keywords: [budget, scaling]',
    'applies_to: [google-ads]',
    'task_type: [workflow]',
    'priority: 4',
    'inject: summary',
    'related: [google-ads/other.md, general/philosophy.md]',
    'source: ["https://example.test/doc", "src/tools/write.ts"]',
    'summary: "Duplicated by the hook injection; must not appear in the tool response."',
    '---',
    '',
    '# Rendered article',
    '',
    'Body line.',
  ].join('\n'),
  'utf8',
);
await writeFile(join(knowledgeDir, 'google-ads', 'headless.md'), 'No heading here.\n', 'utf8');
const knowledgeCfg: MarketingContextConfig = { rootDir: knowledgeDir, knowledgeMode: 'copy', settings: { ...SETTING_DEFAULTS } };
const { registerKnowledgeTools } = await import('./tools/knowledge.js');
const knowledgeHandlers: Record<string, (args: any) => Promise<{ content: Array<{ text: string }> }>> = {};
registerKnowledgeTools({ tool: (name: string, _d: string, _s: unknown, h: any) => { knowledgeHandlers[name] = h; } } as any, knowledgeCfg);

const article = (await knowledgeHandlers['read_knowledge']({ path: 'google-ads/rendered.md' })).content[0].text;
if (article.trimStart().startsWith('{')) throw new Error('read_knowledge must return markdown, not JSON.');
if (article.includes('\\n')) throw new Error('read_knowledge must not escape newlines.');
if (!article.includes('# Rendered article\n\nBody line.')) throw new Error('read_knowledge lost the article body.');
if (!article.includes('Path: google-ads/rendered.md')) throw new Error('read_knowledge dropped the path.');
if (!article.includes('Related: google-ads/other.md, general/philosophy.md')) throw new Error('read_knowledge dropped related.');
if (!article.includes('Sources: https://example.test/doc, src/tools/write.ts')) throw new Error('read_knowledge dropped sources.');
for (const leaked of ['keywords', 'applies_to', 'task_type', 'priority', 'inject', 'Duplicated by the hook']) {
  if (article.includes(leaked)) throw new Error(`read_knowledge leaked router metadata: ${leaked}.`);
}
if (article.match(/# Rendered article/g)?.length !== 1) throw new Error('read_knowledge duplicated the H1 title.');

const headless = (await knowledgeHandlers['read_knowledge']({ path: 'google-ads/headless.md' })).content[0].text;
if (!headless.includes('# headless\n\nNo heading here.')) throw new Error('read_knowledge should add a title when the body has no H1.');
if (headless.includes('---\n')) throw new Error('read_knowledge should omit an empty footer.');

const listed = (await knowledgeHandlers['list_knowledge']({})).content[0].text;
if (listed.trimStart().startsWith('[')) throw new Error('list_knowledge must return text lines, not JSON.');
if (!listed.includes('google-ads/rendered.md — Rendered article')) throw new Error('list_knowledge lost path/title.');
if (listed.includes('keywords')) throw new Error('list_knowledge leaked router metadata.');

const found = (await knowledgeHandlers['search_knowledge']({ query: 'rendered article', limit: 10 })).content[0].text;
if (!found.includes('google-ads/rendered.md — Rendered article')) throw new Error('search_knowledge lost its hit.');
if (found.trimStart().startsWith('[')) throw new Error('search_knowledge must return text lines, not JSON.');

// --- tasks: storage round-trip ---
const task = await createTask(cfg, {
  client_slug: 'acme',
  title: 'Review budget for Search Brand',
  platform: 'google-ads',
  priority: 'high',
  reason: 'ROAS above target and 22% lost impression share due to budget.',
  suggested_workflow: 'google-ads/budget-scaling-seasonality.md',
  knowledge: ['google-ads/budget-scaling-seasonality.md'],
  source_type: 'review',
  source_ref: 'daily-check 2026-07',
});
if (!task.path.startsWith('clients/acme/tasks/')) throw new Error(`Unexpected task path: ${task.path}`);
if (task.status !== 'open' || task.priority !== 'high') throw new Error('Task frontmatter defaults wrong.');

// secrets are redacted in task bodies too
const secretTask = await createTask(cfg, { client_slug: 'acme', title: 'Rotate creds', reason: 'api_key=supersecret123 must go' });
if ((await readFile(resolveInsideRoot(cfg, secretTask.path), 'utf8')).includes('supersecret123')) {
  throw new Error('Task body secret not redacted.');
}

// tasks must NOT leak into client notes or the knowledge pool
if ((await listClientNotes(cfg)).some((n) => n.path.includes('/tasks/'))) throw new Error('Tasks leaked into client notes.');
if ((await listKnowledgeFiles(cfg)).some((d) => d.path.includes('/tasks/'))) throw new Error('Tasks leaked into knowledge pool.');

// list + filters
if ((await listTasks(cfg, { client_slug: 'acme', status: 'open' })).length !== 2) throw new Error('Expected 2 open tasks.');
if ((await listTasks(cfg, { priority: 'high' })).length !== 1) throw new Error('Priority filter failed.');

// update status (resolve by id) + append note (resolve by path); trace persisted
const done = await updateTaskStatus(cfg, task.id, 'done', 'Prepared +20% via prepare_budget_change; confirmed.');
if (done.status !== 'done') throw new Error('Status update failed.');
await appendTaskNote(cfg, task.path, 'Monitoring for 3 days.');
const doneRaw = await readFile(resolveInsideRoot(cfg, task.path), 'utf8');
if (!/\nstatus: done\b/.test(doneRaw)) throw new Error('Task status not persisted to frontmatter.');
if (!doneRaw.includes('status → done') || !doneRaw.includes('Monitoring for 3 days')) throw new Error('Task trace/note not written.');
if ((await listTasks(cfg, { client_slug: 'acme', status: 'open' })).length !== 1) throw new Error('Closing a task did not change open count.');

// --- tasks: hook surfaces active tasks once a client/platform is in play ---
const taskSession = `task-smoke-${randomUUID()}`;
const taskInject = await runHook(
  { hook_event_name: 'UserPromptSubmit', session_id: taskSession, prompt: 'What should I do next on Google Ads for this account?' },
  { MARKETING_CONTEXT_DIR: rootDir, MARKETING_CONTEXT_SEMANTIC: '0' },
);
if (!taskInject.includes('Active tasks')) {
  throw new Error(`Task injection missing. session=${taskSession} root=${rootDir} Output: ${taskInject.slice(0, 400)}`);
}

// --- recurring tasks + scheduling ---
if (computeNextDue('weekly', '2026-07-07T09:00:00.000Z') !== '2026-07-14T09:00:00.000Z') {
  throw new Error('weekly alias next_due wrong.');
}
if (computeNextDue('monthly', '2026-07-07T09:00:00.000Z') !== '2026-08-07T09:00:00.000Z') {
  throw new Error('monthly alias next_due wrong.');
}
const cronNext = computeNextDue('0 9 * * MON', '2026-07-07T00:00:00.000Z');
{
  const d = new Date(String(cronNext));
  if (d.getUTCDay() !== 1 || d.getUTCHours() !== 9 || d.getUTCMinutes() !== 0 || String(cronNext) <= '2026-07-07') {
    throw new Error(`cron next Monday 09:00 wrong: ${cronNext}`);
  }
}

// all recurrence aliases (from Tue 2026-07-07T09:00Z)
const aliasBase = '2026-07-07T09:00:00.000Z';
const aliasExpect: Record<string, string> = {
  daily: '2026-07-08T09:00:00.000Z',
  weekly: '2026-07-14T09:00:00.000Z',
  biweekly: '2026-07-21T09:00:00.000Z',
  monthly: '2026-08-07T09:00:00.000Z',
  quarterly: '2026-10-07T09:00:00.000Z',
  yearly: '2027-07-07T09:00:00.000Z',
  annually: '2027-07-07T09:00:00.000Z',
};
for (const [alias, want] of Object.entries(aliasExpect)) {
  const got = computeNextDue(alias, aliasBase);
  if (got !== want) throw new Error(`alias ${alias} next_due: got ${got}, want ${want}`);
}
// monthly overflow: Jan 31 + 1 month rolls through short February (documented quirk)
if (computeNextDue('monthly', '2026-01-31T09:00:00.000Z') !== '2026-03-03T09:00:00.000Z') {
  throw new Error('monthly overflow behaviour changed.');
}

// cron patterns: exact ISO where date math is unambiguous
const cronExpect: Array<[string, string, string]> = [
  ['0 0 1 * *', '2026-07-07T00:00:00.000Z', '2026-08-01T00:00:00.000Z'], // day-of-month
  ['30 8 1,15 * *', '2026-07-07T00:00:00.000Z', '2026-07-15T08:30:00.000Z'], // list, 15th before next 1st
  ['*/15 * * * *', '2026-07-07T09:07:30.000Z', '2026-07-07T09:15:00.000Z'], // step minutes
  ['0 0 1 1 *', '2026-07-07T00:00:00.000Z', '2027-01-01T00:00:00.000Z'], // year rollover
];
for (const [expr, from, want] of cronExpect) {
  const got = computeNextDue(expr, from);
  if (got !== want) throw new Error(`cron "${expr}" next_due: got ${got}, want ${want}`);
}
// weekday range 1-5 (Mon-Fri) from a Saturday → next match is a weekday at 09:00, strictly later
{
  const from = '2026-07-11T12:00:00.000Z';
  const got = computeNextDue('0 9 * * 1-5', from);
  const d = new Date(String(got));
  if (!got || String(got) <= from || d.getUTCHours() !== 9 || d.getUTCMinutes() !== 0 || d.getUTCDay() < 1 || d.getUTCDay() > 5) {
    throw new Error(`cron weekday-range wrong: ${got}`);
  }
}
// DOM and DOW both restricted → OR semantics: result matches day 13 OR Sunday, and is no later than the DOM-only match
{
  const orNext = computeNextDue('0 0 13 * 0', '2026-07-07T00:00:00.000Z');
  const domOnly = computeNextDue('0 0 13 * *', '2026-07-07T00:00:00.000Z');
  const d = new Date(String(orNext));
  if (!orNext || (d.getUTCDate() !== 13 && d.getUTCDay() !== 0) || String(orNext) > String(domOnly)) {
    throw new Error(`cron DOM/DOW OR semantics wrong: ${orNext} vs domOnly ${domOnly}`);
  }
}
// unparseable schedules → undefined (never a bogus date)
for (const bad of ['not-a-schedule', '* *', '99 * * * *', '0 9 * * XYZ']) {
  if (computeNextDue(bad, aliasBase) !== undefined) throw new Error(`bad schedule "${bad}" should be undefined.`);
}
// a one-off open task with no due date is actionable now (isTaskDue: no next_due → due)
if (!(await listDueTasks(cfg, { client_slug: 'acme' })).some((t) => t.path === secretTask.path)) {
  throw new Error('One-off open task should be due now.');
}

const rec = await createTask(cfg, {
  client_slug: 'acme',
  title: 'Weekly Google Ads check',
  platform: 'google-ads',
  recurring: true,
  schedule: 'weekly',
  suggested_workflow: 'google-ads/google-ads-daily-check.md',
  source_type: 'knowledge',
  source_ref: 'google-ads/google-ads-daily-check.md',
});
if (rec.status !== 'active') throw new Error('Recurring task should default to active.');
if (!rec.next_due) throw new Error('Recurring task should get a next_due.');
// Not due now (scheduled ~7 days out) ...
if ((await listDueTasks(cfg, { client_slug: 'acme' })).some((t) => t.path === rec.path)) {
  throw new Error('Future recurring task should not be due now.');
}
// ... but due well past its next_due.
if (!(await listDueTasks(cfg, { client_slug: 'acme' }, '2099-01-01T00:00:00.000Z')).some((t) => t.path === rec.path)) {
  throw new Error('Recurring task should be due by 2099.');
}
const ran = await markTaskRun(cfg, rec.path, 'Ran daily check; no alerts.');
if (!ran.last_run || !ran.next_due) throw new Error('mark_task_run did not stamp last_run/next_due.');
// next_due must be recomputed from the schedule relative to the run time, not just present
if (ran.next_due !== computeNextDue('weekly', ran.last_run)) {
  throw new Error(`mark_task_run next_due not recomputed from schedule: ${ran.next_due}`);
}
// after running, the task is no longer due until its new next_due
if ((await listDueTasks(cfg, { client_slug: 'acme' })).some((t) => t.path === rec.path)) {
  throw new Error('Recurring task should not be due immediately after a run.');
}
const ranRaw = await readFile(resolveInsideRoot(cfg, rec.path), 'utf8');
if (!ranRaw.includes('— run') || !ranRaw.includes('Next due:')) throw new Error('Run trace not written.');
// explicit next_due override is honored over the schedule
const overridden = await markTaskRun(cfg, rec.path, 'Manual reschedule.', '2030-01-01T00:00:00.000Z');
if (overridden.next_due !== '2030-01-01T00:00:00.000Z') throw new Error('mark_task_run did not honor explicit next_due.');

// --- task templates (workflow articles) → instantiated tasks ---
await mkdir(resolveInsideRoot(cfg, 'google-ads'), { recursive: true });
await writeFile(
  resolveInsideRoot(cfg, 'google-ads/weekly-check.md'),
  [
    '---',
    'applies_to: [google-ads]',
    'task_type: [workflow]',
    'intent: weekly_google_ads_check',
    'default_schedule: weekly',
    'summary: Weekly Google Ads check template.',
    'source: ["smoke"]',
    'related: [general/sample.md]',
    '---',
    '# Weekly Google Ads Check',
    'Steps.',
  ].join('\n'),
  'utf8',
);
const { registerTaskTools } = await import('./tools/tasks.js');
// Exercise the instantiation path directly via storage-backed helper by calling
// the tool logic through a minimal fake server that captures handlers.
const handlers: Record<string, (args: any) => Promise<{ content: Array<{ text: string }> }>> = {};
registerTaskTools({ tool: (name: string, _d: string, _s: unknown, h: any) => { handlers[name] = h; } } as any, cfg);

const templatesOut = await handlers['list_task_templates']({ platform: 'google-ads' });
if (!templatesOut.content[0].text.includes('google-ads/weekly-check.md')) throw new Error('Template not listed.');

await handlers['setup_client_tasks']({ client_slug: 'beta', templates: ['google-ads/weekly-check.md'] });
const betaTasks = await listTasks(cfg, { client_slug: 'beta' });
if (betaTasks.length !== 1) throw new Error(`setup_client_tasks should create 1 task, got ${betaTasks.length}.`);
const t0 = betaTasks[0];
if (t0.suggested_workflow !== 'google-ads/weekly-check.md') throw new Error('Instantiated task missing suggested_workflow.');
if (t0.source_type !== 'knowledge' || !t0.recurring || !t0.next_due) throw new Error('Instantiated task not grounded/recurring.');
if (t0.intent !== 'weekly_google_ads_check') throw new Error('Instantiated task missing intent from template.');

// Semantic hook path: a fake /rank endpoint can mark a matched article as
// required reading, but only ads-platform tools are gated by it.
const semanticRoot = await mkdtemp(join(tmpdir(), 'marketing-context-semantic-smoke-'));
const semanticDiscovery = join(semanticRoot, 'embed-endpoint.json');
await mkdir(join(semanticRoot, 'google-ads'), { recursive: true });
await writeFile(
  join(semanticRoot, 'google-ads', 'always-never-checklist.md'),
  [
    '---',
    'summary: Google Ads baseline.',
    'applies_to: [google-ads]',
    'enforce_read: true',
    '---',
    '# Always Never Checklist',
    'Baseline.',
  ].join('\n'),
  'utf8',
);
await writeFile(
  join(semanticRoot, 'google-ads', 'product-bucketing.md'),
  [
    '---',
    'summary: Product bucketing rules.',
    'applies_to: [google-ads]',
    '---',
    '# Product Bucketing',
    'Bucketing.',
  ].join('\n'),
  'utf8',
);

const token = 'semantic-smoke-token';
const rankServer = createServer((req, res) => {
  if (req.url !== '/rank' || req.headers.authorization !== `Bearer ${token}`) {
    res.writeHead(401).end('{}');
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    matches: [{ path: 'google-ads/product-bucketing.md', applies_to: ['google-ads'], similarity: 0.72 }],
  }));
});
await new Promise<void>((resolve) => rankServer.listen(0, '127.0.0.1', resolve));
const address = rankServer.address();
if (!address || typeof address === 'string') throw new Error('Rank smoke server did not bind.');
await writeFile(semanticDiscovery, JSON.stringify({ port: address.port, token }), 'utf8');

const sessionId = `semantic-smoke-${randomUUID()}`;
await runHook(
  {
    hook_event_name: 'UserPromptSubmit',
    session_id: sessionId,
    prompt: 'Review Google Ads product feed segmentation.',
  },
  {
    MARKETING_CONTEXT_DIR: semanticRoot,
    MARKETING_CONTEXT_EMBED_DISCOVERY: semanticDiscovery,
    MARKETING_CONTEXT_SEMANTIC_TIMEOUT_MS: '1000',
  },
);
const blocked = await runHook(
  {
    hook_event_name: 'PreToolUse',
    session_id: sessionId,
    tool_name: 'mcp__google-ads__get_campaigns',
  },
  {
    MARKETING_CONTEXT_DIR: semanticRoot,
    MARKETING_CONTEXT_EMBED_DISCOVERY: semanticDiscovery,
  },
);
// The platform baseline (enforce_read) still gates every ads tool ...
if (!blocked.includes('google-ads/always-never-checklist.md')) {
  throw new Error(`Baseline required-reading gate missing always-never-checklist.md. Output: ${blocked}`);
}
// ... but a semantically ranked article that has nothing to do with the tool
// being called must not become mandatory reading: that is what let a session's
// chatter dictate the gate.
if (blocked.includes('google-ads/product-bucketing.md')) {
  throw new Error(`Semantic match unrelated to get_campaigns must not be enforced. Output: ${blocked}`);
}
await new Promise<void>((resolve) => rankServer.close(() => resolve()));

// --- semantic shape: the ranking's spread decides, not the absolute cosine ---
// Measured against the live e5 model, every prompt scores 0.79-0.86 against every
// article, so an absolute floor admits the whole library. What separates a topical
// prompt from an off-topic one is whether a leader stands clear of the pack. A flat
// ranking must therefore inject nothing even though every score clears the floor.
const shapeRoot = await mkdtemp(join(tmpdir(), 'marketing-context-shape-smoke-'));
const shapeDiscovery = join(shapeRoot, 'embed-endpoint.json');
await writeFile(join(shapeRoot, '.marketing-context.json'), JSON.stringify({ knowledge_mode: 'copy' }), 'utf8');
await mkdir(join(shapeRoot, 'google-ads'), { recursive: true });
const shapeArticles = ['alfa', 'beta', 'gamma', 'delta'].map((name) => `google-ads/${name}-note.md`);
for (const path of shapeArticles) {
  await writeFile(
    join(shapeRoot, path),
    [
      '---',
      `keywords: [${path.split('/')[1].replace('-note.md', '')}]`,
      'applies_to: [google-ads]',
      'priority: 3',
      `summary: Notatka ${path}.`,
      '---',
      `# ${path}`,
      'Body.',
    ].join('\n'),
    'utf8',
  );
}

const shapeToken = 'shape-smoke-token';
let shapeSimilarities: number[] = [];
const shapeRankServer = createServer((req, res) => {
  if (req.url !== '/rank' || req.headers.authorization !== `Bearer ${shapeToken}`) {
    res.writeHead(401).end('{}');
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    matches: shapeArticles.map((path, index) => ({
      path,
      applies_to: ['google-ads'],
      similarity: shapeSimilarities[index],
    })),
  }));
});
await new Promise<void>((resolve) => shapeRankServer.listen(0, '127.0.0.1', resolve));
const shapeAddress = shapeRankServer.address();
if (!shapeAddress || typeof shapeAddress === 'string') throw new Error('Shape smoke rank server did not bind.');
await writeFile(shapeDiscovery, JSON.stringify({ port: shapeAddress.port, token: shapeToken }), 'utf8');

const shapeEnv = {
  MARKETING_CONTEXT_DIR: shapeRoot,
  MARKETING_CONTEXT_EMBED_DISCOVERY: shapeDiscovery,
  MARKETING_CONTEXT_SEMANTIC_TIMEOUT_MS: '1000',
};
// The first prompt of a session is the table of contents and never reaches the
// semantic path, so both cases need a second round to observe.
async function shapePromptRounds(similarities: number[]): Promise<string> {
  shapeSimilarities = similarities;
  const session = `shape-smoke-${randomUUID()}`;
  await runHook(
    { hook_event_name: 'UserPromptSubmit', session_id: session, prompt: 'Zaczynamy pracę w Google Ads.' },
    shapeEnv,
  );
  return runHook(
    { hook_event_name: 'UserPromptSubmit', session_id: session, prompt: 'Kontynuuj analizę Google Ads.' },
    shapeEnv,
  );
}

const flatShape = await shapePromptRounds([0.8, 0.8, 0.8, 0.8]);
for (const path of shapeArticles) {
  if (flatShape.includes(path)) {
    throw new Error(`A flat ranking injected ${path} — every score clearing the floor is not relevance. Output: ${flatShape.slice(0, 600)}`);
  }
}

const leaderShape = await shapePromptRounds([0.86, 0.8, 0.8, 0.8]);
if (!leaderShape.includes(shapeArticles[0])) {
  throw new Error(`A leader standing clear of the batch median was not injected. Output: ${leaderShape.slice(0, 600)}`);
}
for (const path of shapeArticles.slice(1)) {
  if (leaderShape.includes(path)) {
    throw new Error(`The pack around the median rode in behind the leader (${path}). Output: ${leaderShape.slice(0, 600)}`);
  }
}
await new Promise<void>((resolve) => shapeRankServer.close(() => resolve()));

// --- gate relevance: the required set follows the TOOL, not the session ------
// Reproduces four defects observed in a live Google Ads session: a budget
// change demanding the Looker Studio hygiene workflow and the benchmarks index,
// a Search campaign demanding the Merchant Center feed workflow, confirm_mutation
// demanding a new article between preview and execution, and a pure Google Ads
// session being handed Meta start-pack articles.
const gateRoot = await mkdtemp(join(tmpdir(), 'marketing-context-gate-smoke-'));
const gateDiscovery = join(gateRoot, 'embed-endpoint.json');
await writeFile(join(gateRoot, '.marketing-context.json'), JSON.stringify({ knowledge_mode: 'copy' }), 'utf8');
for (const dir of ['google-ads', 'meta-ads', 'reporting', 'general', 'analytics']) {
  await mkdir(join(gateRoot, dir), { recursive: true });
}
const gateArticles: Array<[string, string[]]> = [
  ['google-ads/always-never-checklist.md', [
    'keywords: [checklista, zawsze, nigdy, kontrola zmian]',
    'applies_to: [google-ads]',
    'priority: 5',
    'enforce_read: true',
    'summary: Google Ads ground rules.',
  ]],
  ['google-ads/budget-scaling-seasonality.md', [
    'keywords: [budżet, skalowanie, sezonowość]',
    'applies_to: [google-ads]',
    'priority: 4',
    'summary: Budget scaling rules.',
  ]],
  ['google-ads/search-keywords-copywriting.md', [
    'keywords: [słowa kluczowe, responsive search ads, copywriting]',
    'applies_to: [google-ads]',
    'priority: 4',
    'summary: Search keywords and ad copy.',
  ]],
  ['google-ads/google-ads-feed-health.md', [
    'keywords: [feed health, merchant center, shopping, pmax]',
    'applies_to: [google-ads]',
    'priority: 4',
    'summary: Merchant Center feed health workflow.',
  ]],
  ['reporting/reporting-refresh.md', [
    'keywords: [reporting, dashboard, looker studio, raportowanie]',
    'applies_to: [analytics, google-ads, meta-ads]',
    'priority: 3',
    'summary: Looker Studio dashboard hygiene.',
  ]],
  ['general/benchmarks-index.md', [
    'keywords: [benchmark, cpc, cpm, ctr, roas]',
    'applies_to: [google-ads, meta-ads]',
    'priority: 2',
    'summary: Advertising benchmarks index.',
  ]],
  ['meta-ads/pixel-capi-signal-quality.md', [
    'keywords: [pixel, capi, event match quality]',
    'applies_to: [meta-ads]',
    'priority: 4',
    'summary: Meta signal quality.',
  ]],
  ['meta-ads/budgeting-abo-cbo-advantage.md', [
    'keywords: [abo, cbo, advantage budget]',
    'applies_to: [meta-ads]',
    'trigger_stage: [prompt, pre_tool]',
    'trigger_tools: [prepare_budget_change]',
    'priority: 4',
    'summary: Meta ABO/CBO budgeting.',
  ]],
  ['analytics/meta-pixel-capi.md', [
    'keywords: [meta pixel, conversions api, deduplikacja]',
    'applies_to: [meta-ads]',
    'priority: 3',
    'summary: Meta Pixel and CAPI.',
  ]],
];
for (const [path, frontmatter] of gateArticles) {
  await writeFile(
    join(gateRoot, path),
    ['---', ...frontmatter, '---', `# ${path}`, 'Body.'].join('\n'),
    'utf8',
  );
}

// A ranker that behaves as the real one did: it returns its whole top list for
// the conversation window, Meta articles included, all above the enforcement
// threshold.
const gateToken = 'gate-smoke-token';
const gateRankServer = createServer((req, res) => {
  if (req.url !== '/rank' || req.headers.authorization !== `Bearer ${gateToken}`) {
    res.writeHead(401).end('{}');
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    matches: gateArticles.map(([path]) => ({ path, applies_to: [], similarity: 0.9 })),
  }));
});
await new Promise<void>((resolve) => gateRankServer.listen(0, '127.0.0.1', resolve));
const gateAddress = gateRankServer.address();
if (!gateAddress || typeof gateAddress === 'string') throw new Error('Gate smoke rank server did not bind.');
await writeFile(gateDiscovery, JSON.stringify({ port: gateAddress.port, token: gateToken }), 'utf8');

const gateEnv = {
  MARKETING_CONTEXT_DIR: gateRoot,
  MARKETING_CONTEXT_EMBED_DISCOVERY: gateDiscovery,
  MARKETING_CONTEXT_SEMANTIC_TIMEOUT_MS: '2000',
};
const gateSession = `gate-smoke-${randomUUID()}`;

function denyReason(output: string): string | null {
  if (!output.trim()) return null;
  const parsed = JSON.parse(output);
  if (parsed?.hookSpecificOutput?.permissionDecision === 'deny') return String(parsed.reason || '');
  return null;
}
async function gateFor(toolName: string): Promise<string | null> {
  return denyReason(await runHook({ hook_event_name: 'PreToolUse', session_id: gateSession, tool_name: toolName }, gateEnv));
}
async function readKnowledge(path: string): Promise<void> {
  await runHook(
    { hook_event_name: 'PostToolUse', session_id: gateSession, tool_name: 'mcp__marketing-context__read_knowledge', tool_input: { path } },
    gateEnv,
  );
}

// Observation 4: a Google Ads session must not be handed Meta articles, however
// confidently the platform-blind ranker returns them.
const sessionStart = await runHook({ hook_event_name: 'SessionStart', session_id: gateSession }, gateEnv);
if (sessionStart.length > 3000) throw new Error(`SessionStart injection over budget: ${sessionStart.length} chars (limit 3000).`);
const gatePrompt = await runHook(
  { hook_event_name: 'UserPromptSubmit', session_id: gateSession, prompt: 'Podnieś budżet dzienny kampanii Search w Google Ads o 20%.' },
  gateEnv,
);
for (const metaDoc of ['meta-ads/pixel-capi-signal-quality.md', 'meta-ads/budgeting-abo-cbo-advantage.md', 'analytics/meta-pixel-capi.md']) {
  if (gatePrompt.includes(metaDoc)) {
    throw new Error(`Google Ads session injected a Meta article (${metaDoc}). Output: ${gatePrompt.slice(0, 600)}`);
  }
}

// Observation 1: a budget change asks for the ground rules and the budget
// article — not for dashboard hygiene or the benchmarks index.
const budgetGate = await gateFor('mcp__google-ads__prepare_budget_change');
if (!budgetGate) throw new Error('prepare_budget_change should still be gated by the platform baseline.');
if (!budgetGate.includes('google-ads/always-never-checklist.md')) {
  throw new Error(`Budget gate lost the platform baseline: ${budgetGate}`);
}
if (!budgetGate.includes('google-ads/budget-scaling-seasonality.md')) {
  throw new Error(`Budget gate did not ask for the budget article: ${budgetGate}`);
}
for (const offTopic of ['reporting/reporting-refresh.md', 'general/benchmarks-index.md', 'meta-ads/budgeting-abo-cbo-advantage.md']) {
  if (budgetGate.includes(offTopic)) throw new Error(`Budget gate demanded an unrelated article (${offTopic}): ${budgetGate}`);
}
if ((budgetGate.match(/read_knowledge\(/g) || []).length > 3) {
  throw new Error(`Gate demanded more than 3 articles at once: ${budgetGate}`);
}

await readKnowledge('google-ads/always-never-checklist.md');
await readKnowledge('google-ads/budget-scaling-seasonality.md');
if (await gateFor('mcp__google-ads__prepare_budget_change')) {
  throw new Error('prepare_budget_change should pass once its required articles were read.');
}

// Observation 3: the second phase of the same operation adds no new demand,
// however much the session talked in between.
await runHook(
  { hook_event_name: 'UserPromptSubmit', session_id: gateSession, prompt: 'Potwierdzam, safe word: kotek. Wykonaj zmianę.' },
  gateEnv,
);
const confirmGate = await gateFor('mcp__google-ads__confirm_mutation');
if (confirmGate) throw new Error(`confirm_mutation must not introduce new required reading: ${confirmGate}`);

// Observation 2: creating a Search campaign asks for keywords/copywriting, not
// for the Merchant Center feed workflow (a Search campaign has no feed).
const searchGate = await gateFor('mcp__google-ads__prepare_search_campaign_full');
if (!searchGate) throw new Error('prepare_search_campaign_full should be gated by its topical article.');
if (!searchGate.includes('google-ads/search-keywords-copywriting.md')) {
  throw new Error(`Search campaign gate did not ask for keywords/copywriting: ${searchGate}`);
}
if (searchGate.includes('google-ads/google-ads-feed-health.md')) {
  throw new Error(`Search campaign gate demanded the feed workflow: ${searchGate}`);
}

// A read tool carries the baseline only — no topical demands, no session noise.
await readKnowledge('google-ads/search-keywords-copywriting.md');
if (await gateFor('mcp__google-ads__get_campaigns')) {
  throw new Error('A read tool must not demand topical articles once the baseline is read.');
}

// pre_tool injection is platform-scoped too: trigger_tools names are shared
// across the ads MCPs, so Meta's budgeting article must stay out of a Google
// Ads budget change.
const budgetInject = await runHook(
  { hook_event_name: 'PreToolUse', session_id: gateSession, tool_name: 'mcp__google-ads__prepare_budget_change' },
  gateEnv,
);
if (budgetInject.includes('meta-ads/budgeting-abo-cbo-advantage.md')) {
  throw new Error(`Google Ads pre_tool injection pulled Meta's budgeting article: ${budgetInject}`);
}
await new Promise<void>((resolve) => gateRankServer.close(() => resolve()));

// --- retrieval unit checks: tool-name derived requirements ------------------
const { requiredReadingForTool, toolTerms } = await import('./retrieval.js');
if (!toolTerms('mcp__google-ads__prepare_budget_change').includes('budget')) {
  throw new Error('toolTerms lost the domain noun of prepare_budget_change.');
}
if (toolTerms('mcp__google-ads__prepare_budget_change').some((t) => ['prepare', 'prepar', 'google', 'ads'].includes(t))) {
  throw new Error('toolTerms kept protocol/platform tokens.');
}
const unitDocs: import('./storage.js').KnowledgeDoc[] = [
  { path: 'google-ads/always-never-checklist.md', title: 'Zawsze / nigdy', frontmatter: { applies_to: ['google-ads'], enforce_read: true, priority: 5 }, body: '' },
  { path: 'google-ads/budget-scaling-seasonality.md', title: 'Budżet i skalowanie', frontmatter: { applies_to: ['google-ads'], priority: 4 }, body: 'budget' },
  { path: 'reporting/reporting-refresh.md', title: 'Reporting Refresh', frontmatter: { applies_to: ['analytics', 'google-ads'], priority: 3, keywords: ['looker studio', 'dashboard'] }, body: 'budget mentioned in passing' },
  { path: 'meta-ads/budgeting-abo-cbo-advantage.md', title: 'ABO/CBO', frontmatter: { applies_to: ['meta-ads'], trigger_tools: ['prepare_budget_change'], priority: 4 }, body: '' },
];
const unitRequired = requiredReadingForTool(unitDocs, 'google-ads', 'prepare_budget_change', {
  semanticCandidates: ['reporting/reporting-refresh.md'],
});
if (!unitRequired.includes('google-ads/always-never-checklist.md') || !unitRequired.includes('google-ads/budget-scaling-seasonality.md')) {
  throw new Error(`requiredReadingForTool missing baseline/topical: ${unitRequired.join(', ')}`);
}
if (unitRequired.includes('reporting/reporting-refresh.md')) {
  throw new Error('A body-only match promoted by the semantic ranker must not be required.');
}
if (unitRequired.includes('meta-ads/budgeting-abo-cbo-advantage.md')) {
  throw new Error('An article whose applies_to excludes the platform must not be required.');
}
// A recurring review workflow is a task template, not preflight reading: a
// Search campaign must not be gated behind the weekly feed-health routine even
// though both talk about campaigns.
const workflowDocs: import('./storage.js').KnowledgeDoc[] = [
  { path: 'google-ads/google-ads-feed-health.md', title: 'Workflow: Feed Health', frontmatter: { applies_to: ['google-ads'], task_type: ['workflow'], default_schedule: 'weekly', priority: 4, keywords: ['feed health', 'campaign coverage'] }, body: '' },
  { path: 'google-ads/search-keywords-copywriting.md', title: 'Search: słowa kluczowe', frontmatter: { applies_to: ['google-ads'], priority: 4, keywords: ['search', 'copywriting'] }, body: '' },
];
const searchRequired = requiredReadingForTool(workflowDocs, 'google-ads', 'prepare_search_campaign_full', {
  semanticCandidates: ['google-ads/google-ads-feed-health.md'],
});
if (!searchRequired.includes('google-ads/search-keywords-copywriting.md')) {
  throw new Error(`Search campaign should require keywords/copywriting: ${searchRequired.join(', ')}`);
}
if (searchRequired.includes('google-ads/google-ads-feed-health.md')) {
  throw new Error('A recurring review workflow must not be required before an operation.');
}

const unitConfirm = requiredReadingForTool(unitDocs, 'google-ads', 'confirm_mutation', {
  semanticCandidates: ['reporting/reporting-refresh.md'],
  includeTopical: false,
});
if (unitConfirm.length !== 1 || unitConfirm[0] !== 'google-ads/always-never-checklist.md') {
  throw new Error(`confirm_* should require the baseline only: ${unitConfirm.join(', ')}`);
}

// --- token budgets (docs/response-format-contract.md §8) ---
const longLog = ['# Decision log', ...Array.from({ length: 8 }, (_, i) => `## 2026-01-0${i + 1}\nentry ${i + 1}`)].join('\n\n');
const tailed = tailLogEntries(longLog, 5);
if (tailed.omitted !== 3 || tailed.text.includes('entry 3') || !tailed.text.includes('entry 8') || !tailed.text.startsWith('# Decision log')) {
  throw new Error(`tailLogEntries kept the wrong entries: ${JSON.stringify(tailed)}`);
}
const rendered = renderClientContext({ status: 'ok', current_client: 'acme', files: [{ path: 'clients/acme/decision-log.md', content: longLog }] }, 5);
if (!rendered.startsWith('# Current client: acme') || !rendered.includes('3 older entries omitted') || rendered.trimStart().startsWith('{')) {
  throw new Error(`renderClientContext should be markdown with an omission note: ${rendered.slice(0, 300)}`);
}
if (gatePrompt.length > 2000) throw new Error(`UserPromptSubmit injection over budget: ${gatePrompt.length} chars (limit 2000).`);
await checkToolListingBudget();

console.log('smoke ok');

// Must not be spawnSync: the fake /rank endpoints below live in THIS process, so a
// synchronous child blocks the event loop that would have answered them and every
// semantic assertion silently degrades into "the ranker timed out".
async function runHook(payload: unknown, env: Record<string, string>): Promise<string> {
  const child = spawn(process.execPath, [join(process.cwd(), 'hook.cjs')], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => { stdout += chunk; });
  child.stderr.on('data', (chunk: string) => { stderr += chunk; });
  child.stdin.end(JSON.stringify(payload));
  const status = await new Promise<number>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });
  if (status !== 0) throw new Error(`hook.cjs failed (${status}): ${stderr || stdout}`);
  return stdout;
}

async function checkToolListingBudget(): Promise<void> {
  const child = spawn(process.execPath, [join(process.cwd(), 'bundle.cjs')], {
    cwd: process.cwd(),
    env: { ...process.env, MARKETING_CONTEXT_DIR: rootDir, MARKETING_CONTEXT_NO_UPDATE: '1', MARKETING_CONTEXT_EMBED: '0' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let buffer = '';
  child.stdout.setEncoding('utf8');
  const listing = new Promise<{ result: { tools: Array<{ name: string; description?: string; inputSchema?: { properties?: Record<string, { description?: string }> } }> } }>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('tools/list timed out')), 15000);
    child.stdout.on('data', (chunk: string) => {
      buffer += chunk;
      for (const line of buffer.split('\n').slice(0, -1)) {
        const message = JSON.parse(line);
        if (message.id === 2) { clearTimeout(timer); resolve(message); }
      }
      buffer = buffer.slice(buffer.lastIndexOf('\n') + 1);
    });
  });
  const send = (message: unknown) => child.stdin.write(`${JSON.stringify(message)}\n`);
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const { result } = await listing.finally(() => child.kill());
  const size = JSON.stringify(result.tools).length;
  if (size > 12000) throw new Error(`tools/list over budget: ${size} chars (limit 12000).`);
  for (const tool of result.tools) {
    if ((tool.description ?? '').length > 200) throw new Error(`${tool.name} description over 200 chars.`);
    for (const [name, param] of Object.entries(tool.inputSchema?.properties ?? {})) {
      if ((param.description ?? '').length > 100) throw new Error(`${tool.name}.${name} description over 100 chars.`);
    }
  }
}
