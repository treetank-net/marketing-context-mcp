import type { KnowledgeDoc } from './storage.js';

export type Frontmatter = KnowledgeDoc['frontmatter'];
export type Stage = 'prompt' | 'pre_tool' | 'post_tool';

const STOPWORDS = new Set([
  // Polish
  'i', 'w', 'z', 'ze', 'na', 'do', 'o', 'u', 'że', 'sie', 'się', 'nie', 'to', 'jak', 'czy',
  'co', 'jest', 'są', 'sa', 'dla', 'po', 'za', 'od', 'ale', 'lub', 'oraz', 'przy', 'bez',
  'pod', 'nad', 'lo', 'ja', 'my', 'ty', 'mi', 'go', 'jaki', 'jaka', 'jakie', 'gdzie', 'kiedy',
  'ile', 'też', 'ten', 'tym', 'tego', 'było', 'być', 'może',
  // English
  'the', 'a', 'an', 'of', 'to', 'for', 'and', 'or', 'in', 'on', 'is', 'are', 'be', 'by',
  'with', 'how', 'what', 'when', 'where', 'my', 'me', 'it',
  // Platform names: already handled as a filter (platformOk / detectPlatforms), so
  // as free-text terms they only add noise — they match every doc of that platform
  // (incl. benchmark titles) and drown out the topically-specific match.
  'ads', 'reklama', 'reklamy', 'google', 'meta', 'facebook', 'instagram', 'fb', 'ig',
]);

// Polish inflection suffixes, longest first. We strip them from query terms to a
// stem that stays a PREFIX of the surface forms (e.g. "kreacje"/"kreacji" → "kreac",
// "testować"/"testowanie" → "testow"), so substring matching against raw doc text
// catches inflected variants. Never stems below MIN_STEM chars to avoid false hits.
const MIN_STEM = 4;
const PL_SUFFIXES = [
  'owania', 'owanie', 'ować', 'iła', 'ył', 'ami', 'ach', 'om', 'owy', 'owe', 'owa',
  'ego', 'emu', 'ych', 'ymi', 'ij', 'ów', 'em', 'ie', 'ać', 'ę', 'ą', 'y', 'i', 'a', 'e', 'u', 'o',
];

