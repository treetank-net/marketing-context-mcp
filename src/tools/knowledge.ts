import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketingContextConfig } from '../config.js';
import { collectClientContext, listKnowledgeFiles, readKnowledgeFile, safeSlug, type ClientContextResult, type KnowledgeDoc } from '../storage.js';
import { matchesFrontmatter, scoreDoc, tokenize } from '../retrieval.js';

export function registerKnowledgeTools(server: McpServer, cfg: MarketingContextConfig) {
  server.tool(
    'search_knowledge',
    'Search local marketing knowledge markdown by text and optional frontmatter filters.',
    {
      query: z.string().describe('Search query. Matches title, path, summary, keywords, and body.'),
      applies_to: z.string().optional().describe('Optional platform/domain filter, e.g. google-ads, meta-ads, reporting.'),
      task_type: z.string().optional().describe('Optional task type filter, e.g. diagnosis, review, mutation.'),
      risk_level: z.string().optional().describe('Optional risk level filter from frontmatter.'),
      limit: z.number().optional().default(10).describe('Maximum number of results, default 10, max 50.'),
    },
    async ({ query, applies_to, task_type, risk_level, limit }) => {
      const docs = await listKnowledgeFiles(cfg);
      const terms = tokenize(query);
      const filtered = docs
        .filter((doc) => matchesFrontmatter(doc.frontmatter, 'applies_to', applies_to))
        .filter((doc) => matchesFrontmatter(doc.frontmatter, 'task_type', task_type))
        .filter((doc) => matchesFrontmatter(doc.frontmatter, 'risk_level', risk_level))
        .map((doc) => ({ doc, score: scoreDoc(doc, terms) }))
        .filter((item) => item.score > 0 || terms.length === 0)
        .sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path))
        .slice(0, Math.min(limit ?? 10, 50));

      return textResult(renderKnowledgeIndex(filtered.map(({ doc }) => doc), 'No knowledge article matches this query.'));
    },
  );

  server.tool(
    'read_knowledge',
    'Read a markdown knowledge file by path relative to MARKETING_CONTEXT_DIR. Returns the article as plain markdown.',
    {
      path: z.string().describe('Relative markdown path, e.g. google-ads/always-never-checklist.md.'),
    },
    async ({ path }) => {
      const doc = await readKnowledgeFile(cfg, path);
      return textResult(renderKnowledgeArticle(doc));
    },
  );

  server.tool(
    'list_knowledge',
    'List knowledge article paths and titles, optionally filtered; search_knowledge adds summaries.',
    {
      applies_to: z.string().optional(),
      task_type: z.string().optional(),
    },
    async ({ applies_to, task_type }) => {
      const docs = (await listKnowledgeFiles(cfg))
        .filter((doc) => matchesFrontmatter(doc.frontmatter, 'applies_to', applies_to))
        .filter((doc) => matchesFrontmatter(doc.frontmatter, 'task_type', task_type));
      if (docs.length === 0) return textResult('No knowledge articles stored.');
      return textResult(docs.map((doc) => `${doc.path} — ${doc.title}`).join('\n'));
    },
  );

  server.tool(
    'set_current_client',
    'Select this session\'s client and load their stored context. No args with one client; with several, ask the user which one, then pass client_slug. Satisfies the client-context reading gate.',
    {
      client_slug: z.string().optional().describe('Client slug under clients/. Omit to auto-select the only client or to list clients.'),
    },
    async ({ client_slug }) => {
      const result = await collectClientContext(cfg, client_slug);
      return textResult(renderClientContext(result, RECENT_LOG_ENTRIES));
    },
  );

  server.tool(
    'get_client_context',
    'Read available client context files for a client slug.',
    {
      client_slug: z.string().describe('Client slug under clients/.'),
      platform: z.string().optional().describe('Optional platform to include platform-specific procedures if present.'),
    },
    async ({ client_slug, platform }) => {
      const slug = safeSlug(client_slug);
      const paths = [
        `clients/${slug}/profile.md`,
        `clients/${slug}/preferences.md`,
        `clients/${slug}/decision-log.md`,
        `clients/${slug}/review-log.md`,
        `clients/${slug}/procedures/daily.md`,
        `clients/${slug}/procedures/monthly.md`,
        ...(platform ? [`clients/${slug}/procedures/${safeSlug(platform)}.md`] : []),
      ];
      const docs = [];
      for (const path of paths) {
        try {
          docs.push(await readKnowledgeFile(cfg, path));
        } catch {
          // Missing optional client files are expected.
        }
      }
      if (docs.length === 0) return textResult(`No context files stored for client "${slug}".`);
      return textResult([`# Client: ${slug}`, ...docs.map((doc) => `## ${doc.path}\n${doc.body.trim()}`)].join('\n\n'));
    },
  );
}

