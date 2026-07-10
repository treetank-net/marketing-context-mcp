#!/usr/bin/env node
/**
 * marketing-context auto-inject hook.
 *
 * Reads a Claude Code / Codex hook payload on stdin and injects relevant
 * marketing knowledge as additional context, based on:
 *   - UserPromptSubmit: text match against the prompt (+ session-start orientation)
 *   - PreToolUse:       docs wired to the tool via frontmatter `trigger_tools`
 *   - PostToolUse:      a nudge to record a note after mutations/stats
 *
 * The hook reads the knowledge dir directly (no MCP round-trip). Injected docs are
 * "hubs": they carry a `related` list so the model can pull deeper docs on demand
 * via read_knowledge. Per-session state prevents re-injecting the same doc twice.
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, statSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { isEnabled, resolveRootsSync, type MarketingContextConfig } from './config.js';

// The hook is a one-shot process; resolve roots + stored settings once.
let cachedCfg: MarketingContextConfig | null = null;
function hookCfg(): MarketingContextConfig {
  return (cachedCfg ??= resolveRootsSync());
}
import { listClientNotes, listDueTasks, listKnowledgeFiles, redactSecrets, type KnowledgeDoc, type TaskRecord } from './storage.js';
import {
  detectPlatforms,
  frontmatterList,
  requiredReading,
  selectForPromptScored,
  selectForSessionStart,
  selectSessionStartGeneric,
  selectForTool,
} from './retrieval.js';

// Claude Code / Claude Desktop hard-truncate a single hook invocation's
// additionalContext at ~10,000 chars (larger output is offloaded to a temp file
// and the model sees a ~2KB preview instead — measured empirically; not
// configurable). The supported strategy is compact index injection + explicit
// read_knowledge calls. Sharding remains as an escape hatch for oversized
// indexes, but full article bodies should not be pushed through the hook.
const SHARD_LIMIT = 9000; // per-invocation chunk size, with margin under 10k
const MUTATION_TOOLS = ['confirm_mutation', 'confirm_all_mutations'];
// After this many denies per platform the gate opens with a warning instead —
// a session must never hard-lock (e.g. when the MCP server is not connected
// and read_knowledge is simply unavailable).
const ENFORCE_MAX_DENIES = 3;
const SEMANTIC_TIMEOUT_MS = Number(process.env.MARKETING_CONTEXT_SEMANTIC_TIMEOUT_MS || 350);
const SEMANTIC_INJECT = Number(process.env.MARKETING_CONTEXT_SEMANTIC_INJECT || 0.45);
const SEMANTIC_ENFORCE = Number(process.env.MARKETING_CONTEXT_SEMANTIC_ENFORCE || 0.60);

interface HookInput {
  hook_event_name?: string;
  session_id?: string;
  prompt?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_response?: unknown;
  cwd?: string;
  transcript_path?: string;
}

interface SessionState {
  round: number;
  injected: string[];
  notesInjected?: boolean;
  tocInjected?: boolean;
  /** Active tasks were surfaced once this session (re-shown on explicit "what's due" asks). */
  tasksInjected?: boolean;
  /** Knowledge paths the model actually read via read_knowledge this session. */
  readDocs: string[];
  /** Per-platform count of enforcement denies (capped by ENFORCE_MAX_DENIES). */
  denies: Record<string, number>;
  /**
   * Client notes exist but were too large to inject at session start — the
   * model works blind about the client until it loads them explicitly. Cleared
   * by a successful set_current_client / get_client_context.
   */
  clientNotesPending?: boolean;
  /** Slug declared via set_current_client / get_client_context this session. */
  currentClient?: string;
  /**
   * Knowledge paths that ranked above the semantic enforcement threshold in
   * the conversation window. They extend, but never replace, frontmatter
   * enforce_read docs and are only enforced on ads-platform tools.
   */
  semanticRequired: string[];
}

interface SemanticMatch {
  path: string;
  applies_to: string[];
  similarity: number;
}

