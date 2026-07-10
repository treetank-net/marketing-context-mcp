#!/usr/bin/env node
"use strict";

// dist/hook.js
var import_node_fs2 = require("node:fs");
var import_node_path3 = require("node:path");
var import_node_os = require("node:os");

// dist/config.js
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var SETTING_DEFAULTS = {
  auto_update: true,
  enforce_required_reading: true,
  semantic_ranking: true,
  embeddings: true,
  debug: false
};
var CONTEXT_MARKER_FILE = ".marketing-context.json";
function bundledKnowledgeDir() {
  const candidates = [
    process.env.CLAUDE_PLUGIN_ROOT ? (0, import_node_path.join)(process.env.CLAUDE_PLUGIN_ROOT, "knowledge") : void 0,
    process.argv[1] ? (0, import_node_path.join)((0, import_node_path.dirname)((0, import_node_path.resolve)(process.argv[1])), "knowledge") : void 0,
    (0, import_node_path.join)(process.cwd(), "knowledge")
  ];
  for (const candidate of candidates) {
    if (candidate && (0, import_node_fs.existsSync)(candidate))
      return (0, import_node_path.resolve)(candidate);
  }
  return void 0;
}
function readContextMarker(rootDir) {
  try {
    const parsed = JSON.parse((0, import_node_fs.readFileSync)((0, import_node_path.join)(rootDir, CONTEXT_MARKER_FILE), "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function settingsFromMarker(marker) {
  const settings = { ...SETTING_DEFAULTS };
  for (const key of Object.keys(SETTING_DEFAULTS)) {
    if (typeof marker[key] === "boolean")
      settings[key] = marker[key];
  }
  return settings;
}
function isEnabled(cfg, key) {
  switch (key) {
    case "auto_update":
      if (process.env.MARKETING_CONTEXT_NO_UPDATE === "1")
        return false;
      break;
    case "enforce_required_reading":
      if (process.env.MARKETING_CONTEXT_ENFORCE === "0")
        return false;
      break;
    case "semantic_ranking":
      if (process.env.MARKETING_CONTEXT_SEMANTIC === "0")
        return false;
      break;
    case "embeddings":
      if (process.env.MARKETING_CONTEXT_EMBED === "0")
        return false;
      break;
    case "debug":
      if (process.env.MARKETING_CONTEXT_DEBUG)
        return true;
      break;
  }
  return cfg.settings[key];
}
function resolveRootsSync() {
  const bundled = bundledKnowledgeDir();
  const env = process.env.MARKETING_CONTEXT_DIR || process.env.MARKETING_KNOWLEDGE_DIR;
  if (env) {
    const rootDir2 = (0, import_node_path.resolve)(env);
    const bundledDir = bundled && bundled !== rootDir2 ? bundled : void 0;
    const marker = readContextMarker(rootDir2);
    const mode = marker.knowledge_mode === "plugin" || marker.knowledge_mode === "copy" ? marker.knowledge_mode : "unset";
    return {
      rootDir: rootDir2,
      bundledDir,
      knowledgeMode: bundledDir ? mode : "plugin",
      settings: settingsFromMarker(marker)
    };
  }
  const localKnowledge = (0, import_node_path.resolve)(process.cwd(), "knowledge");
  const rootDir = (0, import_node_fs.existsSync)(localKnowledge) ? localKnowledge : bundled || localKnowledge;
  return { rootDir, knowledgeMode: "plugin", settings: settingsFromMarker(readContextMarker(rootDir)) };
}

// dist/storage.js
var import_promises = require("node:fs/promises");
var import_node_path2 = require("node:path");
function safeSlug(value) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug || slug === "." || slug === "..") {
    throw new Error("Invalid slug.");
  }
  return slug;
}
function resolveInsideDir(baseDir, requestedPath) {
  const cleaned = requestedPath.replace(/^[/\\]+/, "");
  const resolved = (0, import_node_path2.resolve)(baseDir, cleaned);
  const rel = (0, import_node_path2.relative)(baseDir, resolved);
  if (rel === ".." || rel.startsWith(`..${import_node_path2.sep}`) || (0, import_node_path2.resolve)(baseDir) === resolved) {
    if (rel === "")
      return resolved;
    throw new Error("Path escapes MARKETING_CONTEXT_DIR.");
  }
  return resolved;
}
function relativeToRoot(cfg, absolutePath) {
  return (0, import_node_path2.relative)(cfg.rootDir, absolutePath).split(import_node_path2.sep).join("/");
}
function knowledgeLayers(cfg) {
  if (cfg.bundledDir && cfg.knowledgeMode !== "copy")
    return [cfg.bundledDir, cfg.rootDir];
  return [cfg.rootDir];
}
async function readKnowledgeFrom(baseDir, rel) {
  const raw = await (0, import_promises.readFile)(resolveInsideDir(baseDir, rel), "utf8");
  const { frontmatter, body } = parseFrontmatter(raw);
  return { path: rel, title: titleFromMarkdown(body, rel), frontmatter, body };
}
async function listMarkdownRelPaths(baseDir) {
  const files = await walk(baseDir).catch(() => []);
  return files.map((file) => (0, import_node_path2.relative)(baseDir, file).split(import_node_path2.sep).join("/")).filter((rel) => rel.endsWith(".md") && !rel.startsWith("clients/"));
}
async function listKnowledgeFiles(cfg) {
  const byPath = /* @__PURE__ */ new Map();
  for (const baseDir of knowledgeLayers(cfg)) {
    for (const rel of await listMarkdownRelPaths(baseDir)) {
      byPath.set(rel, await readKnowledgeFrom(baseDir, rel));
    }
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}
async function listClientNotes(cfg) {
  const files = await walk(cfg.rootDir).catch(() => []);
  const notes = [];
  for (const file of files) {
    const rel = relativeToRoot(cfg, file);
    if (!rel.startsWith("clients/") || !rel.endsWith(".md"))
      continue;
    if (/^clients\/[^/]+\/tasks\//.test(rel))
      continue;
    const content = (await (0, import_promises.readFile)(file, "utf8")).trim();
    if (content)
      notes.push({ slug: rel.split("/")[1] || "unknown", path: rel, content });
  }
  return notes.sort((a, b) => a.path.localeCompare(b.path));
}
function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n"))
    return { frontmatter: {}, body: raw };
  const end = raw.indexOf("\n---", 4);
  if (end === -1)
    return { frontmatter: {}, body: raw };
  const yaml = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\s+/, "");
  const frontmatter = {};
  for (const line of yaml.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match)
      continue;
    const [, key, rawValue] = match;
    frontmatter[key] = parseYamlishValue(rawValue.trim());
  }
  return { frontmatter, body };
}
function redactSecrets(input) {
  return input.replace(/\b(access|refresh|id)?_?token\s*[:=]\s*["']?[^"'\s]+/gi, "$1_token=[REDACTED]").replace(/\b(client_secret|api_key|secret|password|cookie)\s*[:=]\s*["']?[^"'\n]+/gi, "$1=[REDACTED]").replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]").replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED PRIVATE KEY]");
}
function parseYamlishValue(value) {
  if (value.startsWith("[") && value.endsWith("]")) {
    return value.slice(1, -1).split(",").map((item) => unquote(item.trim())).filter(Boolean);
  }
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  if (/^-?\d+(\.\d+)?$/.test(value))
    return Number(value);
  return unquote(value);
}
function unquote(value) {
  return value.replace(/^["']|["']$/g, "");
}
function titleFromMarkdown(body, fallback) {
  return body.match(/^#\s+(.+)$/m)?.[1]?.trim() || fallback.split("/").pop()?.replace(/\.md$/, "") || fallback;
}
async function walk(dir) {
  const entries = await (0, import_promises.readdir)(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = (0, import_node_path2.resolve)(dir, entry.name);
    if (entry.isDirectory())
      return walk(path);
    if (entry.isFile())
      return [path];
    return [];
  }));
  return nested.flat();
}
var PRIORITY_RANK = { high: 3, normal: 2, low: 1 };
async function listTasks(cfg, filter = {}) {
  const files = await walk(cfg.rootDir).catch(() => []);
  const tasks = [];
  for (const file of files) {
    const rel = relativeToRoot(cfg, file);
    if (!/^clients\/[^/]+\/tasks\/.+\.md$/.test(rel))
      continue;
    try {
      tasks.push(toTaskRecord(rel, await (0, import_promises.readFile)(file, "utf8")));
    } catch {
    }
  }
  const statusFilter = filter.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]).map((s) => s.toLowerCase()) : null;
  let out = tasks;
  if (filter.client_slug) {
    const s = safeSlug(filter.client_slug);
    out = out.filter((t) => t.slug === s);
  }
  if (filter.platform)
    out = out.filter((t) => (t.platform || "").toLowerCase() === filter.platform.toLowerCase());
  if (statusFilter)
    out = out.filter((t) => statusFilter.includes(t.status.toLowerCase()));
  if (filter.priority)
    out = out.filter((t) => t.priority.toLowerCase() === filter.priority.toLowerCase());
  if (filter.due_before)
    out = out.filter((t) => t.due && t.due <= filter.due_before);
  return out.sort(compareTasks);
}
function toTaskRecord(rel, raw) {
  const { frontmatter, body } = parseFrontmatter(raw);
  const knowledge = Array.isArray(frontmatter.knowledge) ? frontmatter.knowledge.map(String) : frontmatter.knowledge ? [String(frontmatter.knowledge)] : [];
  return {
    path: rel,
    id: frontmatter.id ? String(frontmatter.id) : rel,
    slug: rel.split("/")[1] || "unknown",
    title: titleFromMarkdown(body, rel),
    status: String(frontmatter.status || "open"),
    priority: String(frontmatter.priority || "normal"),
    platform: frontmatter.platform ? String(frontmatter.platform) : void 0,
    account_id: frontmatter.account_id ? String(frontmatter.account_id) : void 0,
    due: frontmatter.due ? String(frontmatter.due) : void 0,
    intent: frontmatter.intent ? String(frontmatter.intent) : void 0,
    suggested_workflow: frontmatter.suggested_workflow ? String(frontmatter.suggested_workflow) : void 0,
    knowledge,
    source_type: frontmatter.source_type ? String(frontmatter.source_type) : void 0,
    source_ref: frontmatter.source_ref ? String(frontmatter.source_ref) : void 0,
    recurring: frontmatter.recurring === true,
    schedule: frontmatter.schedule ? String(frontmatter.schedule) : void 0,
    next_due: frontmatter.next_due ? String(frontmatter.next_due) : void 0,
    last_run: frontmatter.last_run ? String(frontmatter.last_run) : void 0,
    body,
    frontmatter
  };
}
function compareTasks(a, b) {
  const pa = PRIORITY_RANK[a.priority.toLowerCase()] ?? 2;
  const pb = PRIORITY_RANK[b.priority.toLowerCase()] ?? 2;
  if (pa !== pb)
    return pb - pa;
  if (a.due && b.due && a.due !== b.due)
    return a.due < b.due ? -1 : 1;
  if (a.due && !b.due)
    return -1;
  if (!a.due && b.due)
    return 1;
  return a.path.localeCompare(b.path);
}
function isTaskDue(task, nowISO = (/* @__PURE__ */ new Date()).toISOString()) {
  const status = task.status.toLowerCase();
  if (status !== "open" && status !== "active")
    return false;
  if (task.next_due)
    return task.next_due <= nowISO;
  return true;
}
async function listDueTasks(cfg, filter = {}, nowISO = (/* @__PURE__ */ new Date()).toISOString()) {
  const tasks = await listTasks(cfg, filter);
  return tasks.filter((t) => isTaskDue(t, nowISO));
}

