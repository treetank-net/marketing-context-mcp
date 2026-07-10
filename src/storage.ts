import { readdir, readFile, mkdir, appendFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { CONTEXT_MARKER_FILE, SETTING_DEFAULTS, type ContextSettings, type KnowledgeMode, type MarketingContextConfig } from './config.js';

export interface KnowledgeDoc {
  path: string;
  title: string;
  frontmatter: Record<string, string | string[] | boolean | number>;
  body: string;
}

export function safeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug || slug === '.' || slug === '..') {
    throw new Error('Invalid slug.');
  }
  return slug;
}

function resolveInsideDir(baseDir: string, requestedPath: string): string {
  const cleaned = requestedPath.replace(/^[/\\]+/, '');
  const resolved = resolve(baseDir, cleaned);
  const rel = relative(baseDir, resolved);
  if (rel === '..' || rel.startsWith(`..${sep}`) || resolve(baseDir) === resolved) {
    if (rel === '') return resolved;
    throw new Error('Path escapes MARKETING_CONTEXT_DIR.');
  }
  return resolved;
}

export function resolveInsideRoot(cfg: MarketingContextConfig, requestedPath: string): string {
  return resolveInsideDir(cfg.rootDir, requestedPath);
}

export function relativeToRoot(cfg: MarketingContextConfig, absolutePath: string): string {
  return relative(cfg.rootDir, absolutePath).split(sep).join('/');
}

/**
 * Knowledge layers in precedence order (later wins). With a custom context dir
 * in 'plugin'/'unset' mode the bundled library is the base and the context dir
 * overlays it; in 'copy' mode the context dir owns the whole library.
 */
export function knowledgeLayers(cfg: MarketingContextConfig): string[] {
  if (cfg.bundledDir && cfg.knowledgeMode !== 'copy') return [cfg.bundledDir, cfg.rootDir];
  return [cfg.rootDir];
}