async function main() {
  const input = await readInput();
  if (!input) process.exit(0);

  const event = String(input.hook_event_name || '');
  const { shard, shards } = parseShardArgs();

  // Followers only replay the chunk the leader prepared for them.
  if (shard > 1) {
    await emitFollowerChunk(event, input.session_id, shard);
    process.exit(0);
  }

  const cfg = hookCfg();
  if (!existsSync(cfg.rootDir) && !(cfg.bundledDir && existsSync(cfg.bundledDir))) process.exit(0);

  const state = loadState(input.session_id);
  // Total capacity across all shards, minus per-chunk label overhead.
  const capacity = shards * SHARD_LIMIT - shards * 120;
  let text = '';

  try {
    const docs = await listKnowledgeFiles(cfg);
    const exclude = new Set(state.injected);

    if (event === 'SessionStart') {
      text = renderKnowledgeToc(docs, state, capacity);
      text = appendClientNotes(
        text,
        await renderClientNotes(cfg, state, capacity - text.length),
      );
    } else if (event === 'UserPromptSubmit') {
      state.round += 1;
      const prompt = String(input.prompt || '');
      const platforms = detectPlatforms(prompt);
      const semantic = await semanticRank(input, prompt);
      const scored = selectForPromptScored(docs, prompt, { platforms, exclude, limit: 3 });
      // Only confident matches get injected. Weak positive scores are noise —
      // an off-topic session (coding, research, chat) must stay silent instead
      // of draining the knowledge pool doc-by-doc with MANDATORY labels.
      const picked: KnowledgeDoc[] = scored.filter((s) => s.confident).map((s) => s.doc);
      const semanticPicked = semantic
        .filter((match) => match.similarity >= SEMANTIC_INJECT)
        .map((match) => docs.find((doc) => doc.path === match.path))
        .filter((doc): doc is KnowledgeDoc => Boolean(doc))
        .filter((doc) => !exclude.has(doc.path))
        .filter((doc) => !picked.some((d) => d.path === doc.path));
      picked.push(...semanticPicked.slice(0, 3));
      for (const match of semantic.filter((m) => m.similarity >= SEMANTIC_ENFORCE)) {
        if (!state.semanticRequired.includes(match.path)) state.semanticRequired.push(match.path);
      }
      debugLog(input.session_id, 'prompt-scoring', {
        round: state.round,
        prompt: prompt.slice(0, 200),
        platforms,
        scored: scored.map((s) => ({ path: s.doc.path, score: s.score, confident: s.confident })),
        semantic: semantic.map((s) => ({ path: s.path, similarity: s.similarity })),
        semanticRequired: state.semanticRequired,
      });
      if (state.round === 1 && !state.tocInjected) {
        text = renderKnowledgeToc(docs, state, capacity);
        text = appendClientNotes(
          text,
          await renderClientNotes(cfg, state, capacity - text.length),
        );
        saveState(input.session_id, state);
        const chunks = splitIntoChunks(text.trim(), shards);
        writeFollowerChunks(event, input.session_id, chunks, shards);
        if (chunks[0]) emit(event, chunks[0]);
        process.exit(0);
      }
      // The first prompt of a session doubles as SessionStart: the dedicated
      // SessionStart hook is unreliable (it doesn't fire when the plugin is
      // updated/reloaded mid-session), so inject the same generic orientation
      // here, PREPENDED so it always gets budget. Shared per-session state
      // dedupes, so a real SessionStart earlier won't cause a duplicate.
      // Only when the prompt actually looks like marketing work (platform
      // detected or a confident topical match) — an off-topic session gets the
      // TOC and nothing more.
      if (state.round === 1 && (platforms.length > 0 || picked.length > 0)) {
        const generic = selectSessionStartGeneric(docs, { exclude, limit: 2 })
          .filter((doc) => !picked.some((d) => d.path === doc.path));
        picked.unshift(...generic);
      }
      // Once the prompt tells us which ads platform is in play, inject that
      // platform's start-here core even for generic prompts like "work on Google
      // Ads". Text scoring alone often has no topical terms after stopword
      // removal, but the platform baseline is still required operating context.
      const platformStart = selectForSessionStart(docs, { platforms, exclude, limit: 4 })
        .filter((doc) => platforms.length > 0)
        .filter((doc) => !picked.some((d) => d.path === doc.path));
      picked.unshift(...platformStart);
      text = renderDocs(picked, state, capacity);
      if (state.round === 1) {
        // Entries are link+summary now, so the notes get nearly all the budget.
        text = appendClientNotes(
          text,
          await renderClientNotes(cfg, state, capacity - text.length),
        );
      }
      // Surface active tasks: once per session when a client/platform is in play,
      // and every time the user explicitly asks what is due / to do.
      const wantsTasks = TASK_INTENT_RE.test(prompt);
      if (!state.tasksInjected || wantsTasks) {
        const filter: { client_slug?: string } = {};
        if (state.currentClient) filter.client_slug = state.currentClient;
        // Due = one-off open tasks + recurring tasks whose next_due has passed.
        let tasks = await listDueTasks(cfg, filter);
        if (!state.currentClient && platforms.length > 0) {
          tasks = tasks.filter((t) => !t.platform || platforms.includes(t.platform));
        }
        if (tasks.length > 0 && (state.currentClient || platforms.length > 0 || wantsTasks)) {
          const block = renderTasks(tasks.slice(0, 5), capacity - text.length);
          if (block) {
            text = text ? `${text}\n\n${block}` : block;
            state.tasksInjected = true;
          }
        }
      }
    } else if (event === 'PreToolUse') {
      const toolName = String(input.tool_name || '');
      const clientSlugs =
        state.clientNotesPending && !state.currentClient
          ? [...new Set((await listClientNotes(cfg)).map((n) => n.slug))]
          : [];
      const gate = checkRequiredReading(docs, toolName, state, clientSlugs);
      if (gate) {
        debugLog(input.session_id, 'enforce', { tool: toolName, ...gate });
        if (gate.action === 'deny') {
          saveState(input.session_id, state);
          emitDeny(gate.reason);
          process.exit(0);
        }
        // Deny cap reached: let the call through, but say so out loud.
        text = gate.reason;
      } else {
        const picked = selectForTool(docs, toolName, { exclude, limit: 3 });
        text = renderDocs(picked, state, capacity);
      }
    } else if (event === 'PostToolUse') {
      const toolName = String(input.tool_name || '');
      if (toolName.includes('read_knowledge')) {
        recordKnowledgeRead(input, state);
        saveState(input.session_id, state);
        process.exit(0);
      }
      if (toolName.includes('set_current_client') || toolName.includes('get_client_context')) {
        await recordClientSelection(input, state, cfg);
        saveState(input.session_id, state);
        process.exit(0);
      }
      text = renderPostToolReminder(toolName);
    }
  } catch {
    process.exit(0);
  }

  saveState(input.session_id, state);
  const chunks = splitIntoChunks(text.trim(), shards);
  // Hand chunks 2..N to the followers BEFORE emitting ours — they spin-wait on
  // these files. Always write every follower's file (possibly empty) so they
  // never wait out their full timeout.
  writeFollowerChunks(event, input.session_id, chunks, shards);
  if (chunks[0]) emit(event, chunks[0]);
  process.exit(0);
}