// dist/retrieval.js
var STOPWORDS = /* @__PURE__ */ new Set([
  // Polish
  "i",
  "w",
  "z",
  "ze",
  "na",
  "do",
  "o",
  "u",
  "\u017Ce",
  "sie",
  "si\u0119",
  "nie",
  "to",
  "jak",
  "czy",
  "co",
  "jest",
  "s\u0105",
  "sa",
  "dla",
  "po",
  "za",
  "od",
  "ale",
  "lub",
  "oraz",
  "przy",
  "bez",
  "pod",
  "nad",
  "lo",
  "ja",
  "my",
  "ty",
  "mi",
  "go",
  "jaki",
  "jaka",
  "jakie",
  "gdzie",
  "kiedy",
  "ile",
  "te\u017C",
  "ten",
  "tym",
  "tego",
  "by\u0142o",
  "by\u0107",
  "mo\u017Ce",
  // English
  "the",
  "a",
  "an",
  "of",
  "to",
  "for",
  "and",
  "or",
  "in",
  "on",
  "is",
  "are",
  "be",
  "by",
  "with",
  "how",
  "what",
  "when",
  "where",
  "my",
  "me",
  "it",
  // Platform names: already handled as a filter (platformOk / detectPlatforms), so
  // as free-text terms they only add noise — they match every doc of that platform
  // (incl. benchmark titles) and drown out the topically-specific match.
  "ads",
  "reklama",
  "reklamy",
  "google",
  "meta",
  "facebook",
  "instagram",
  "fb",
  "ig"
]);
var MIN_STEM = 4;
var PL_SUFFIXES = [
  "owania",
  "owanie",
  "owa\u0107",
  "i\u0142a",
  "y\u0142",
  "ami",
  "ach",
  "om",
  "owy",
  "owe",
  "owa",
  "ego",
  "emu",
  "ych",
  "ymi",
  "ij",
  "\xF3w",
  "em",
  "ie",
  "a\u0107",
  "\u0119",
  "\u0105",
  "y",
  "i",
  "a",
  "e",
  "u",
  "o"
];
function stem(word) {
  for (const suffix of PL_SUFFIXES) {
    if (word.length - suffix.length >= MIN_STEM && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}
function tokenize(text) {
  return text.toLowerCase().split(/[^\p{L}\p{N}+]+/u).filter((t) => t.length > 1 && !STOPWORDS.has(t)).map(stem);
}
function frontmatterList(frontmatter, key) {
  const value = frontmatter[key];
  if (Array.isArray(value))
    return value.map((item) => String(item).toLowerCase());
  if (value === void 0 || value === null || value === "")
    return [];
  return [String(value).toLowerCase()];
}
var indexCache = /* @__PURE__ */ new WeakMap();
function indexDoc(doc) {
  const cached = indexCache.get(doc);
  if (cached)
    return cached;
  const index = {
    title: tokenize(doc.title),
    path: tokenize(doc.path.replace(/\.md$/, "")),
    keywords: tokenize(frontmatterList(doc.frontmatter, "keywords").join(" ")),
    summary: tokenize(String(doc.frontmatter.summary || "")),
    body: [...new Set(tokenize(doc.body))]
  };
  indexCache.set(doc, index);
  return index;
}
var MIN_PREFIX = 5;
function termMatches(term, tokens) {
  for (const token of tokens) {
    if (token === term)
      return true;
    if (Math.min(term.length, token.length) >= MIN_PREFIX && (token.startsWith(term) || term.startsWith(token))) {
      return true;
    }
  }
  return false;
}
function scoreDocDetailed(doc, terms) {
  const index = indexDoc(doc);
  let score = 0;
  let titleHit = false;
  let keywordHit = false;
  let pathHit = false;
  let hitTerms = 0;
  for (const term of terms) {
    let hit = false;
    if (termMatches(term, index.title)) {
      score += 8;
      titleHit = true;
      hit = true;
    }
    if (termMatches(term, index.keywords)) {
      score += 6;
      keywordHit = true;
      hit = true;
    }
    if (termMatches(term, index.path)) {
      score += 5;
      pathHit = true;
      hit = true;
    }
    if (termMatches(term, index.summary)) {
      score += 4;
      hit = true;
    }
    if (termMatches(term, index.body)) {
      score += 1;
      hit = true;
    }
    if (hit)
      hitTerms += 1;
  }
  return { score, titleHit, keywordHit, pathHit, hitTerms };
}
var CONFIDENT_ABS_SCORE = 16;
var CONFIDENT_LIMIT = 5;
function isConfidentMatch(s) {
  return s.hitTerms >= 2 && (s.titleHit || s.keywordHit || s.score >= CONFIDENT_ABS_SCORE);
}
function eligibleForStage(doc, stage) {
  const stages = frontmatterList(doc.frontmatter, "trigger_stage");
  return stages.length === 0 || stages.includes(stage);
}
function matchesTool(doc, toolName) {
  const tool = toolName.toLowerCase();
  return frontmatterList(doc.frontmatter, "trigger_tools").some((trigger) => tool.includes(trigger));
}
function priorityOf(doc) {
  const value = doc.frontmatter.priority;
  return typeof value === "number" ? value : Number(value) || 0;
}
function detectPlatforms(text) {
  const t = text.toLowerCase();
  const hits = [];
  if (/google[\s_-]?ads|gaql|pmax|performance max|merchant|ga4|consent mode|search campaign|keyword|shopping/.test(t)) {
    hits.push("google-ads");
  }
  if (/meta[\s_-]?ads|facebook|instagram|\babo\b|\bcbo\b|advantage\+?|lookalike|\bpixel\b|\bcapi\b|reels|placement|ad set|adset/.test(t)) {
    hits.push("meta-ads");
  }
  return hits;
}
function selectForPromptScored(docs, query, opts = {}) {
  const { limit = 5, exclude, platforms } = opts;
  const terms = tokenize(query);
  const ranked = docs.filter((doc) => eligibleForStage(doc, "prompt")).filter((doc) => !exclude?.has(doc.path)).filter((doc) => platformOk(doc, platforms)).map((doc) => ({ doc, s: scoreDocDetailed(doc, terms) })).filter((item) => item.s.score > 0).sort((a, b) => b.s.score - a.s.score || priorityOf(b.doc) - priorityOf(a.doc) || a.doc.path.localeCompare(b.doc.path));
  let confidentCount = 0;
  return ranked.slice(0, limit).map((item) => {
    const confident = isConfidentMatch(item.s) && confidentCount < CONFIDENT_LIMIT;
    if (confident)
      confidentCount += 1;
    return { doc: item.doc, score: item.s.score, confident };
  });
}
function selectForSessionStart(docs, opts = {}) {
  const { limit = 3, exclude, platforms } = opts;
  return docs.filter((doc) => doc.frontmatter.session_start === true || priorityOf(doc) >= 5).filter((doc) => !exclude?.has(doc.path)).filter((doc) => platformOk(doc, platforms)).sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path)).slice(0, limit);
}
function isCrossPlatform(doc) {
  const applies = frontmatterList(doc.frontmatter, "applies_to");
  return applies.includes("google-ads") && applies.includes("meta-ads");
}
function selectSessionStartGeneric(docs, opts = {}) {
  const { limit = 2, exclude } = opts;
  return docs.filter((doc) => doc.frontmatter.session_start === true || priorityOf(doc) >= 5).filter((doc) => !exclude?.has(doc.path)).filter((doc) => isCrossPlatform(doc)).sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path)).slice(0, limit);
}
function selectForTool(docs, toolName, opts = {}) {
  const { limit = 2, exclude } = opts;
  return docs.filter((doc) => eligibleForStage(doc, "pre_tool")).filter((doc) => !exclude?.has(doc.path)).filter((doc) => matchesTool(doc, toolName)).sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path)).slice(0, limit);
}
function requiredReading(docs, platform) {
  return docs.filter((doc) => doc.frontmatter.enforce_read === true).filter((doc) => frontmatterList(doc.frontmatter, "applies_to").includes(platform)).sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path));
}
function platformOk(doc, platforms) {
  if (!platforms || platforms.length === 0)
    return true;
  const appliesTo = frontmatterList(doc.frontmatter, "applies_to");
  if (appliesTo.length === 0)
    return true;
  return appliesTo.some((p) => platforms.includes(p));
}