async function readKnowledgeFrom(baseDir: string, rel: string): Promise<KnowledgeDoc> {
  const raw = await readFile(resolveInsideDir(baseDir, rel), 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  return { path: rel, title: titleFromMarkdown(body, rel), frontmatter, body };
}

export async function readKnowledgeFile(cfg: MarketingContextConfig, requestedPath: string): Promise<KnowledgeDoc> {
  if (!requestedPath.endsWith('.md')) throw new Error('Only markdown knowledge files can be read with read_knowledge.');
  const layers = knowledgeLayers(cfg);
  // Reads prefer the context dir (user override), then fall back to bundled.
  for (const baseDir of [...layers].reverse()) {
    const fullPath = resolveInsideDir(baseDir, requestedPath);
    if (await pathExists(fullPath)) return readKnowledgeFrom(baseDir, relative(baseDir, fullPath).split(sep).join('/'));
  }
  throw new Error(`Knowledge file not found: ${requestedPath}`);
}

async function listMarkdownRelPaths(baseDir: string): Promise<string[]> {
  const files = await walk(baseDir).catch(() => [] as string[]);
  return files
    .map((file) => relative(baseDir, file).split(sep).join('/'))
    // clients/ holds per-client user notes, not shared knowledge — keep it out of
    // the knowledge pool (retrieval, ranking). It is surfaced separately.
    .filter((rel) => rel.endsWith('.md') && !rel.startsWith('clients/'));
}

export async function listKnowledgeFiles(cfg: MarketingContextConfig): Promise<KnowledgeDoc[]> {
  const byPath = new Map<string, KnowledgeDoc>();
  for (const baseDir of knowledgeLayers(cfg)) {
    for (const rel of await listMarkdownRelPaths(baseDir)) {
      byPath.set(rel, await readKnowledgeFrom(baseDir, rel));
    }
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export interface SeedResult {
  copied: string[];
  skipped: string[];
}

/** Copy the bundled library into the context dir, never overwriting existing files. */
export async function copyBundledKnowledge(cfg: MarketingContextConfig): Promise<SeedResult> {
  if (!cfg.bundledDir) throw new Error('No bundled knowledge library to copy from.');
  const result: SeedResult = { copied: [], skipped: [] };
  for (const rel of await listMarkdownRelPaths(cfg.bundledDir)) {
    const target = resolveInsideDir(cfg.rootDir, rel);
    if (await pathExists(target)) {
      result.skipped.push(rel);
      continue;
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await readFile(resolveInsideDir(cfg.bundledDir, rel)), 'utf8');
    result.copied.push(rel);
  }
  return result;
}

export interface ShadowedDoc {
  path: string;
  /** Context copy is byte-identical to the bundled article — a redundant duplicate, safe to delete. */
  identical: boolean;
}

/** Knowledge paths present in BOTH layers: intentional overrides or stale duplicates. */
export async function detectShadowedKnowledge(cfg: MarketingContextConfig): Promise<ShadowedDoc[]> {
  if (!cfg.bundledDir) return [];
  const bundled = new Set(await listMarkdownRelPaths(cfg.bundledDir));
  const shadowed: ShadowedDoc[] = [];
  for (const rel of await listMarkdownRelPaths(cfg.rootDir)) {
    if (!bundled.has(rel)) continue;
    const [own, base] = await Promise.all([
      readFile(resolveInsideDir(cfg.rootDir, rel), 'utf8'),
      readFile(resolveInsideDir(cfg.bundledDir, rel), 'utf8'),
    ]);
    shadowed.push({ path: rel, identical: own === base });
  }
  return shadowed.sort((a, b) => a.path.localeCompare(b.path));
}

export type ContextSettingsPatch = Partial<ContextSettings> & { knowledge_mode?: Exclude<KnowledgeMode, 'unset'> };

/**
 * Merge a settings patch into the context dir's .marketing-context.json and
 * apply it to the live config. `extra` carries non-setting metadata
 * (e.g. seeded_version).
 */
export async function updateContextSettings(
  cfg: MarketingContextConfig,
  patch: ContextSettingsPatch,
  extra: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  await mkdir(cfg.rootDir, { recursive: true });
  const markerPath = join(cfg.rootDir, CONTEXT_MARKER_FILE);
  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(await readFile(markerPath, 'utf8')) as Record<string, unknown>;
  } catch {
    // first write
  }
  const marker = { ...existing, ...extra, ...patch, updated: new Date().toISOString() };
  await writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
  if (patch.knowledge_mode) cfg.knowledgeMode = patch.knowledge_mode;
  for (const key of Object.keys(SETTING_DEFAULTS) as Array<keyof ContextSettings>) {
    if (typeof patch[key] === 'boolean') cfg.settings[key] = patch[key] as boolean;
  }
  return marker;
}

export interface ClientNote {
  slug: string;
  path: string;
  content: string;
}

/** Read all per-client user notes under clients/ (markdown only; excludes JSONL logs and tasks/). */
export async function listClientNotes(cfg: MarketingContextConfig): Promise<ClientNote[]> {
  const files = await walk(cfg.rootDir).catch(() => [] as string[]);
  const notes: ClientNote[] = [];
  for (const file of files) {
    const rel = relativeToRoot(cfg, file);
    if (!rel.startsWith('clients/') || !rel.endsWith('.md')) continue;
    // tasks/ are operational intents, surfaced through the dedicated task block —
    // not part of the client profile/notes injected as source-of-truth context.
    if (/^clients\/[^/]+\/tasks\//.test(rel)) continue;
    const content = (await readFile(file, 'utf8')).trim();
    if (content) notes.push({ slug: rel.split('/')[1] || 'unknown', path: rel, content });
  }
  return notes.sort((a, b) => a.path.localeCompare(b.path));
}

export type ClientContextResult =
  | { status: 'no_clients'; message: string }
  | { status: 'ambiguous'; clients: string[]; message: string }
  | { status: 'unknown_client'; requested: string; clients: string[]; message: string }
  | { status: 'ok'; current_client: string; files: Array<{ path: string; content: string }> };

/**
 * Resolve which client a session works on and collect their full stored
 * context. Auto-selects when exactly one client exists; with several and no
 * slug given, reports ambiguity so the model can ask the user. Returned file
 * contents pass through redactSecrets, same as hook injection.
 */
export async function collectClientContext(cfg: MarketingContextConfig, requestedSlug?: string): Promise<ClientContextResult> {
  const notes = await listClientNotes(cfg);
  const slugs = [...new Set(notes.map((note) => note.slug))];
  if (slugs.length === 0) {
    return { status: 'no_clients', message: 'No client notes stored under clients/.' };
  }
  let slug = requestedSlug ? safeSlug(requestedSlug) : '';
  if (!slug) {
    if (slugs.length > 1) {
      return {
        status: 'ambiguous',
        clients: slugs,
        message:
          'Multiple clients are stored. Ask the user which client this session concerns, then call set_current_client again with client_slug.',
      };
    }
    slug = slugs[0];
  }
  if (!slugs.includes(slug)) {
    return { status: 'unknown_client', requested: slug, clients: slugs, message: 'No notes stored for this client slug.' };
  }
  const files = notes
    .filter((note) => note.slug === slug)
    .map((note) => ({ path: note.path, content: redactSecrets(note.content) }));
  return { status: 'ok', current_client: slug, files };
}

export async function appendMarkdownLog(cfg: MarketingContextConfig, path: string, heading: string, content: string): Promise<string> {
  const fullPath = resolveInsideRoot(cfg, path);
  await mkdir(dirname(fullPath), { recursive: true });
  const entry = `\n\n## ${new Date().toISOString()} - ${heading}\n\n${redactSecrets(content).trim()}\n`;
  await appendFile(fullPath, entry, 'utf8');
  return relativeToRoot(cfg, fullPath);
}

export async function appendJsonl(cfg: MarketingContextConfig, path: string, value: unknown): Promise<string> {
  const fullPath = resolveInsideRoot(cfg, path);
  await mkdir(dirname(fullPath), { recursive: true });
  await appendFile(fullPath, `${JSON.stringify(redactValue(value))}\n`, 'utf8');
  return relativeToRoot(cfg, fullPath);
}

export async function upsertMarkdownSection(cfg: MarketingContextConfig, path: string, section: string, content: string): Promise<string> {
  const fullPath = resolveInsideRoot(cfg, path);
  await mkdir(dirname(fullPath), { recursive: true });
  let existing = '';
  try {
    existing = await readFile(fullPath, 'utf8');
  } catch {
    existing = `# ${path.split('/').at(-2) || 'Client'} Profile\n`;
  }

  const safeSection = section.trim().replace(/\s+/g, ' ');
  if (!safeSection) throw new Error('Section is required.');
  const replacement = `## ${safeSection}\n\n${redactSecrets(content).trim()}\n`;
  const pattern = new RegExp(`(^|\\n)## ${escapeRegExp(safeSection)}\\n[\\s\\S]*?(?=\\n## |$)`);
  const next = pattern.test(existing)
    ? existing.replace(pattern, `${existing.startsWith('##') ? '' : '\n'}${replacement}`)
    : `${existing.trim()}\n\n${replacement}`;
  await writeFile(fullPath, `${next.trim()}\n`, 'utf8');
  return relativeToRoot(cfg, fullPath);
}

export function parseFrontmatter(raw: string): { frontmatter: KnowledgeDoc['frontmatter']; body: string } {
  if (!raw.startsWith('---\n')) return { frontmatter: {}, body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { frontmatter: {}, body: raw };
  const yaml = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\s+/, '');
  const frontmatter: KnowledgeDoc['frontmatter'] = {};

  for (const line of yaml.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    frontmatter[key] = parseYamlishValue(rawValue.trim());
  }

  return { frontmatter, body };
}

export function redactSecrets(input: string): string {
  return input
    .replace(/\b(access|refresh|id)?_?token\s*[:=]\s*["']?[^"'\s]+/gi, '$1_token=[REDACTED]')
    .replace(/\b(client_secret|api_key|secret|password|cookie)\s*[:=]\s*["']?[^"'\n]+/gi, '$1=[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/g, 'Bearer [REDACTED]')
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]');
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactSecrets(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, redactValue(nested)]));
  }
  return value;
}

function parseYamlishValue(value: string): string | string[] | boolean | number {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => unquote(item.trim()))
      .filter(Boolean);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return unquote(value);
}

function unquote(value: string): string {
  return value.replace(/^["']|["']$/g, '');
}

function titleFromMarkdown(body: string, fallback: string): string {
  return body.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback.split('/').pop()?.replace(/\.md$/, '') || fallback;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) return walk(path);
      if (entry.isFile()) return [path];
      return [];
    }),
  );
  return nested.flat();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- tasks -----------------------------------------------------------------
// A task is a durable operational intent stored as a Markdown file with
// frontmatter under clients/<slug>/tasks/. Unlike the append-only logs, a task
// is a living note: its status, priority and body change over time, so it is
// rewritten in place. It always names what it follows from (source) and, when
// applicable, which workflow article runs it and which knowledge to read first.

export interface TaskInput {
  client_slug: string;
  title: string;
  platform?: string;
  account_id?: string;
  priority?: string;
  due?: string;
  intent?: string;
  reason?: string;
  context?: string;
  suggested_workflow?: string;
  knowledge?: string[];
  source_type?: string;
  source_ref?: string;
  recurring?: boolean;
  schedule?: string;
}

export interface TaskRecord {
  path: string;
  id: string;
  slug: string;
  title: string;
  status: string;
  priority: string;
  platform?: string;
  account_id?: string;
  due?: string;
  intent?: string;
  suggested_workflow?: string;
  knowledge: string[];
  source_type?: string;
  source_ref?: string;
  recurring?: boolean;
  schedule?: string;
  next_due?: string;
  last_run?: string;
  body: string;
  frontmatter: KnowledgeDoc['frontmatter'];
}

export interface TaskFilter {
  client_slug?: string;
  platform?: string;
  status?: string | string[];
  due_before?: string;
  priority?: string;
}

const TASK_FIELD_ORDER = [
  'type', 'status', 'priority', 'client_slug', 'platform', 'account_id', 'intent',
  'due', 'suggested_workflow', 'knowledge', 'source_type', 'source_ref',
  'recurring', 'schedule', 'last_run', 'next_due', 'created', 'id',
];

const PRIORITY_RANK: Record<string, number> = { high: 3, normal: 2, low: 1 };

export async function createTask(cfg: MarketingContextConfig, input: TaskInput): Promise<TaskRecord> {
  const slug = safeSlug(input.client_slug);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const titleSlug = safeSlug(input.title).slice(0, 60);
  const id = `task_${dateStr.replace(/-/g, '_')}_${titleSlug}`;

  let rel = `clients/${slug}/tasks/${dateStr}-${titleSlug}.md`;
  for (let n = 2; await pathExists(resolveInsideRoot(cfg, rel)); n++) {
    rel = `clients/${slug}/tasks/${dateStr}-${titleSlug}-${n}.md`;
  }

  const nextDue = input.recurring && input.schedule ? computeNextDue(input.schedule, now.toISOString()) : undefined;
  const frontmatter: KnowledgeDoc['frontmatter'] = {
    type: 'task',
    // A recurring task is "active" (enabled) rather than "open"; a one-off is "open".
    status: input.recurring ? 'active' : 'open',
    priority: input.priority || 'normal',
    client_slug: slug,
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.account_id ? { account_id: input.account_id } : {}),
    ...(input.intent ? { intent: input.intent } : {}),
    ...(input.due ? { due: input.due } : {}),
    ...(input.suggested_workflow ? { suggested_workflow: input.suggested_workflow } : {}),
    ...(input.knowledge && input.knowledge.length ? { knowledge: input.knowledge } : {}),
    source_type: input.source_type || 'manual',
    ...(input.source_ref ? { source_ref: input.source_ref } : {}),
    ...(input.recurring ? { recurring: true } : {}),
    ...(input.schedule ? { schedule: input.schedule } : {}),
    ...(nextDue ? { next_due: nextDue } : {}),
    created: now.toISOString(),
    id,
  };

  const bodyParts = [`# ${input.title.trim()}`];
  if (input.reason) bodyParts.push('', `Reason: ${input.reason.trim()}`);
  if (input.context) bodyParts.push('', 'Context:', input.context.trim());
  const body = bodyParts.join('\n');

  const full = resolveInsideRoot(cfg, rel);
  await mkdir(dirname(full), { recursive: true });
  const file = `---\n${serializeFrontmatter(frontmatter, TASK_FIELD_ORDER)}\n---\n\n${redactSecrets(body).trim()}\n`;
  await writeFile(full, file, 'utf8');
  return toTaskRecord(relativeToRoot(cfg, full), file);
}

