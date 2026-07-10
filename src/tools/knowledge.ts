import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketingContextConfig } from '../config.js';
import { collectClientContext, listKnowledgeFiles, readKnowledgeFile, safeSlug } from '../storage.js';
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

      return textResult(
        JSON.stringify(
          filtered.map(({ doc, score }) => ({
            path: doc.path,
            title: doc.title,
            score,
            summary: doc.frontmatter.summary,
            keywords: doc.frontmatter.keywords,
            applies_to: doc.frontmatter.applies_to,
            task_type: doc.frontmatter.task_type,
            risk_level: doc.frontmatter.risk_level,
          })),
          null,
          2,
        ),
      );
    },
  );

  server.tool(
    'read_knowledge',
    'Read a markdown knowledge file by path relative to MARKETING_CONTEXT_DIR.',
    {
      path: z.string().describe('Relative markdown path, e.g. google-ads/always-never-checklist.md.'),
    },
    async ({ path }) => {
      const doc = await readKnowledgeFile(cfg, path);
      return textResult(JSON.stringify(doc, null, 2));
    },
  );

  server.tool(
    'list_knowledge',
    'List local marketing knowledge files with optional frontmatter filters.',
    {
      applies_to: z.string().optional(),
      task_type: z.string().optional(),
    },
    async ({ applies_to, task_type }) => {
      const docs = (await listKnowledgeFiles(cfg))
        .filter((doc) => matchesFrontmatter(doc.frontmatter, 'applies_to', applies_to))
        .filter((doc) => matchesFrontmatter(doc.frontmatter, 'task_type', task_type))
        .map((doc) => ({
          path: doc.path,
          title: doc.title,
          summary: doc.frontmatter.summary,
          keywords: doc.frontmatter.keywords,
          applies_to: doc.frontmatter.applies_to,
          task_type: doc.frontmatter.task_type,
        }));
      return textResult(JSON.stringify(docs, null, 2));
    },
  );

  server.tool(
    'set_current_client',
    'Declare which client this session works on and load their FULL stored context (profile, preferences, decision/review logs, procedures) in one call. ' +
      'With exactly one stored client, call without arguments — it is selected automatically. ' +
      'With several stored clients you MUST first ask the user which client this session concerns (do not guess), then call again with client_slug. ' +
      'Calling this tool also satisfies the marketing-context required-reading gate for client context.',
    {
      client_slug: z.string().optional().describe('Client slug under clients/. Omit only when a single client is stored (auto-select) or to list available clients.'),
    },
    async ({ client_slug }) => {
      const result = await collectClientContext(cfg, client_slug);
      return textResult(JSON.stringify(result, null, 2));
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
      return textResult(JSON.stringify(docs, null, 2));
    },
  );
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