function parseShardArgs(): { shard: number; shards: number } {
  let shard = 1;
  let shards = 1;
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--(shard|shards)=(\d+)$/);
    if (m) {
      if (m[1] === 'shard') shard = Math.max(1, Number(m[2]));
      else shards = Math.max(1, Number(m[2]));
    }
  }
  return { shard, shards: Math.max(shard, shards) };
}

// Split rendered text into ≤SHARD_LIMIT chunks, preferring entry boundaries
// ("\n- "), then paragraphs, then sentence-ish breaks. Chunks after the first
// get a continuation label so the model can reassemble them regardless of the
// order in which the harness appended the hook outputs.
function splitIntoChunks(text: string, shards: number): string[] {
  if (!text) return [];
  if (text.length <= SHARD_LIMIT || shards === 1) return [text.slice(0, SHARD_LIMIT)];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0 && chunks.length < shards) {
    const isLast = chunks.length === shards - 1;
    const label = chunks.length === 0 ? '' : `[marketing-context${hookVersion()}] (part ${chunks.length + 1}/${shards} — continuation of the previous block)\n`;
    const room = SHARD_LIMIT - label.length;
    if (rest.length <= room) {
      chunks.push(label + rest);
      rest = '';
      break;
    }
    const slice = rest.slice(0, room);
    const entry = slice.lastIndexOf('\n- ');
    const para = slice.lastIndexOf('\n\n');
    const line = slice.lastIndexOf('\n');
    let cut = entry > room * 0.5 ? entry : para > room * 0.5 ? para : line > room * 0.5 ? line : room;
    if (isLast) cut = Math.min(cut, room); // final shard: whatever fits
    chunks.push(label + rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).replace(/^\n+/, '');
  }
  return chunks;
}

// --- shard handoff ----------------------------------------------------------

function chunkPath(event: string, sessionId: string | undefined, shard: number): string {
  const sid = (sessionId || 'nosession').replace(/[^a-zA-Z0-9._-]/g, '_');
  return join(stateDir(), `chunk-${sid}-${event}-${shard}.txt`);
}

function writeFollowerChunks(event: string, sessionId: string | undefined, chunks: string[], shards: number) {
  try {
    mkdirSync(stateDir(), { recursive: true });
    for (let i = 2; i <= shards; i++) {
      writeFileSync(chunkPath(event, sessionId, i), chunks[i - 1] || '', 'utf8');
    }
  } catch {
    // followers will time out silently; chunk 1 still lands
  }
}