export async function listTasks(cfg: MarketingContextConfig, filter: TaskFilter = {}): Promise<TaskRecord[]> {
  const files = await walk(cfg.rootDir).catch(() => [] as string[]);
  const tasks: TaskRecord[] = [];
  for (const file of files) {
    const rel = relativeToRoot(cfg, file);
    if (!/^clients\/[^/]+\/tasks\/.+\.md$/.test(rel)) continue;
    try {
      tasks.push(toTaskRecord(rel, await readFile(file, 'utf8')));
    } catch {
      // skip unreadable/malformed task files rather than fail the whole listing
    }
  }

  const statusFilter = filter.status
    ? (Array.isArray(filter.status) ? filter.status : [filter.status]).map((s) => s.toLowerCase())
    : null;

  let out = tasks;
  if (filter.client_slug) {
    const s = safeSlug(filter.client_slug);
    out = out.filter((t) => t.slug === s);
  }
  if (filter.platform) out = out.filter((t) => (t.platform || '').toLowerCase() === filter.platform!.toLowerCase());
  if (statusFilter) out = out.filter((t) => statusFilter.includes(t.status.toLowerCase()));
  if (filter.priority) out = out.filter((t) => t.priority.toLowerCase() === filter.priority!.toLowerCase());
  if (filter.due_before) out = out.filter((t) => t.due && t.due <= filter.due_before!);

  return out.sort(compareTasks);
}

