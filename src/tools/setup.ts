import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isEnabled, SETTING_DEFAULTS, type ContextSettings, type MarketingContextConfig } from '../config.js';
import {
  copyBundledKnowledge,
  detectShadowedKnowledge,
  knowledgeLayers,
  listClientNotes,
  listDueTasks,
  listKnowledgeFiles,
  updateContextSettings,
  type ContextSettingsPatch,
} from '../storage.js';

function pluginVersion(): string {
  try {
    const root = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
    return (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: string }).version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function effectiveSettings(cfg: MarketingContextConfig) {
  const effective: Record<string, boolean> = {};
  const envOverrides: string[] = [];
  for (const key of Object.keys(SETTING_DEFAULTS) as Array<keyof ContextSettings>) {
    effective[key] = isEnabled(cfg, key);
    if (effective[key] !== cfg.settings[key]) envOverrides.push(key);
  }
  return { effective, envOverrides };
}

export function registerSetupTools(server: McpServer, cfg: MarketingContextConfig) {
  server.tool(
    'get_context_health',
    'Diagnose this marketing-context installation: version, context/bundled knowledge directories, knowledge mode, ' +
      'stored + effective configuration, per-layer article counts, shadowed duplicates, and concrete advice. ' +
      'Call this when knowledge seems missing or stale, after changing MARKETING_CONTEXT_DIR, or when the user reports the plugin misbehaving.',
    {},
    async () => {
      const [docs, shadowed, notes, dueTasks] = await Promise.all([
        listKnowledgeFiles(cfg),
        detectShadowedKnowledge(cfg),
        listClientNotes(cfg).catch(() => []),
        listDueTasks(cfg).catch(() => []),
      ]);
      const advice: string[] = [];
      if (cfg.bundledDir && cfg.knowledgeMode === 'unset') {
        advice.push(
          'Knowledge mode is not chosen yet for this custom MARKETING_CONTEXT_DIR. Ask the user whether the bundled knowledge library should be ' +
            'served from the plugin with the context dir as an overlay (recommended: update_config knowledge_mode "plugin" — stays current via update_plugin), ' +
            'or copied into the context dir as their own editable base (update_config knowledge_mode "copy" — refreshes only when re-seeded). ' +
            'Until chosen, the server behaves like "plugin" mode.',
        );
      }
      const staleDuplicates = shadowed.filter((s) => s.identical);
      const overrides = shadowed.filter((s) => !s.identical);
      if (staleDuplicates.length > 0 && cfg.knowledgeMode !== 'copy') {
        advice.push(
          `${staleDuplicates.length} context file(s) are byte-identical duplicates of bundled articles (likely a stale copy made by an older version). ` +
            `Safe to delete from the context dir: ${staleDuplicates.map((s) => s.path).join(', ')}`,
        );
      }
      if (overrides.length > 0 && cfg.knowledgeMode !== 'copy') {
        advice.push(
          `${overrides.length} context file(s) shadow bundled articles with DIFFERENT content. If these are intentional local overrides, keep them; ` +
            `if they are stale copies from an older version, delete them to get the current bundled articles: ${overrides.map((s) => s.path).join(', ')}`,
        );
      }
      if (cfg.bundledDir && cfg.knowledgeMode === 'copy') {
        advice.push(
          'Copy mode: the context dir owns the knowledge library. update_plugin refreshes the bundled library and seeds NEW articles into the context dir, ' +
            'but never overwrites existing copies — shipped-article updates require deleting the local copy or switching to update_config knowledge_mode "plugin".',
        );
      }
      const { effective, envOverrides } = effectiveSettings(cfg);
      if (envOverrides.length > 0) {
        advice.push(
          `Environment kill-switches currently override the stored config for: ${envOverrides.join(', ')}. ` +
            'Remove the env var(s) to hand control back to update_config.',
        );
      }
      const report = {
        version: pluginVersion(),
        context_dir: cfg.rootDir,
        bundled_dir: cfg.bundledDir || null,
        knowledge_mode: cfg.bundledDir ? cfg.knowledgeMode : 'single-root',
        knowledge_layers: knowledgeLayers(cfg),
        config: { stored: cfg.settings, effective },
        knowledge: {
          active_docs: docs.length,
          shadowed: shadowed,
        },
        clients: [...new Set(notes.map((n) => n.slug))],
        due_tasks: dueTasks.length,
        advice,
      };
      return textResult(JSON.stringify(report, null, 2));
    },
  );

  server.tool(
    'update_config',
    'Update durable marketing-context configuration, stored in .marketing-context.json inside the context dir. ' +
      'knowledge_mode decides how the bundled knowledge library relates to a custom MARKETING_CONTEXT_DIR: ' +
      '"plugin" (recommended) serves bundled articles from the plugin install with the context dir as overlay; ' +
      '"copy" seeds the library into the context dir once (existing files never overwritten) and serves it from there. ' +
      'Ask the user before changing knowledge_mode — it is their durable choice. ' +
      'Boolean flags: auto_update (self-update on server start), enforce_required_reading (deny ads tools until required articles are read), ' +
      'semantic_ranking (embedding-based hook matching), embeddings (local embedding service), debug (hook decision log). ' +
      'Legacy env vars (MARKETING_CONTEXT_NO_UPDATE, _ENFORCE, _SEMANTIC, _EMBED, _DEBUG) still act as kill-switch overrides.',
    {
      knowledge_mode: z.enum(['plugin', 'copy']).optional().describe('How the bundled knowledge library is served; see tool description.'),
      auto_update: z.boolean().optional().describe('Self-update the plugin runtime on server start (default true).'),
      enforce_required_reading: z.boolean().optional().describe('Required-reading gate on ads-platform tools (default true).'),
      semantic_ranking: z.boolean().optional().describe('Semantic (embedding) knowledge matching in the hook (default true).'),
      embeddings: z.boolean().optional().describe('Local embedding service on the MCP server (default true; restart to apply).'),
      debug: z.boolean().optional().describe('Hook decision debug log (default false).'),
    },
    async (patch) => {
      const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
      if (entries.length === 0) {
        return textResult(JSON.stringify({ status: 'noop', message: 'Pass at least one setting to change.' }, null, 2));
      }

      const applied: ContextSettingsPatch = Object.fromEntries(entries) as ContextSettingsPatch;
      const notes: string[] = [];
      let seed: { copied: number; skipped: number } | undefined;

      if (applied.knowledge_mode && !cfg.bundledDir) {
        notes.push('knowledge_mode skipped: the context dir already IS the knowledge library (no separate bundled layer detected).');
        delete applied.knowledge_mode;
      }
      if (applied.knowledge_mode === 'copy') {
        const result = await copyBundledKnowledge(cfg);
        seed = { copied: result.copied.length, skipped: result.skipped.length };
        notes.push(`Bundled library seeded into the context dir: ${seed.copied} copied, ${seed.skipped} existing left untouched.`);
      }
      if (applied.knowledge_mode === 'plugin') {
        const staleDuplicates = (await detectShadowedKnowledge(cfg)).filter((s) => s.identical).map((s) => s.path);
        if (staleDuplicates.length > 0) {
          notes.push(`Redundant duplicates safe to delete from the context dir: ${staleDuplicates.join(', ')}`);
        }
      }
      if (Object.keys(applied).length === 0) {
        return textResult(JSON.stringify({ status: 'noop', notes }, null, 2));
      }

      await updateContextSettings(cfg, applied, applied.knowledge_mode === 'copy' ? { seeded_version: pluginVersion() } : {});
      if ('embeddings' in applied || 'auto_update' in applied) {
        notes.push('embeddings/auto_update take effect on the next server start.');
      }
      const { effective, envOverrides } = effectiveSettings(cfg);
      if (envOverrides.length > 0) {
        notes.push(`Env kill-switches still override: ${envOverrides.join(', ')}.`);
      }
      return textResult(
        JSON.stringify({
          status: 'ok',
          applied,
          ...(seed ? { seed } : {}),
          knowledge_mode: cfg.bundledDir ? cfg.knowledgeMode : 'single-root',
          config: { stored: cfg.settings, effective },
          notes,
        }, null, 2),
      );
    },
  );
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