// dist/hook.js
var cachedCfg = null;
function hookCfg() {
  return cachedCfg ??= resolveRootsSync();
}
var SHARD_LIMIT = 9e3;
var MUTATION_TOOLS = ["confirm_mutation", "confirm_all_mutations"];
var ENFORCE_MAX_DENIES = 3;
var SEMANTIC_TIMEOUT_MS = Number(process.env.MARKETING_CONTEXT_SEMANTIC_TIMEOUT_MS || 350);
var SEMANTIC_INJECT = Number(process.env.MARKETING_CONTEXT_SEMANTIC_INJECT || 0.45);
var SEMANTIC_ENFORCE = Number(process.env.MARKETING_CONTEXT_SEMANTIC_ENFORCE || 0.6);
async function main() {
  const input = await readInput();
  if (!input)
    process.exit(0);
  const event = String(input.hook_event_name || "");
  const { shard, shards } = parseShardArgs();
  if (shard > 1) {
    await emitFollowerChunk(event, input.session_id, shard);
    process.exit(0);
  }
  const cfg = hookCfg();
  if (!(0, import_node_fs2.existsSync)(cfg.rootDir) && !(cfg.bundledDir && (0, import_node_fs2.existsSync)(cfg.bundledDir)))
    process.exit(0);
  const state = loadState(input.session_id);
  const capacity = shards * SHARD_LIMIT - shards * 120;
  let text = "";
  try {
    const docs = await listKnowledgeFiles(cfg);
    const exclude = new Set(state.injected);
    if (event === "SessionStart") {
      text = renderKnowledgeToc(docs, state, capacity);
      text = appendClientNotes(text, await renderClientNotes(cfg, state, capacity - text.length));
    } else if (event === "UserPromptSubmit") {
      state.round += 1;
      const prompt = String(input.prompt || "");
      const platforms = detectPlatforms(prompt);
      const semantic = await semanticRank(input, prompt);
      const scored = selectForPromptScored(docs, prompt, { platforms, exclude, limit: 3 });
      const picked = scored.filter((s) => s.confident).map((s) => s.doc);
      const semanticPicked = semantic.filter((match) => match.similarity >= SEMANTIC_INJECT).map((match) => docs.find((doc) => doc.path === match.path)).filter((doc) => Boolean(doc)).filter((doc) => !exclude.has(doc.path)).filter((doc) => !picked.some((d) => d.path === doc.path));
      picked.push(...semanticPicked.slice(0, 3));
      for (const match of semantic.filter((m) => m.similarity >= SEMANTIC_ENFORCE)) {
        if (!state.semanticRequired.includes(match.path))
          state.semanticRequired.push(match.path);
      }
      debugLog(input.session_id, "prompt-scoring", {
        round: state.round,
        prompt: prompt.slice(0, 200),
        platforms,
        scored: scored.map((s) => ({ path: s.doc.path, score: s.score, confident: s.confident })),
        semantic: semantic.map((s) => ({ path: s.path, similarity: s.similarity })),
        semanticRequired: state.semanticRequired
      });
      if (state.round === 1 && !state.tocInjected) {
        text = renderKnowledgeToc(docs, state, capacity);
        text = appendClientNotes(text, await renderClientNotes(cfg, state, capacity - text.length));
        saveState(input.session_id, state);
        const chunks2 = splitIntoChunks(text.trim(), shards);
        writeFollowerChunks(event, input.session_id, chunks2, shards);
        if (chunks2[0])
          emit(event, chunks2[0]);
        process.exit(0);
      }
      if (state.round === 1 && (platforms.length > 0 || picked.length > 0)) {
        const generic = selectSessionStartGeneric(docs, { exclude, limit: 2 }).filter((doc) => !picked.some((d) => d.path === doc.path));
        picked.unshift(...generic);
      }
      const platformStart = selectForSessionStart(docs, { platforms, exclude, limit: 4 }).filter((doc) => platforms.length > 0).filter((doc) => !picked.some((d) => d.path === doc.path));
      picked.unshift(...platformStart);
      text = renderDocs(picked, state, capacity);
      if (state.round === 1) {
        text = appendClientNotes(text, await renderClientNotes(cfg, state, capacity - text.length));
      }
      const wantsTasks = TASK_INTENT_RE.test(prompt);
      if (!state.tasksInjected || wantsTasks) {
        const filter = {};
        if (state.currentClient)
          filter.client_slug = state.currentClient;
        let tasks = await listDueTasks(cfg, filter);
        if (!state.currentClient && platforms.length > 0) {
          tasks = tasks.filter((t) => !t.platform || platforms.includes(t.platform));
        }
        if (tasks.length > 0 && (state.currentClient || platforms.length > 0 || wantsTasks)) {
          const block = renderTasks(tasks.slice(0, 5), capacity - text.length);
          if (block) {
            text = text ? `${text}

${block}` : block;
            state.tasksInjected = true;
          }
        }
      }
    } else if (event === "PreToolUse") {
      const toolName = String(input.tool_name || "");
      const clientSlugs = state.clientNotesPending && !state.currentClient ? [...new Set((await listClientNotes(cfg)).map((n) => n.slug))] : [];
      const gate = checkRequiredReading(docs, toolName, state, clientSlugs);
      if (gate) {
        debugLog(input.session_id, "enforce", { tool: toolName, ...gate });
        if (gate.action === "deny") {
          saveState(input.session_id, state);
          emitDeny(gate.reason);
          process.exit(0);
        }
        text = gate.reason;
      } else {
        const picked = selectForTool(docs, toolName, { exclude, limit: 3 });
        text = renderDocs(picked, state, capacity);
      }
    } else if (event === "PostToolUse") {
      const toolName = String(input.tool_name || "");
      if (toolName.includes("read_knowledge")) {
        recordKnowledgeRead(input, state);
        saveState(input.session_id, state);
        process.exit(0);
      }
      if (toolName.includes("set_current_client") || toolName.includes("get_client_context")) {
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
  writeFollowerChunks(event, input.session_id, chunks, shards);
  if (chunks[0])
    emit(event, chunks[0]);
  process.exit(0);
}
function parseShardArgs() {
  let shard = 1;
  let shards = 1;
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--(shard|shards)=(\d+)$/);
    if (m) {
      if (m[1] === "shard")
        shard = Math.max(1, Number(m[2]));
      else
        shards = Math.max(1, Number(m[2]));
    }
  }
  return { shard, shards: Math.max(shard, shards) };
}
function splitIntoChunks(text, shards) {
  if (!text)
    return [];
  if (text.length <= SHARD_LIMIT || shards === 1)
    return [text.slice(0, SHARD_LIMIT)];
  const chunks = [];
  let rest = text;
  while (rest.length > 0 && chunks.length < shards) {
    const isLast = chunks.length === shards - 1;
    const label = chunks.length === 0 ? "" : `[marketing-context${hookVersion()}] (part ${chunks.length + 1}/${shards} \u2014 continuation of the previous block)
`;
    const room = SHARD_LIMIT - label.length;
    if (rest.length <= room) {
      chunks.push(label + rest);
      rest = "";
      break;
    }
    const slice = rest.slice(0, room);
    const entry = slice.lastIndexOf("\n- ");
    const para = slice.lastIndexOf("\n\n");
    const line = slice.lastIndexOf("\n");
    let cut = entry > room * 0.5 ? entry : para > room * 0.5 ? para : line > room * 0.5 ? line : room;
    if (isLast)
      cut = Math.min(cut, room);
    chunks.push(label + rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).replace(/^\n+/, "");
  }
  return chunks;
}
function chunkPath(event, sessionId, shard) {
  const sid = (sessionId || "nosession").replace(/[^a-zA-Z0-9._-]/g, "_");
  return (0, import_node_path3.join)(stateDir(), `chunk-${sid}-${event}-${shard}.txt`);
}
function writeFollowerChunks(event, sessionId, chunks, shards) {
  try {
    (0, import_node_fs2.mkdirSync)(stateDir(), { recursive: true });
    for (let i = 2; i <= shards; i++) {
      (0, import_node_fs2.writeFileSync)(chunkPath(event, sessionId, i), chunks[i - 1] || "", "utf8");
    }
  } catch {
  }
}
async function emitFollowerChunk(event, sessionId, shard) {
  const path = chunkPath(event, sessionId, shard);
  const deadline = Date.now() + 5e3;
  while (Date.now() < deadline) {
    try {
      const stat = (0, import_node_fs2.statSync)(path);
      if (Date.now() - stat.mtimeMs < 3e4) {
        const content = (0, import_node_fs2.readFileSync)(path, "utf8");
        try {
          (0, import_node_fs2.unlinkSync)(path);
        } catch {
        }
        if (content.trim()) {
          await sleep(150 * (shard - 1));
          emit(event, content.trim());
        }
        return;
      }
    } catch {
    }
    await sleep(50);
  }
}
function sleep(ms) {
  return new Promise((resolve4) => setTimeout(resolve4, ms));
}
function renderDocs(docs, state, budget = SHARD_LIMIT) {
  if (docs.length === 0)
    return "";
  const lines = [
    `[marketing-context${hookVersion()}] MANDATORY knowledge start pack. These are required context pointers, not optional reading. Before planning, reviewing, or mutating ads accounts, call read_knowledge for the relevant listed core article(s) and use the summaries below only as a compact index:`
  ];
  let used = lines[0].length;
  for (const doc of docs) {
    const summary = String(doc.frontmatter.summary || "").trim();
    const related = frontmatterList(doc.frontmatter, "related");
    const rawSource = doc.frontmatter.source;
    const source = Array.isArray(rawSource) ? rawSource.map(String) : rawSource ? [String(rawSource)] : [];
    const head = `
- ${doc.path}${summary ? ` \u2014 ${summary}` : ""}`;
    let tail = "";
    if (source.length)
      tail += `
  Source: ${truncate(source.join("; "), 160)}`;
    if (related.length)
      tail += `
  Related: ${related.join(", ")}`;
    const block = `${head}
  Required reading: read_knowledge("${doc.path}")${tail}`;
    if (used + block.length > budget)
      break;
    lines.push(block);
    used += block.length;
    state.injected.push(doc.path);
  }
  return lines.length > 1 ? lines.join("") : "";
}
function renderKnowledgeToc(docs, state, budget = SHARD_LIMIT) {
  if (state.tocInjected)
    return "";
  state.tocInjected = true;
  const lines = [
    `[marketing-context${hookVersion()}] MANDATORY knowledge table of contents. This is the map of available articles, not the articles themselves. Before planning, reviewing, or mutating ads accounts, choose the relevant path(s) below and call read_knowledge("<path>"). Article summaries are written as "when to read / what it protects".`,
    "",
    "Start here:",
    '- Cross-platform account work: read_knowledge("general/account-management-philosophy.md")',
    '- Google Ads work: read_knowledge("google-ads/always-never-checklist.md")',
    '- Meta Ads work: read_knowledge("meta-ads/account-structure-learning-phase.md")',
    ""
  ];
  let used = lines.join("\n").length;
  let currentGroup = "";
  for (const doc of docs) {
    const group = doc.path.includes("/") ? doc.path.split("/")[0] : "root";
    if (group !== currentGroup) {
      const heading = `
## ${group}`;
      if (used + heading.length > budget)
        break;
      lines.push(heading);
      used += heading.length;
      currentGroup = group;
    }
    const summary = compactSummary(String(doc.frontmatter.summary || doc.title || "").trim(), 115);
    const item = `- ${doc.path}${summary ? ` \u2014 ${summary}` : ""}`;
    if (used + item.length + 1 > budget)
      break;
    lines.push(item);
    used += item.length + 1;
  }
  return lines.join("\n");
}
var TASK_INTENT_RE = /what.*(should|to).*(do|next)|what'?s\s+due|to-?do|due tasks?|open tasks?|run a review|\bzadani|zaleg|otwarte zadan|co\s+(mam|robi|robimy|dalej|teraz)|przegl[aą]d/i;
function renderTasks(tasks, budget) {
  if (tasks.length === 0)
    return "";
  const lines = [
    `[marketing-context${hookVersion()}] Active tasks (${tasks.length}), most urgent first. These are stored operational intents. Before unrelated work, consider addressing them; each names the knowledge to read and the workflow to run:`
  ];
  let used = lines[0].length;
  for (const t of tasks) {
    const due = t.due ? ` \xB7 due ${t.due}` : "";
    const head = `
- [${t.priority}]${due} ${t.title}  (${t.path})`;
    let tail = "";
    const why = firstBodyLine(t.body);
    if (why)
      tail += `
  Why: ${truncate(why, 160)}`;
    if (t.suggested_workflow)
      tail += `
  Workflow: read_knowledge("${t.suggested_workflow}")`;
    if (t.knowledge.length)
      tail += `
  Knowledge: ${t.knowledge.join(", ")}`;
    const src = [t.source_type, t.source_ref].filter(Boolean).join(" ");
    if (src)
      tail += `
  Source: ${truncate(src, 120)}`;
    tail += `
  When done: update_task_status("${t.path}", "done", "<result>"), then record append_review / append_mutation.`;
    const block = head + tail;
    if (used + block.length > budget)
      break;
    lines.push(block);
    used += block.length;
  }
  return lines.length > 1 ? lines.join("") : "";
}
function firstBodyLine(body) {
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("---"))
      continue;
    return t.replace(/^Reason:\s*/i, "");
  }
  return "";
}
function appendClientNotes(base, notes) {
  if (!notes)
    return base;
  return base ? `${base}

${notes}` : notes;
}
async function renderClientNotes(cfg, state, maxChars) {
  if (state.notesInjected)
    return "";
  const notes = await listClientNotes(cfg);
  if (notes.length === 0) {
    state.notesInjected = true;
    return "";
  }
  state.notesInjected = true;
  const slugs = [...new Set(notes.map((n) => n.slug))];
  const total = notes.reduce((sum, n) => sum + n.content.length, 0);
  if (total > maxChars) {
    state.clientNotesPending = true;
    return `[marketing-context${hookVersion()}] Client notes (${slugs.join(", ")}) take ~${Math.round(total / 1e3)}k chars and exceed the injection limit (~${Math.max(1, Math.round(maxChars / 1e3))}k) \u2014 NOT injected automatically. Before working on ads accounts call set_current_client (with several clients FIRST ask the user which one this session concerns) \u2014 the tool returns the client's full context. Also consider pruning stale entries.`;
  }
  const lines = [`[marketing-context${hookVersion()}] Client notes (locally stored context \u2014 treat as the source of truth about the client):`];
  let lastSlug = "";
  for (const note of notes) {
    if (note.slug !== lastSlug) {
      lines.push(`
## Client: ${note.slug}`);
      lastSlug = note.slug;
    }
    lines.push(`
### ${note.path}
${redactSecrets(note.content)}`);
  }
  return lines.join("\n");
}
var GATE_EXEMPT_EXACT = ["update_plugin", "list_accounts", "list_ad_accounts", "get_safety_setup"];
var GATE_EXEMPT_PREFIX = ["setup_"];
function checkRequiredReading(docs, toolName, state, clientSlugs = []) {
  if (!isEnabled(hookCfg(), "enforce_required_reading"))
    return null;
  const baseName = toolName.split("__").pop() || toolName;
  if (GATE_EXEMPT_EXACT.includes(baseName))
    return null;
  if (GATE_EXEMPT_PREFIX.some((prefix) => baseName.startsWith(prefix)))
    return null;
  const platform = toolName.includes("google-ads") ? "google-ads" : toolName.includes("meta-ads") ? "meta-ads" : "";
  if (!platform)
    return null;
  const read = new Set(state.readDocs);
  const missing = requiredReading(docs, platform).map((doc) => doc.path).concat(state.semanticRequired.filter((path) => {
    const doc = docs.find((candidate) => candidate.path === path);
    if (!doc)
      return false;
    const appliesTo = frontmatterList(doc.frontmatter, "applies_to");
    return appliesTo.length === 0 || appliesTo.includes(platform);
  })).filter((path, index, all) => all.indexOf(path) === index).filter((path) => !read.has(path));
  const needsClient = state.clientNotesPending === true && !state.currentClient && clientSlugs.length > 0;
  if (missing.length === 0 && !needsClient)
    return null;
  const denies = state.denies[platform] || 0;
  if (denies >= ENFORCE_MAX_DENIES) {
    const gaps = [
      ...missing.length ? [`${missing.join(", ")} was never read`] : [],
      ...needsClient ? ["no client was declared via set_current_client"] : []
    ];
    return {
      action: "warn",
      platform,
      missing,
      reason: `[marketing-context${hookVersion()}] WARNING: proceeding WITHOUT the required ${platform} baseline (${gaps.join("; ")} this session). Outcomes may violate account or client ground rules.`
    };
  }
  state.denies[platform] = denies + 1;
  const steps = [];
  if (missing.length) {
    steps.push(`call ${missing.map((path) => `read_knowledge("${path}")`).join(", ")} on the marketing-context MCP server`);
  }
  if (needsClient) {
    steps.push(clientSlugs.length === 1 ? `call set_current_client() \u2014 the only stored client ("${clientSlugs[0]}") is selected automatically and its full context is returned` : `ASK THE USER which client this session concerns (stored: ${clientSlugs.join(", ")}) \u2014 do not guess \u2014 then call set_current_client with that client_slug to load the client's full context`);
  }
  return {
    action: "deny",
    platform,
    missing,
    reason: `Blocked by marketing-context${hookVersion()}: before working on ${platform} this session you must first ` + steps.map((step, i) => `(${i + 1}) ${step}`).join("; ") + `. Then retry this tool call. This gate exists because the baseline articles and client notes carry ground rules (thresholds, always/never lists, client preferences) that both analysis and mutations must respect.`
  };
}
function recordKnowledgeRead(input, state) {
  const toolInput = input.tool_input;
  const path = String(toolInput?.path || "").replace(/^[/\\]+/, "");
  if (path && !state.readDocs.includes(path))
    state.readDocs.push(path);
  debugLog(input.session_id, "read-recorded", { path, readDocs: state.readDocs });
}
async function recordClientSelection(input, state, cfg) {
  const toolInput = input.tool_input;
  const requested = String(toolInput?.client_slug || "").trim().toLowerCase();
  let slugs = [];
  try {
    slugs = [...new Set((await listClientNotes(cfg)).map((n) => n.slug))];
  } catch {
    return;
  }
  const slug = requested ? slugs.includes(requested) ? requested : "" : slugs.length === 1 ? slugs[0] : "";
  if (slug) {
    state.currentClient = slug;
    state.clientNotesPending = false;
  }
  debugLog(input.session_id, "client-selected", { requested, resolved: slug || null, slugs });
}
function emitDeny(reason) {
  const host = String(process.env.CLAUDECODE || process.env.CODEX || "").toLowerCase();
  if (host.includes("codex")) {
    process.stdout.write(JSON.stringify({ additionalContext: reason }));
    return;
  }
  process.stdout.write(JSON.stringify({
    decision: "block",
    reason,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason
    }
  }));
}
function renderPostToolReminder(toolName) {
  const isMutation = MUTATION_TOOLS.some((name) => toolName.includes(name));
  if (!isMutation)
    return "";
  return "The user just confirmed an advertising mutation. Consider recording a concise business note with marketing-context.append_mutation or append_decision if it will matter in future work.";
}
function emit(event, text) {
  const host = String(process.env.CLAUDECODE || process.env.CODEX || "").toLowerCase();
  if (host.includes("codex")) {
    process.stdout.write(JSON.stringify({ additionalContext: text }));
    return;
  }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}