export async function resolveTask(cfg: MarketingContextConfig, idOrPath: string): Promise<TaskRecord | null> {
  const needle = idOrPath.replace(/^[/\\]+/, '').trim();
  if (!needle) return null;
  const all = await listTasks(cfg);
  return (
    all.find((t) => t.path === needle) ||
    all.find((t) => t.id === needle) ||
    all.find((t) => t.path.endsWith(`/${needle}`)) ||
    all.find((t) => t.path.includes(needle)) ||
    null
  );
}

export async function updateTaskStatus(
  cfg: MarketingContextConfig,
  idOrPath: string,
  status: string,
  note?: string,
): Promise<TaskRecord> {
  const task = await resolveTask(cfg, idOrPath);
  if (!task) throw new Error(`No task found matching "${idOrPath}".`);
  const full = resolveInsideRoot(cfg, task.path);
  const { frontmatter, body } = parseFrontmatter(await readFile(full, 'utf8'));
  frontmatter.status = status;
  const stamp = new Date().toISOString();
  const trace = `## ${stamp} — status → ${status}${note ? `\n\n${redactSecrets(note).trim()}` : ''}`;
  const nextBody = `${body.trimEnd()}\n\n${trace}\n`;
  const file = `---\n${serializeFrontmatter(frontmatter, TASK_FIELD_ORDER)}\n---\n\n${nextBody.replace(/^\s+/, '')}`;
  await writeFile(full, file, 'utf8');
  return toTaskRecord(task.path, file);
}

