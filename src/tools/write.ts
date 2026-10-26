import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketingContextConfig } from '../config.js';
import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { appendJsonl, appendMarkdownLog, safeSlug, upsertMarkdownSection } from '../storage.js';

const MAX_SUMMARY_FILE_BYTES = 64 * 1024;

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
    'Append a review note to a client review log; summary_path reads a local .md (e.g. recipe conclusions) instead of re-sending it.',
    {
      client_slug: z.string(),
      platform: z.string(),
      summary: z.string().optional(),
      summary_path: z.string().optional().describe('Local .md file, max 64 KB'),
      period: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ client_slug, platform, summary, summary_path, period, tags }) => {
      const slug = safeSlug(client_slug);
      const text = await reviewText(summary, summary_path);
      const path = await appendMarkdownLog(
        cfg,
        `clients/${slug}/review-log.md`,
        heading([platform, period, tags?.join(', ')]),
        text,
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

async function reviewText(summary: string | undefined, summaryPath: string | undefined): Promise<string> {
  if ((summary === undefined) === (summaryPath === undefined)) throw new Error('Pass exactly one of summary or summary_path.');
  if (summary !== undefined) return summary;
  const path = summaryPath as string;
  if (extname(path).toLowerCase() !== '.md') throw new Error('summary_path must point to a .md file.');
  const info = await stat(path);
  if (info.size > MAX_SUMMARY_FILE_BYTES) throw new Error(`summary_path is ${info.size} bytes; the limit is ${MAX_SUMMARY_FILE_BYTES}.`);
  return readFile(path, 'utf8');
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function heading(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' / ') || 'general';
}