function stem(word: string): string {
  for (const suffix of PL_SUFFIXES) {
    if (word.length - suffix.length >= MIN_STEM && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/** Split free text into lowercase, stemmed search terms, dropping stopwords and 1-char tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}+]+/u)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

/** Normalize a frontmatter field to a lowercase string array. */
export function frontmatterList(frontmatter: Frontmatter, key: string): string[] {
  const value = frontmatter[key];
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase());
  if (value === undefined || value === null || value === '') return [];
  return [String(value).toLowerCase()];
}

export function matchesFrontmatter(frontmatter: Frontmatter, key: string, expected?: string): boolean {
  if (!expected) return true;
  const want = expected.toLowerCase();
  const value = frontmatter[key];
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase()).includes(want);
  return String(value ?? '').toLowerCase() === want;
}

export interface DocScore {
  score: number;
  /** A query term appeared in the document title (strongest topical signal). */
  titleHit: boolean;
  /** A query term appeared in the frontmatter keywords (curated topical signal). */
  keywordHit: boolean;
  /** A query term appeared in the document path. */
  pathHit: boolean;
  /** How many distinct query terms were found anywhere in the doc. */
  hitTerms: number;
}

// Per-field token index. Frontmatter is the database: title, curated keywords,
// summary and path carry nearly all the score; the raw body is only a weak
// tiebreaker. Tokens on both sides go through the same tokenize/stem pipeline,
// so matching is word-boundary based — a query stem must align with a whole
// document token (never a substring of one), which is what stops "ram" from
// matching inside "programach".
interface DocIndex {
  title: string[];
  path: string[];
  keywords: string[];
  summary: string[];
  body: string[];
}

const indexCache = new WeakMap<KnowledgeDoc, DocIndex>();

function indexDoc(doc: KnowledgeDoc): DocIndex {
  const cached = indexCache.get(doc);
  if (cached) return cached;
  const index: DocIndex = {
    title: tokenize(doc.title),
    path: tokenize(doc.path.replace(/\.md$/, '')),
    keywords: tokenize(frontmatterList(doc.frontmatter, 'keywords').join(' ')),
    summary: tokenize(String(doc.frontmatter.summary || '')),
    body: [...new Set(tokenize(doc.body))],
  };
  indexCache.set(doc, index);
  return index;
}

// A query term matches a document token only at a word boundary: exact match
// (both sides went through the same stemmer, which already normalizes most
// inflection), or a shared stem-prefix as a fallback for asymmetric stemming
// (query "testow" vs doc token "testowanie"→"test"). The prefix fallback needs
// MIN_PREFIX chars on the SHORTER side — at 4 it collides across words
// ("model" vs "mode", "test" vs "testy"), which is exactly the class of false
// positives that flooded off-topic sessions.
const MIN_PREFIX = 5;
function termMatches(term: string, tokens: string[]): boolean {
  for (const token of tokens) {
    if (token === term) return true;
    if (
      Math.min(term.length, token.length) >= MIN_PREFIX &&
      (token.startsWith(term) || term.startsWith(token))
    ) {
      return true;
    }
  }
  return false;
}

/** Detailed relevance score exposing which fields matched (for confidence checks). */
export function scoreDocDetailed(doc: KnowledgeDoc, terms: string[]): DocScore {
  const index = indexDoc(doc);
  let score = 0;
  let titleHit = false;
  let keywordHit = false;
  let pathHit = false;
  let hitTerms = 0;
  for (const term of terms) {
    let hit = false;
    if (termMatches(term, index.title)) { score += 8; titleHit = true; hit = true; }
    if (termMatches(term, index.keywords)) { score += 6; keywordHit = true; hit = true; }
    if (termMatches(term, index.path)) { score += 5; pathHit = true; hit = true; }
    if (termMatches(term, index.summary)) { score += 4; hit = true; }
    if (termMatches(term, index.body)) { score += 1; hit = true; }
    if (hit) hitTerms += 1;
  }
  return { score, titleHit, keywordHit, pathHit, hitTerms };
}

/** Text relevance score, mirroring the scoring used by search_knowledge. */
export function scoreDoc(doc: KnowledgeDoc, terms: string[]): number {
  return scoreDocDetailed(doc, terms).score;
}

// A confident match is one we trust enough to inject at all: at least two
// DISTINCT query terms must land (one term hitting many fields is a homonym,
// not a topic), plus either a curated-signal hit (title/keywords) or a high
// absolute score. Anything below this bar is noise — the hook stays silent
// rather than spending the user's context on it.
const CONFIDENT_ABS_SCORE = 16;
// Cap how many confident matches get injected per prompt.
const CONFIDENT_LIMIT = 5;

export function isConfidentMatch(s: DocScore): boolean {
  return s.hitTerms >= 2 && (s.titleHit || s.keywordHit || s.score >= CONFIDENT_ABS_SCORE);
}

/** A document is eligible for a stage when trigger_stage is absent or lists it. */
export function eligibleForStage(doc: KnowledgeDoc, stage: Stage): boolean {
  const stages = frontmatterList(doc.frontmatter, 'trigger_stage');
  return stages.length === 0 || stages.includes(stage);
}

/** True when a tool name matches any of the document's trigger_tools (substring). */
export function matchesTool(doc: KnowledgeDoc, toolName: string): boolean {
  const tool = toolName.toLowerCase();
  return frontmatterList(doc.frontmatter, 'trigger_tools').some((trigger) => tool.includes(trigger));
}

export function priorityOf(doc: KnowledgeDoc): number {
  const value = doc.frontmatter.priority;
  return typeof value === 'number' ? value : Number(value) || 0;
}

/** Detect platform hints (google-ads / meta-ads / ...) present in free text. */
export function detectPlatforms(text: string): string[] {
  const t = text.toLowerCase();
  const hits: string[] = [];
  if (/google[\s_-]?ads|gaql|pmax|performance max|merchant|ga4|consent mode|search campaign|keyword|shopping/.test(t)) {
    hits.push('google-ads');
  }
  if (/meta[\s_-]?ads|facebook|instagram|\babo\b|\bcbo\b|advantage\+?|lookalike|\bpixel\b|\bcapi\b|reels|placement|ad set|adset/.test(t)) {
    hits.push('meta-ads');
  }
  return hits;
}

export interface SelectOptions {
  limit?: number;
  exclude?: Set<string>;
  platforms?: string[];
}

export interface ScoredDoc {
  doc: KnowledgeDoc;
  score: number;
  /** True when we trust the match enough to inject the full body, not a pointer. */
  confident: boolean;
}

/**
 * Rank docs against a user prompt, flagging every high-confidence match (up to
 * CONFIDENT_LIMIT) for full-body injection. Matches that clear the confidence
 * bar get their body inlined; weaker matches stay pointers. No dominance rule —
 * several strong matches can all be injected in full.
 */
export function selectForPromptScored(docs: KnowledgeDoc[], query: string, opts: SelectOptions = {}): ScoredDoc[] {
  const { limit = 5, exclude, platforms } = opts;
  const terms = tokenize(query);
  const ranked = docs
    .filter((doc) => eligibleForStage(doc, 'prompt'))
    .filter((doc) => !exclude?.has(doc.path))
    .filter((doc) => platformOk(doc, platforms))
    .map((doc) => ({ doc, s: scoreDocDetailed(doc, terms) }))
    .filter((item) => item.s.score > 0)
    // Relevance dominates; priority is only a tiebreaker for prompt matching.
    .sort((a, b) => b.s.score - a.s.score || priorityOf(b.doc) - priorityOf(a.doc) || a.doc.path.localeCompare(b.doc.path));

  let confidentCount = 0;
  return ranked.slice(0, limit).map((item) => {
    const confident = isConfidentMatch(item.s) && confidentCount < CONFIDENT_LIMIT;
    if (confident) confidentCount += 1;
    return { doc: item.doc, score: item.s.score, confident };
  });
}

/** Select docs relevant to a user prompt, ordered by priority then score. */
export function selectForPrompt(docs: KnowledgeDoc[], query: string, opts: SelectOptions = {}): KnowledgeDoc[] {
  return selectForPromptScored(docs, query, opts).map((item) => item.doc);
}

/** Session-start orientation docs (session_start: true or priority 5) for the given platforms. */
export function selectForSessionStart(docs: KnowledgeDoc[], opts: SelectOptions = {}): KnowledgeDoc[] {
  const { limit = 3, exclude, platforms } = opts;
  return docs
    .filter((doc) => doc.frontmatter.session_start === true || priorityOf(doc) >= 5)
    .filter((doc) => !exclude?.has(doc.path))
    .filter((doc) => platformOk(doc, platforms))
    .sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path))
    .slice(0, limit);
}