export async function appendTaskNote(cfg: MarketingContextConfig, idOrPath: string, note: string): Promise<TaskRecord> {
  const task = await resolveTask(cfg, idOrPath);
  if (!task) throw new Error(`No task found matching "${idOrPath}".`);
  const full = resolveInsideRoot(cfg, task.path);
  const { frontmatter, body } = parseFrontmatter(await readFile(full, 'utf8'));
  const stamp = new Date().toISOString();
  const nextBody = `${body.trimEnd()}\n\n## ${stamp} — note\n\n${redactSecrets(note).trim()}\n`;
  const file = `---\n${serializeFrontmatter(frontmatter, TASK_FIELD_ORDER)}\n---\n\n${nextBody.replace(/^\s+/, '')}`;
  await writeFile(full, file, 'utf8');
  return toTaskRecord(task.path, file);
}

function toTaskRecord(rel: string, raw: string): TaskRecord {
  const { frontmatter, body } = parseFrontmatter(raw);
  const knowledge = Array.isArray(frontmatter.knowledge)
    ? frontmatter.knowledge.map(String)
    : frontmatter.knowledge
      ? [String(frontmatter.knowledge)]
      : [];
  return {
    path: rel,
    id: frontmatter.id ? String(frontmatter.id) : rel,
    slug: rel.split('/')[1] || 'unknown',
    title: titleFromMarkdown(body, rel),
    status: String(frontmatter.status || 'open'),
    priority: String(frontmatter.priority || 'normal'),
    platform: frontmatter.platform ? String(frontmatter.platform) : undefined,
    account_id: frontmatter.account_id ? String(frontmatter.account_id) : undefined,
    due: frontmatter.due ? String(frontmatter.due) : undefined,
    intent: frontmatter.intent ? String(frontmatter.intent) : undefined,
    suggested_workflow: frontmatter.suggested_workflow ? String(frontmatter.suggested_workflow) : undefined,
    knowledge,
    source_type: frontmatter.source_type ? String(frontmatter.source_type) : undefined,
    source_ref: frontmatter.source_ref ? String(frontmatter.source_ref) : undefined,
    recurring: frontmatter.recurring === true,
    schedule: frontmatter.schedule ? String(frontmatter.schedule) : undefined,
    next_due: frontmatter.next_due ? String(frontmatter.next_due) : undefined,
    last_run: frontmatter.last_run ? String(frontmatter.last_run) : undefined,
    body,
    frontmatter,
  };
}