async function emitFollowerChunk(event: string, sessionId: string | undefined, shard: number) {
  const path = chunkPath(event, sessionId, shard);
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const stat = statSync(path);
      // Only accept a fresh file — a stale chunk from a previous event of the
      // same type must not be replayed.
      if (Date.now() - stat.mtimeMs < 30000) {
        const content = readFileSync(path, 'utf8');
        try { unlinkSync(path); } catch { /* best-effort */ }
        if (content.trim()) {
          // Context blocks land in completion order; a small stagger keeps
          // chunk k after chunk k-1 in the common case.
          await sleep(150 * (shard - 1));
          emit(event, content.trim());
        }
        return;
      }
    } catch {
      // not written yet
    }
    await sleep(50);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Entries are link + full summary (never cut mid-sentence) — the summary is a
// hand-written brief, richer than a mechanical excerpt. Full articles are not
// inlined: Claude Desktop / Claude Code cap a single additionalContext block at
// ~10k chars, so bodies are pulled explicitly through read_knowledge instead.
function renderDocs(docs: KnowledgeDoc[], state: SessionState, budget: number = SHARD_LIMIT): string {
  if (docs.length === 0) return '';
  const lines: string[] = [
    `[marketing-context${hookVersion()}] MANDATORY knowledge start pack. These are required context pointers, not optional reading. Before planning, reviewing, or mutating ads accounts, call read_knowledge for the relevant listed core article(s) and use the summaries below only as a compact index:`,
  ];
  let used = lines[0].length;

  for (const doc of docs) {
    const summary = String(doc.frontmatter.summary || '').trim();
    const related = frontmatterList(doc.frontmatter, 'related');

    // Preserve original case for sources (URLs, § refs) — do not lowercase.
    const rawSource = doc.frontmatter.source;
    const source = Array.isArray(rawSource) ? rawSource.map(String) : rawSource ? [String(rawSource)] : [];

    const head = `\n- ${doc.path}${summary ? ` — ${summary}` : ''}`;
    let tail = '';
    if (source.length) tail += `\n  Source: ${truncate(source.join('; '), 160)}`;
    if (related.length) tail += `\n  Related: ${related.join(', ')}`;

    const block = `${head}\n  Required reading: read_knowledge("${doc.path}")${tail}`;

    if (used + block.length > budget) break;
    lines.push(block);
    used += block.length;
    state.injected.push(doc.path);
  }

  return lines.length > 1 ? lines.join('') : '';
}

function renderKnowledgeToc(docs: KnowledgeDoc[], state: SessionState, budget: number = SHARD_LIMIT): string {
  if (state.tocInjected) return '';
  state.tocInjected = true;

  const lines: string[] = [
    `[marketing-context${hookVersion()}] MANDATORY knowledge table of contents. This is the map of available articles, not the articles themselves. Before planning, reviewing, or mutating ads accounts, choose the relevant path(s) below and call read_knowledge("<path>"). Article summaries are written as "when to read / what it protects".`,
    '',
    'Start here:',
    '- Cross-platform account work: read_knowledge("general/account-management-philosophy.md")',
    '- Google Ads work: read_knowledge("google-ads/always-never-checklist.md")',
    '- Meta Ads work: read_knowledge("meta-ads/account-structure-learning-phase.md")',
    '',
  ];
  let used = lines.join('\n').length;
  let currentGroup = '';

  for (const doc of docs) {
    const group = doc.path.includes('/') ? doc.path.split('/')[0] : 'root';
    if (group !== currentGroup) {
      const heading = `\n## ${group}`;
      if (used + heading.length > budget) break;
      lines.push(heading);
      used += heading.length;
      currentGroup = group;
    }

    const summary = compactSummary(String(doc.frontmatter.summary || doc.title || '').trim(), 115);
    const item = `- ${doc.path}${summary ? ` — ${summary}` : ''}`;
    if (used + item.length + 1 > budget) break;
    lines.push(item);
    used += item.length + 1;
  }

  return lines.join('\n');
}

// Prompts that explicitly ask for the work backlog re-surface tasks even after
// they were injected once this session (PL + EN).
const TASK_INTENT_RE =
  /what.*(should|to).*(do|next)|what'?s\s+due|to-?do|due tasks?|open tasks?|run a review|\bzadani|zaleg|otwarte zadan|co\s+(mam|robi|robimy|dalej|teraz)|przegl[aą]d/i;

