import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
const taskSession = `task-smoke-${Date.now()}`;
await runHook({ hook_event_name: 'SessionStart', session_id: taskSession }, { MARKETING_CONTEXT_DIR: rootDir, MARKETING_CONTEXT_SEMANTIC: '0' });
const taskInject = await runHook(
  { hook_event_name: 'UserPromptSubmit', session_id: taskSession, prompt: 'What should I do next on Google Ads for this account?' },
  { MARKETING_CONTEXT_DIR: rootDir, MARKETING_CONTEXT_SEMANTIC: '0' },
);
if (!taskInject.includes('Active tasks')) throw new Error(`Task injection missing. Output: ${taskInject.slice(0, 400)}`);

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

const sessionId = `semantic-smoke-${Date.now()}`;
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
if (!blocked.includes('google-ads/product-bucketing.md')) {
  throw new Error(`Semantic required-reading gate did not include product-bucketing.md. Output: ${blocked}`);
}
await new Promise<void>((resolve) => rankServer.close(() => resolve()));

console.log('smoke ok');

function runHook(payload: unknown, env: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['hook.cjs'], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`hook.cjs failed (${code}): ${stderr || stdout}`));
      } else {
        resolve(stdout);
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}