/** True when a doc explicitly applies to both platforms (a cross-platform generic). */
function isCrossPlatform(doc: KnowledgeDoc): boolean {
  const applies = frontmatterList(doc.frontmatter, 'applies_to');
  return applies.includes('google-ads') && applies.includes('meta-ads');
}

/**
 * Session-start orientation for the true SessionStart event, when no prompt (and
 * thus no platform) is known yet: inject only cross-platform generic rules. Those
 * notes themselves point to the per-platform cores via read_knowledge, so we never
 * need to guess which platform the session is about.
 */
export function selectSessionStartGeneric(docs: KnowledgeDoc[], opts: SelectOptions = {}): KnowledgeDoc[] {
  const { limit = 2, exclude } = opts;
  return docs
    .filter((doc) => doc.frontmatter.session_start === true || priorityOf(doc) >= 5)
    .filter((doc) => !exclude?.has(doc.path))
    .filter((doc) => isCrossPlatform(doc))
    .sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path))
    .slice(0, limit);
}

/** Select docs wired to a specific tool via trigger_tools, ordered by priority. */
export function selectForTool(docs: KnowledgeDoc[], toolName: string, opts: SelectOptions = {}): KnowledgeDoc[] {
  const { limit = 2, exclude } = opts;
  return docs
    .filter((doc) => eligibleForStage(doc, 'pre_tool'))
    .filter((doc) => !exclude?.has(doc.path))
    .filter((doc) => matchesTool(doc, toolName))
    .sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path))
    .slice(0, limit);
}

/**
 * Docs that MUST be read (via read_knowledge) before mutating the given
 * platform. Driven entirely by frontmatter — `enforce_read: true` on a doc
 * whose `applies_to` covers the platform. The markdown library is the
 * database; no doc paths are hardcoded in the hook.
 */
export function requiredReading(docs: KnowledgeDoc[], platform: string): KnowledgeDoc[] {
  return docs
    .filter((doc) => doc.frontmatter.enforce_read === true)
    .filter((doc) => frontmatterList(doc.frontmatter, 'applies_to').includes(platform))
    .sort((a, b) => priorityOf(b) - priorityOf(a) || a.path.localeCompare(b.path));
}

function platformOk(doc: KnowledgeDoc, platforms?: string[]): boolean {
  if (!platforms || platforms.length === 0) return true;
  const appliesTo = frontmatterList(doc.frontmatter, 'applies_to');
  if (appliesTo.length === 0) return true; // cross-platform / general docs stay eligible
  return appliesTo.some((p) => platforms.includes(p));
}