// Visible task block. Each task is a durable operational intent recorded earlier;
// it names why it exists, the workflow article to run, the knowledge to read, and
// how to close it — so the model can act and record the outcome.
function renderTasks(tasks: TaskRecord[], budget: number): string {
  if (tasks.length === 0) return '';
  const lines: string[] = [
    `[marketing-context${hookVersion()}] Active tasks (${tasks.length}), most urgent first. These are stored operational intents. Before unrelated work, consider addressing them; each names the knowledge to read and the workflow to run:`,
  ];
  let used = lines[0].length;

  for (const t of tasks) {
    const due = t.due ? ` · due ${t.due}` : '';
    const head = `\n- [${t.priority}]${due} ${t.title}  (${t.path})`;
    let tail = '';
    const why = firstBodyLine(t.body);
    if (why) tail += `\n  Why: ${truncate(why, 160)}`;
    if (t.suggested_workflow) tail += `\n  Workflow: read_knowledge("${t.suggested_workflow}")`;
    if (t.knowledge.length) tail += `\n  Knowledge: ${t.knowledge.join(', ')}`;
    const src = [t.source_type, t.source_ref].filter(Boolean).join(' ');
    if (src) tail += `\n  Source: ${truncate(src, 120)}`;
    tail += `\n  When done: update_task_status("${t.path}", "done", "<result>"), then record append_review / append_mutation.`;
    const block = head + tail;
    if (used + block.length > budget) break;
    lines.push(block);
    used += block.length;
  }

  return lines.length > 1 ? lines.join('') : '';
}

function firstBodyLine(body: string): string {
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('---')) continue;
    return t.replace(/^Reason:\s*/i, '');
  }
  return '';
}

function appendClientNotes(base: string, notes: string): string {
  if (!notes) return base;
  return base ? `${base}\n\n${notes}` : notes;
}

// Inject all client notes at session init, once. If they would not fit the
// event's shard capacity, warn instead of injecting so the user prunes them.
// Marks state so the notes aren't re-injected when both SessionStart and the
// first prompt fire.
async function renderClientNotes(cfg: MarketingContextConfig, state: SessionState, maxChars: number): Promise<string> {
  if (state.notesInjected) return '';
  const notes = await listClientNotes(cfg);
  if (notes.length === 0) {
    state.notesInjected = true;
    return '';
  }
  state.notesInjected = true;
  const slugs = [...new Set(notes.map((n) => n.slug))];
  const total = notes.reduce((sum, n) => sum + n.content.length, 0);
  if (total > maxChars) {
    // The model is now blind about the client — mark it so the enforcement
    // gate requires set_current_client before any ads-platform tool runs.
    state.clientNotesPending = true;
    return (
      `[marketing-context${hookVersion()}] Client notes (${slugs.join(', ')}) take ~${Math.round(total / 1000)}k chars ` +
      `and exceed the injection limit (~${Math.max(1, Math.round(maxChars / 1000))}k) — NOT injected automatically. ` +
      `Before working on ads accounts call set_current_client (with several clients FIRST ask the user which one ` +
      `this session concerns) — the tool returns the client's full context. Also consider pruning stale entries.`
    );
  }
  const lines: string[] = [`[marketing-context${hookVersion()}] Client notes (locally stored context — treat as the source of truth about the client):`];
  let lastSlug = '';
  for (const note of notes) {
    if (note.slug !== lastSlug) {
      lines.push(`\n## Client: ${note.slug}`);
      lastSlug = note.slug;
    }
    lines.push(`\n### ${note.path}\n${redactSecrets(note.content)}`);
  }
  return lines.join('\n');
}

// --- required-reading enforcement -------------------------------------------

interface GateResult {
  action: 'deny' | 'warn';
  platform: string;
  missing: string[];
  reason: string;
}

// Plumbing that must work before (or without) any knowledge: auth, plugin
// self-update, account discovery, safety-setup introspection. Everything else
// on the ads MCPs — analysis and mutation alike — goes through the gate:
// an account review that ignores the always/never baseline produces advice
// that violates ground rules just as surely as a blind mutation does.
const GATE_EXEMPT_EXACT = ['update_plugin', 'list_accounts', 'list_ad_accounts', 'get_safety_setup'];
const GATE_EXEMPT_PREFIX = ['setup_'];

/**
 * The teeth behind "MANDATORY": ads-platform tools are denied until the
 * platform's `enforce_read: true` docs have actually been read through
 * read_knowledge this session. Soft labels alone are ignored in practice —
 * a deny with an actionable reason is not. The tool call itself is the
 * platform signal (no text heuristics, no false positives), plumbing tools
 * are exempt, and the gate opens after ENFORCE_MAX_DENIES so a session can
 * never hard-lock. Escape hatch: MARKETING_CONTEXT_ENFORCE=0.
 */