const RECENT_LOG_ENTRIES = 5;
const LOG_ENTRY_RE = /^## \d{4}-\d{2}-\d{2}/m;

export function tailLogEntries(content: string, keep: number): { text: string; omitted: number } {
  const starts: number[] = [];
  const re = new RegExp(LOG_ENTRY_RE.source, 'gm');
  for (let match = re.exec(content); match; match = re.exec(content)) starts.push(match.index);
  if (starts.length <= keep) return { text: content.trim(), omitted: 0 };
  const head = content.slice(0, starts[0]).trim();
  const tail = content.slice(starts[starts.length - keep]).trim();
  return { text: [head, tail].filter(Boolean).join('\n\n'), omitted: starts.length - keep };
}

export function renderClientContext(result: ClientContextResult, recentEntries: number): string {
  if (result.status === 'no_clients') return result.message;
  if (result.status === 'ambiguous') return `${result.message}\nClients: ${result.clients.join(', ')}`;
  if (result.status === 'unknown_client') return `${result.message} Requested: ${result.requested}. Clients: ${result.clients.join(', ')}`;
  const sections = result.files.map((file) => {
    const { text, omitted } = tailLogEntries(file.content, recentEntries);
    const note = omitted ? `\n(${omitted} older entries omitted; get_client_context returns the full log)` : '';
    return `## ${file.path}${note}\n${text}`;
  });
  return [`# Current client: ${result.current_client}`, ...sections].join('\n\n');
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

/**
 * Frontmatter values with their original case preserved — URLs and § refs in
 * `source` must not be lowercased the way retrieval's frontmatterList does.
 */
function frontmatterValues(frontmatter: KnowledgeDoc['frontmatter'], key: string): string[] {
  const value = frontmatter[key];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  const single = String(value).trim();
  return single ? [single] : [];
}

/**
 * Render an article as plain markdown, not JSON. Everything the reader needs is
 * the body; the rest of the frontmatter (summary, keywords, applies_to,
 * task_type, intent, priority, inject, trigger_*) is retrieval-router metadata
 * that costs ~22% of the article and tells a reader nothing — and `summary` is
 * a verbatim repeat of what the hook already injected. Only `related` and
 * `source` survive, as a short footer, because they are how a reader navigates
 * on from here.
 */
export function renderKnowledgeArticle(doc: KnowledgeDoc): string {
  const body = doc.body.trim();
  // Nearly every article opens with its own H1; only synthesize one when it does not.
  const heading = /^#\s+\S/.test(body) ? '' : `# ${doc.title}\n\n`;
  const footer = ([
    { label: 'Related', values: frontmatterValues(doc.frontmatter, 'related') },
    { label: 'Sources', values: frontmatterValues(doc.frontmatter, 'source') },
  ])
    .filter((line) => line.values.length > 0)
    .map((line) => `${line.label}: ${line.values.join(', ')}`);

  return [`Path: ${doc.path}`, '', `${heading}${body}`, ...(footer.length ? ['', '---', ...footer] : [])].join('\n');
}

/** Compact index lines for search/list results: path, title, summary — nothing the router needs but a reader does not. */
function renderKnowledgeIndex(docs: KnowledgeDoc[], emptyMessage: string): string {
  if (docs.length === 0) return emptyMessage;
  return docs
    .map((doc) => {
      const summary = String(doc.frontmatter.summary || '').trim();
      return `${doc.path} — ${doc.title}${summary ? `\n  ${summary}` : ''}`;
    })
    .join('\n');
}
