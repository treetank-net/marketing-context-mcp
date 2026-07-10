import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketingContextConfig } from '../config.js';
import { appendJsonl, appendMarkdownLog, safeSlug, upsertMarkdownSection } from '../storage.js';

export function registerWriteTools(server: McpServer, cfg: MarketingContextConfig) {
  server.tool(
    'append_decision',
    'Append a concise business or operational decision to a client decision log.',
    {
      client_slug: z.string(),
      entry: z.string(),
      platform: z.string().optional(),
      account_id: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ client_slug, entry, platform, account_id, tags }) => {
      const slug = safeSlug(client_slug);
      const path = await appendMarkdownLog(
        cfg,
        `clients/${slug}/decision-log.md`,
        heading([platform, account_id, tags?.join(', ')]),
        entry,
      );
      return textResult(`Appended decision to ${path}.`);
    },
  );

  server.tool(
    'append_mutation',
    'Append a confirmed platform mutation to a client mutation JSONL log.',
    {
      client_slug: z.string(),
      platform: z.string(),
      account_id: z.string(),
      action: z.string(),
      preview: z.unknown(),
      result: z.unknown(),
      tags: z.array(z.string()).optional(),
    },
    async ({ client_slug, platform, account_id, action, preview, result, tags }) => {
      const slug = safeSlug(client_slug);
      const path = await appendJsonl(cfg, `clients/${slug}/mutation-log.jsonl`, {
        timestamp: new Date().toISOString(),
        platform,
        account_id,
        action,
        preview,
        result,
        tags,
      });
      return textResult(`Appended mutation to ${path}.`);
    },
  );

  server.tool(
    'append_review',
    'Append a client review note or summary to a client review log.',
    {
      client_slug: z.string(),
      platform: z.string(),
      summary: z.string(),
      period: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ client_slug, platform, summary, period, tags }) => {
      const slug = safeSlug(client_slug);
      const path = await appendMarkdownLog(
        cfg,
        `clients/${slug}/review-log.md`,
        heading([platform, period, tags?.join(', ')]),
        summary,
      );
      return textResult(`Appended review to ${path}.`);
    },
  );

  server.tool(
    'upsert_client_profile',
    'Create or replace one section in a client profile.',
    {
      client_slug: z.string(),
      section: z.string(),
      content: z.string(),
    },
    async ({ client_slug, section, content }) => {
      const slug = safeSlug(client_slug);
      const path = await upsertMarkdownSection(cfg, `clients/${slug}/profile.md`, section, content);
      return textResult(`Updated ${section} in ${path}.`);
    },
  );

  server.tool(
    'append_preference',
    'Append a client preference to preferences.md.',
    {
      client_slug: z.string(),
      preference: z.string(),
      platform: z.string().optional(),
      account_id: z.string().optional(),
    },
    async ({ client_slug, preference, platform, account_id }) => {
      const slug = safeSlug(client_slug);
      const path = await appendMarkdownLog(cfg, `clients/${slug}/preferences.md`, heading([platform, account_id]), preference);
      return textResult(`Appended preference to ${path}.`);
    },
  );
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function heading(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' / ') || 'general';
}