function checkRequiredReading(
  docs: KnowledgeDoc[],
  toolName: string,
  state: SessionState,
  clientSlugs: string[] = [],
): GateResult | null {
  if (!isEnabled(hookCfg(), 'enforce_required_reading')) return null;
  const baseName = toolName.split('__').pop() || toolName;
  if (GATE_EXEMPT_EXACT.includes(baseName)) return null;
  if (GATE_EXEMPT_PREFIX.some((prefix) => baseName.startsWith(prefix))) return null;
  const platform = toolName.includes('google-ads') ? 'google-ads' : toolName.includes('meta-ads') ? 'meta-ads' : '';
  if (!platform) return null;

  const read = new Set(state.readDocs);
  const missing = requiredReading(docs, platform)
    .map((doc) => doc.path)
    .concat(
      state.semanticRequired.filter((path) => {
        const doc = docs.find((candidate) => candidate.path === path);
        if (!doc) return false;
        const appliesTo = frontmatterList(doc.frontmatter, 'applies_to');
        return appliesTo.length === 0 || appliesTo.includes(platform);
      }),
    )
    .filter((path, index, all) => all.indexOf(path) === index)
    .filter((path) => !read.has(path));
  // Client notes that never made it into context (too large at session start)
  // are required reading too — the model must not analyze or mutate a client's
  // account while blind to the client's profile, preferences and decision log.
  const needsClient = state.clientNotesPending === true && !state.currentClient && clientSlugs.length > 0;
  if (missing.length === 0 && !needsClient) return null;

  const denies = state.denies[platform] || 0;
  if (denies >= ENFORCE_MAX_DENIES) {
    const gaps = [
      ...(missing.length ? [`${missing.join(', ')} was never read`] : []),
      ...(needsClient ? ['no client was declared via set_current_client'] : []),
    ];
    return {
      action: 'warn',
      platform,
      missing,
      reason:
        `[marketing-context${hookVersion()}] WARNING: proceeding WITHOUT the required ${platform} baseline ` +
        `(${gaps.join('; ')} this session). Outcomes may violate account or client ground rules.`,
    };
  }
  state.denies[platform] = denies + 1;
  const steps: string[] = [];
  if (missing.length) {
    steps.push(`call ${missing.map((path) => `read_knowledge("${path}")`).join(', ')} on the marketing-context MCP server`);
  }
  if (needsClient) {
    steps.push(
      clientSlugs.length === 1
        ? `call set_current_client() — the only stored client ("${clientSlugs[0]}") is selected automatically and its full context is returned`
        : `ASK THE USER which client this session concerns (stored: ${clientSlugs.join(', ')}) — do not guess — then call set_current_client with that client_slug to load the client's full context`,
    );
  }
  return {
    action: 'deny',
    platform,
    missing,
    reason:
      `Blocked by marketing-context${hookVersion()}: before working on ${platform} this session you must first ` +
      steps.map((step, i) => `(${i + 1}) ${step}`).join('; ') +
      `. Then retry this tool call. This gate exists because the baseline articles and client notes carry ` +
      `ground rules (thresholds, always/never lists, client preferences) that both analysis and mutations must respect.`,
  };
}

/** Record a successful read_knowledge call so the enforcement gate can open. */
function recordKnowledgeRead(input: HookInput, state: SessionState) {
  const toolInput = input.tool_input as { path?: unknown } | undefined;
  const path = String(toolInput?.path || '').replace(/^[/\\]+/, '');
  if (path && !state.readDocs.includes(path)) state.readDocs.push(path);
  debugLog(input.session_id, 'read-recorded', { path, readDocs: state.readDocs });
}

/**
 * Record a client selection (set_current_client / get_client_context) so the
 * client half of the gate can open. Mirrors the tool's own resolution rules:
 * an explicit slug counts only if it exists; no slug counts only when exactly
 * one client is stored (auto-select) — an ambiguous listing call satisfies
 * nothing.
 */
async function recordClientSelection(input: HookInput, state: SessionState, cfg: MarketingContextConfig) {
  const toolInput = input.tool_input as { client_slug?: unknown } | undefined;
  const requested = String(toolInput?.client_slug || '').trim().toLowerCase();
  let slugs: string[] = [];
  try {
    slugs = [...new Set((await listClientNotes(cfg)).map((n) => n.slug))];
  } catch {
    return;
  }
  const slug = requested ? (slugs.includes(requested) ? requested : '') : slugs.length === 1 ? slugs[0] : '';
  if (slug) {
    state.currentClient = slug;
    state.clientNotesPending = false;
  }
  debugLog(input.session_id, 'client-selected', { requested, resolved: slug || null, slugs });
}