function embedDiscoveryPath() {
  if (process.env.MARKETING_CONTEXT_EMBED_DISCOVERY)
    return process.env.MARKETING_CONTEXT_EMBED_DISCOVERY;
  return (0, import_node_path3.join)(stateDir(), "embed-endpoint.json");
}
async function semanticRank(input, prompt) {
  if (!isEnabled(hookCfg(), "semantic_ranking"))
    return [];
  let endpoint = null;
  try {
    endpoint = JSON.parse((0, import_node_fs2.readFileSync)(embedDiscoveryPath(), "utf8"));
  } catch {
    debugLog(input.session_id, "semantic-rank", { status: "no_discovery", path: embedDiscoveryPath() });
    return [];
  }
  const port = Number(endpoint?.port);
  const token = String(endpoint?.token || "");
  if (!port || !token) {
    debugLog(input.session_id, "semantic-rank", { status: "invalid_discovery", path: embedDiscoveryPath() });
    return [];
  }
  const text = conversationWindow(input, prompt);
  if (!text.trim()) {
    debugLog(input.session_id, "semantic-rank", { status: "empty_text" });
    return [];
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEMANTIC_TIMEOUT_MS);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/rank`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ text, limit: 8 }),
      signal: controller.signal
    });
    if (!res.ok) {
      debugLog(input.session_id, "semantic-rank", { status: "http_error", code: res.status });
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data.matches)) {
      debugLog(input.session_id, "semantic-rank", { status: "bad_response" });
      return [];
    }
    const matches = data.matches.map((item) => normalizeSemanticMatch(item)).filter((item) => Boolean(item));
    debugLog(input.session_id, "semantic-rank", {
      status: "ok",
      count: matches.length,
      top: matches.slice(0, 5).map((m) => ({ path: m.path, similarity: m.similarity }))
    });
    return matches;
  } catch (error) {
    debugLog(input.session_id, "semantic-rank", {
      status: "request_failed",
      error: String(error?.message || error).slice(0, 200)
    });
    return [];
  } finally {
    clearTimeout(timer);
  }
}
function normalizeSemanticMatch(value) {
  if (!value || typeof value !== "object")
    return null;
  const item = value;
  const path = String(item.path || "").replace(/^[/\\]+/, "");
  const similarity = Number(item.similarity);
  if (!path || !Number.isFinite(similarity))
    return null;
  const appliesTo = Array.isArray(item.applies_to) ? item.applies_to.map(String) : [];
  return { path, applies_to: appliesTo, similarity };
}
function conversationWindow(input, prompt) {
  const transcript = extractTranscriptWindow(input.transcript_path, 10, 7e3);
  const current = prompt.trim() ? `user: ${prompt.trim()}` : "";
  return [transcript, current].filter(Boolean).join("\n\n").slice(-8e3);
}
function extractTranscriptWindow(transcriptPath, maxMessages, maxChars) {
  if (!transcriptPath || !(0, import_node_fs2.existsSync)(transcriptPath))
    return "";
  const messages = [];
  try {
    const lines = (0, import_node_fs2.readFileSync)(transcriptPath, "utf8").trimEnd().split("\n");
    for (let i = lines.length - 1; i >= 0 && messages.length < maxMessages; i--) {
      const parsed = JSON.parse(lines[i]);
      if (parsed?.sourceToolAssistantUUID)
        continue;
      const role = parsed?.message?.role || parsed?.type;
      if (role !== "user" && role !== "assistant")
        continue;
      const text = extractMessageText(parsed?.message?.content ?? parsed?.content);
      if (!text)
        continue;
      messages.push(`${role}: ${text}`);
    }
  } catch {
    return "";
  }
  return messages.reverse().join("\n\n").slice(-maxChars);
}
function extractMessageText(content) {
  if (typeof content === "string")
    return cleanTranscriptText(content);
  if (!Array.isArray(content))
    return "";
  return cleanTranscriptText(content.map((part) => {
    if (typeof part === "string")
      return part;
    if (!part || typeof part !== "object")
      return "";
    const item = part;
    if (item.type && String(item.type).includes("tool"))
      return "";
    return typeof item.text === "string" ? item.text : typeof item.content === "string" ? item.content : "";
  }).filter(Boolean).join("\n"));
}
function cleanTranscriptText(text) {
  return text.replace(/<task-notification>[\s\S]*?<\/task-notification>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1800);
}
function stateDir() {
  return (0, import_node_path3.join)((0, import_node_os.tmpdir)(), "marketing-context-hook");
}
function statePath(sessionId) {
  if (!sessionId)
    return null;
  const safe = sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return (0, import_node_path3.join)(stateDir(), `${safe}.json`);
}
function loadState(sessionId) {
  const path = statePath(sessionId);
  if (path && (0, import_node_fs2.existsSync)(path)) {
    try {
      const parsed = JSON.parse((0, import_node_fs2.readFileSync)(path, "utf8"));
      return {
        round: Number(parsed.round) || 0,
        injected: Array.isArray(parsed.injected) ? parsed.injected : [],
        notesInjected: parsed.notesInjected === true,
        tocInjected: parsed.tocInjected === true,
        tasksInjected: parsed.tasksInjected === true,
        readDocs: Array.isArray(parsed.readDocs) ? parsed.readDocs : [],
        denies: parsed.denies && typeof parsed.denies === "object" ? parsed.denies : {},
        clientNotesPending: parsed.clientNotesPending === true,
        currentClient: typeof parsed.currentClient === "string" ? parsed.currentClient : void 0,
        semanticRequired: Array.isArray(parsed.semanticRequired) ? parsed.semanticRequired : []
      };
    } catch {
    }
  }
  return { round: 0, injected: [], readDocs: [], denies: {}, semanticRequired: [] };
}
function saveState(sessionId, state) {
  const path = statePath(sessionId);
  if (!path)
    return;
  try {
    (0, import_node_fs2.mkdirSync)(stateDir(), { recursive: true });
    (0, import_node_fs2.writeFileSync)(path, JSON.stringify(state), "utf8");
  } catch {
  }
}
function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}\u2026`;
}
function compactSummary(text, max) {
  if (text.length <= max)
    return text;
  const slice = text.slice(0, max);
  const cut = Math.max(slice.lastIndexOf("; "), slice.lastIndexOf(". "), slice.lastIndexOf(", "), slice.lastIndexOf(" "));
  return `${slice.slice(0, cut > max * 0.45 ? cut : max).trimEnd()}\u2026`;
}
function debugLog(sessionId, kind, data) {
  if (!isEnabled(hookCfg(), "debug"))
    return;
  try {
    (0, import_node_fs2.mkdirSync)(stateDir(), { recursive: true });
    const line = JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), session: sessionId || "nosession", kind, ...data });
    (0, import_node_fs2.appendFileSync)((0, import_node_path3.join)(stateDir(), "debug.jsonl"), `${line}
`, "utf8");
  } catch {
  }
}
function hookVersion() {
  try {
    const dir = process.argv[1] ? (0, import_node_path3.resolve)(process.argv[1], "..") : process.cwd();
    for (const candidate of [(0, import_node_path3.join)(dir, "package.json"), (0, import_node_path3.join)(dir, "..", "package.json")]) {
      if (!(0, import_node_fs2.existsSync)(candidate))
        continue;
      const version = JSON.parse((0, import_node_fs2.readFileSync)(candidate, "utf8")).version;
      if (version)
        return ` v${version}`;
    }
  } catch {
  }
  return "";
}
async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin)
    chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return null;
  }
}
void main();