function compareTasks(a: TaskRecord, b: TaskRecord): number {
  const pa = PRIORITY_RANK[a.priority.toLowerCase()] ?? 2;
  const pb = PRIORITY_RANK[b.priority.toLowerCase()] ?? 2;
  if (pa !== pb) return pb - pa;
  if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
  if (a.due && !b.due) return -1;
  if (!a.due && b.due) return 1;
  return a.path.localeCompare(b.path);
}

function serializeFrontmatter(fm: KnowledgeDoc['frontmatter'], order: string[] = []): string {
  const keys = [...order.filter((k) => k in fm), ...Object.keys(fm).filter((k) => !order.includes(k))];
  const lines: string[] = [];
  for (const key of keys) {
    const value = fm[key];
    if (value === undefined || value === null || value === '') continue;
    lines.push(`${key}: ${serializeFrontmatterValue(value)}`);
  }
  return lines.join('\n');
}

function serializeFrontmatterValue(value: string | string[] | boolean | number): string {
  if (Array.isArray(value)) return `[${value.map((item) => scalarString(String(item))).join(', ')}]`;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return scalarString(String(value));
}

// Quote scalars that would break the flat frontmatter parser (contains a colon,
// bracket, hash, or leading/trailing whitespace, or is empty).
function scalarString(value: string): string {
  return /[:#[\]]|^\s|\s$|^$/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

async function pathExists(fullPath: string): Promise<boolean> {
  try {
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
}

// --- recurrence ------------------------------------------------------------
// A task is due when its next_due is in the past (or it is a one-off with no
// schedule). Recurrence lives in frontmatter, not a separate system: mark_task_run
// stamps last_run and recomputes next_due from `schedule` (an alias or a cron
// expression), so the "what is due" injection can pick it up next time.

/** Whether a task should surface as actionable now. */
export function isTaskDue(task: TaskRecord, nowISO: string = new Date().toISOString()): boolean {
  const status = task.status.toLowerCase();
  if (status !== 'open' && status !== 'active') return false;
  if (task.next_due) return task.next_due <= nowISO;
  return true;
}

export async function listDueTasks(
  cfg: MarketingContextConfig,
  filter: TaskFilter = {},
  nowISO: string = new Date().toISOString(),
): Promise<TaskRecord[]> {
  const tasks = await listTasks(cfg, filter);
  return tasks.filter((t) => isTaskDue(t, nowISO));
}

export async function markTaskRun(
  cfg: MarketingContextConfig,
  idOrPath: string,
  resultSummary?: string,
  nextDue?: string,
): Promise<TaskRecord> {
  const task = await resolveTask(cfg, idOrPath);
  if (!task) throw new Error(`No task found matching "${idOrPath}".`);
  const full = resolveInsideRoot(cfg, task.path);
  const { frontmatter, body } = parseFrontmatter(await readFile(full, 'utf8'));
  const now = new Date().toISOString();
  frontmatter.last_run = now;
  const schedule = frontmatter.schedule ? String(frontmatter.schedule) : '';
  const computed = nextDue || (schedule ? computeNextDue(schedule, now) : undefined);
  if (computed) frontmatter.next_due = computed;
  const trace =
    `## ${now} — run` +
    (resultSummary ? `\n\n${redactSecrets(resultSummary).trim()}` : '') +
    (computed ? `\n\nNext due: ${computed}` : '');
  const nextBody = `${body.trimEnd()}\n\n${trace}\n`;
  const file = `---\n${serializeFrontmatter(frontmatter, TASK_FIELD_ORDER)}\n---\n\n${nextBody.replace(/^\s+/, '')}`;
  await writeFile(full, file, 'utf8');
  return toTaskRecord(task.path, file);
}

const RECURRENCE_ALIASES: Record<string, (d: Date) => void> = {
  daily: (d) => d.setUTCDate(d.getUTCDate() + 1),
  weekly: (d) => d.setUTCDate(d.getUTCDate() + 7),
  biweekly: (d) => d.setUTCDate(d.getUTCDate() + 14),
  monthly: (d) => d.setUTCMonth(d.getUTCMonth() + 1),
  quarterly: (d) => d.setUTCMonth(d.getUTCMonth() + 3),
  yearly: (d) => d.setUTCFullYear(d.getUTCFullYear() + 1),
  annually: (d) => d.setUTCFullYear(d.getUTCFullYear() + 1),
};

const DOW_NAMES: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

/**
 * Next occurrence after `fromISO` for a schedule that is either a simple alias
 * (daily/weekly/biweekly/monthly/quarterly/yearly) or a 5-field cron expression
 * (minute hour day-of-month month day-of-week). Returns undefined if the schedule
 * cannot be parsed.
 */
export function computeNextDue(schedule: string, fromISO: string): string | undefined {
  const from = new Date(fromISO);
  if (Number.isNaN(from.getTime())) return undefined;
  const alias = RECURRENCE_ALIASES[schedule.trim().toLowerCase()];
  if (alias) {
    const d = new Date(from.getTime());
    alias(d);
    return d.toISOString();
  }
  return nextCron(schedule, from);
}

function nextCron(expr: string, from: Date): string | undefined {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return undefined;
  const [minF, hrF, domF, monF, dowF] = parts;
  const min = parseCronField(minF, 0, 59);
  const hr = parseCronField(hrF, 0, 23);
  const dom = parseCronField(domF, 1, 31);
  const mon = parseCronField(monF, 1, 12);
  const dow = parseCronField(dowF, 0, 7, DOW_NAMES);
  if (!min || !hr || !dom || !mon || !dow) return undefined;
  // 7 and 0 both mean Sunday.
  if (dow.has(7)) dow.add(0);

  const t = new Date(Math.floor(from.getTime() / 60000) * 60000 + 60000);
  const cap = from.getTime() + 366 * 24 * 3600 * 1000;
  const domRestricted = domF.trim() !== '*';
  const dowRestricted = dowF.trim() !== '*';
  while (t.getTime() <= cap) {
    if (min.has(t.getUTCMinutes()) && hr.has(t.getUTCHours()) && mon.has(t.getUTCMonth() + 1)) {
      const domOk = dom.has(t.getUTCDate());
      const dowOk = dow.has(t.getUTCDay());
      // Standard cron: if both DOM and DOW are restricted, match on EITHER.
      const ok = domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
      if (ok) return t.toISOString();
    }
    t.setTime(t.getTime() + 60000);
  }
  return undefined;
}

function parseCronField(field: string, lo: number, hi: number, names?: Record<string, number>): Set<number> | null {
  const set = new Set<number>();
  for (let part of field.split(',')) {
    part = part.trim();
    let step = 1;
    const slash = part.split('/');
    if (slash.length === 2) {
      step = parseInt(slash[1], 10) || 1;
      part = slash[0];
    }
    let a = lo;
    let b = hi;
    if (part === '*') {
      // full range
    } else if (part.includes('-')) {
      const [x, y] = part.split('-');
      a = resolveCronNum(x, names);
      b = resolveCronNum(y, names);
    } else {
      a = b = resolveCronNum(part, names);
    }
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    for (let i = a; i <= b; i += step) if (i >= lo && i <= hi) set.add(i);
  }
  return set.size ? set : null;
}

function resolveCronNum(token: string, names?: Record<string, number>): number {
  const t = token.trim().toLowerCase();
  if (names && t.slice(0, 3) in names) return names[t.slice(0, 3)];
  return parseInt(t, 10);
}