// PreToolUse deny. Emits both the legacy top-level shape and the modern
// hookSpecificOutput shape so any Claude Code version honours it. Codex has no
// deny protocol for this hook — there we fall back to loud additionalContext.
function emitDeny(reason: string) {
  const host = String(process.env.CLAUDECODE || process.env.CODEX || '').toLowerCase();
  if (host.includes('codex')) {
    process.stdout.write(JSON.stringify({ additionalContext: reason }));
    return;
  }
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason,
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
}

function renderPostToolReminder(toolName: string): string {
  const isMutation = MUTATION_TOOLS.some((name) => toolName.includes(name));
  if (!isMutation) return '';
  return (
    'The user just confirmed an advertising mutation. Consider recording a concise ' +
    'business note with marketing-context.append_mutation or append_decision if it ' +
    'will matter in future work.'
  );
}

// --- output ---------------------------------------------------------------

function emit(event: string, text: string) {
  const host = String(process.env.CLAUDECODE || process.env.CODEX || '').toLowerCase();
  if (host.includes('codex')) {
    process.stdout.write(JSON.stringify({ additionalContext: text }));
    return;
  }
  // Claude Code: structured additionalContext is supported for these events.
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }),
  );
}

// --- semantic ranking -----------------------------------------------------

function embedDiscoveryPath(): string {
  if (process.env.MARKETING_CONTEXT_EMBED_DISCOVERY) return process.env.MARKETING_CONTEXT_EMBED_DISCOVERY;
  return join(stateDir(), 'embed-endpoint.json');
}

async function semanticRank(input: HookInput, prompt: string): Promise<SemanticMatch[]> {
  if (!isEnabled(hookCfg(), 'semantic_ranking')) return [];
  let endpoint: { port?: unknown; token?: unknown; pid?: unknown } | null = null;
  try {
    endpoint = JSON.parse(readFileSync(embedDiscoveryPath(), 'utf8'));
  } catch {
    debugLog(input.session_id, 'semantic-rank', { status: 'no_discovery', path: embedDiscoveryPath() });
    return [];
  }
  const port = Number(endpoint?.port);
  const token = String(endpoint?.token || '');
  if (!port || !token) {
    debugLog(input.session_id, 'semantic-rank', { status: 'invalid_discovery', path: embedDiscoveryPath() });
    return [];
  }

  const text = conversationWindow(input, prompt);
  if (!text.trim()) {
    debugLog(input.session_id, 'semantic-rank', { status: 'empty_text' });
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEMANTIC_TIMEOUT_MS);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/rank`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ text, limit: 8 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      debugLog(input.session_id, 'semantic-rank', { status: 'http_error', code: res.status });
      return [];
    }
    const data = (await res.json()) as { matches?: unknown };
    if (!Array.isArray(data.matches)) {
      debugLog(input.session_id, 'semantic-rank', { status: 'bad_response' });
      return [];
    }
    const matches = data.matches
      .map((item) => normalizeSemanticMatch(item))
      .filter((item): item is SemanticMatch => Boolean(item));
    debugLog(input.session_id, 'semantic-rank', {
      status: 'ok',
      count: matches.length,
      top: matches.slice(0, 5).map((m) => ({ path: m.path, similarity: m.similarity })),
    });
    return matches;
  } catch (error) {
    debugLog(input.session_id, 'semantic-rank', {
      status: 'request_failed',
      error: String((error as Error)?.message || error).slice(0, 200),
    });
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function normalizeSemanticMatch(value: unknown): SemanticMatch | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as { path?: unknown; applies_to?: unknown; similarity?: unknown };
  const path = String(item.path || '').replace(/^[/\\]+/, '');
  const similarity = Number(item.similarity);
  if (!path || !Number.isFinite(similarity)) return null;
  const appliesTo = Array.isArray(item.applies_to) ? item.applies_to.map(String) : [];
  return { path, applies_to: appliesTo, similarity };
}

function conversationWindow(input: HookInput, prompt: string): string {
  const transcript = extractTranscriptWindow(input.transcript_path, 10, 7000);
  const current = prompt.trim() ? `user: ${prompt.trim()}` : '';
  return [transcript, current].filter(Boolean).join('\n\n').slice(-8000);
}

function extractTranscriptWindow(transcriptPath: string | undefined, maxMessages: number, maxChars: number): string {
  if (!transcriptPath || !existsSync(transcriptPath)) return '';
  const messages: string[] = [];
  try {
    const lines = readFileSync(transcriptPath, 'utf8').trimEnd().split('\n');
    for (let i = lines.length - 1; i >= 0 && messages.length < maxMessages; i--) {
      const parsed = JSON.parse(lines[i]);
      if (parsed?.sourceToolAssistantUUID) continue;
      const role = parsed?.message?.role || parsed?.type;
      if (role !== 'user' && role !== 'assistant') continue;
      const text = extractMessageText(parsed?.message?.content ?? parsed?.content);
      if (!text) continue;
      messages.push(`${role}: ${text}`);
    }
  } catch {
    return '';
  }
  return messages.reverse().join('\n\n').slice(-maxChars);
}

function extractMessageText(content: unknown): string {
  if (typeof content === 'string') return cleanTranscriptText(content);
  if (!Array.isArray(content)) return '';
  return cleanTranscriptText(
    content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (!part || typeof part !== 'object') return '';
        const item = part as { type?: unknown; text?: unknown; content?: unknown; name?: unknown };
        if (item.type && String(item.type).includes('tool')) return '';
        return typeof item.text === 'string' ? item.text : typeof item.content === 'string' ? item.content : '';
      })
      .filter(Boolean)
      .join('\n'),
  );
}

function cleanTranscriptText(text: string): string {
  return text
    .replace(/<task-notification>[\s\S]*?<\/task-notification>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1800);
}

// --- session state --------------------------------------------------------

function stateDir(): string {
  return join(tmpdir(), 'marketing-context-hook');
}

function statePath(sessionId?: string): string | null {
  if (!sessionId) return null;
  const safe = sessionId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return join(stateDir(), `${safe}.json`);
}

function loadState(sessionId?: string): SessionState {
  const path = statePath(sessionId);
  if (path && existsSync(path)) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      return {
        round: Number(parsed.round) || 0,
        injected: Array.isArray(parsed.injected) ? parsed.injected : [],
        notesInjected: parsed.notesInjected === true,
        tocInjected: parsed.tocInjected === true,
        tasksInjected: parsed.tasksInjected === true,
        readDocs: Array.isArray(parsed.readDocs) ? parsed.readDocs : [],
        denies: parsed.denies && typeof parsed.denies === 'object' ? parsed.denies : {},
        clientNotesPending: parsed.clientNotesPending === true,
        currentClient: typeof parsed.currentClient === 'string' ? parsed.currentClient : undefined,
        semanticRequired: Array.isArray(parsed.semanticRequired) ? parsed.semanticRequired : [],
      };
    } catch {
      // fall through to fresh state
    }
  }
  return { round: 0, injected: [], readDocs: [], denies: {}, semanticRequired: [] };
}

function saveState(sessionId: string | undefined, state: SessionState) {
  const path = statePath(sessionId);
  if (!path) return;
  try {
    mkdirSync(stateDir(), { recursive: true });
    writeFileSync(path, JSON.stringify(state), 'utf8');
  } catch {
    // best-effort; dedupe simply degrades if we cannot persist
  }
}

// --- helpers --------------------------------------------------------------

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

function compactSummary(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const cut = Math.max(slice.lastIndexOf('; '), slice.lastIndexOf('. '), slice.lastIndexOf(', '), slice.lastIndexOf(' '));
  return `${slice.slice(0, cut > max * 0.45 ? cut : max).trimEnd()}…`;
}

// Selection decisions are invisible in normal operation, which made noise bugs
// (e.g. substring matching flooding off-topic sessions) hard to diagnose. With
// MARKETING_CONTEXT_DEBUG=1 every scoring/enforcement decision lands as a JSONL
// line under the state dir.
function debugLog(sessionId: string | undefined, kind: string, data: Record<string, unknown>) {
  if (!isEnabled(hookCfg(), 'debug')) return;
  try {
    mkdirSync(stateDir(), { recursive: true });
    const line = JSON.stringify({ at: new Date().toISOString(), session: sessionId || 'nosession', kind, ...data });
    appendFileSync(join(stateDir(), 'debug.jsonl'), `${line}\n`, 'utf8');
  } catch {
    // diagnostics only — never break the hook
  }
}

// Version shown in inject headers so a live session immediately reveals which
// hook build is running (stale installs were a recurring support issue).
function hookVersion(): string {
  try {
    const dir = process.argv[1] ? resolve(process.argv[1], '..') : process.cwd();
    for (const candidate of [join(dir, 'package.json'), join(dir, '..', 'package.json')]) {
      if (!existsSync(candidate)) continue;
      const version = JSON.parse(readFileSync(candidate, 'utf8')).version;
      if (version) return ` v${version}`;
    }
  } catch {
    // best-effort
  }
  return '';
}

async function readInput(): Promise<HookInput | null> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return null;
  }
}

void main();
