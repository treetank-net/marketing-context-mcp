import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

// How the knowledge library relates to a custom MARKETING_CONTEXT_DIR:
//   'plugin' — bundled articles are served from the plugin install and stay
//              current via update_plugin; the context dir only overlays them.
//   'copy'   — the context dir owns a full copy of the library (seeded once);
//              bundled articles are NOT layered in. The user accepts that the
//              copy only refreshes when they re-seed.
//   'unset'  — a custom context dir exists but the user has not chosen yet.
//              Behaves like 'plugin' so the library is never silently empty;
//              tools surface the pending choice (get_context_health).
export type KnowledgeMode = 'plugin' | 'copy' | 'unset';

// Durable per-context-dir settings stored in .marketing-context.json and
// managed via the update_config tool. The legacy env vars stay authoritative
// as kill-switches: env can only disable a feature (or enable debug), never
// silently re-enable something the config turned off.
export interface ContextSettings {
  auto_update: boolean;
  enforce_required_reading: boolean;
  semantic_ranking: boolean;
  embeddings: boolean;
  debug: boolean;
}

export const SETTING_DEFAULTS: ContextSettings = {
  auto_update: true,
  enforce_required_reading: true,
  semantic_ranking: true,
  embeddings: true,
  debug: false,
};

export interface MarketingContextConfig {
  /** Writable context root: clients/, tasks, user-authored knowledge overlay. */
  rootDir: string;
  /** Bundled knowledge library shipped with the plugin; unset when rootDir IS that directory. */
  bundledDir?: string;
  knowledgeMode: KnowledgeMode;
  settings: ContextSettings;
}

export const CONTEXT_MARKER_FILE = '.marketing-context.json';

function bundledKnowledgeDir(): string | undefined {
  const candidates = [
    process.env.CLAUDE_PLUGIN_ROOT ? join(process.env.CLAUDE_PLUGIN_ROOT, 'knowledge') : undefined,
    process.argv[1] ? join(dirname(resolve(process.argv[1])), 'knowledge') : undefined,
    join(process.cwd(), 'knowledge'),
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return resolve(candidate);
  }
  return undefined;
}

export function readContextMarker(rootDir: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(readFileSync(join(rootDir, CONTEXT_MARKER_FILE), 'utf8')) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function readKnowledgeMode(rootDir: string): KnowledgeMode {
  const mode = readContextMarker(rootDir).knowledge_mode;
  return mode === 'plugin' || mode === 'copy' ? mode : 'unset';
}

function settingsFromMarker(marker: Record<string, unknown>): ContextSettings {
  const settings = { ...SETTING_DEFAULTS };
  for (const key of Object.keys(SETTING_DEFAULTS) as Array<keyof ContextSettings>) {
    if (typeof marker[key] === 'boolean') settings[key] = marker[key] as boolean;
  }
  return settings;
}

/**
 * Effective on/off state of a setting: the stored config value, except the
 * legacy env kill-switches always win in the disabling direction (and
 * MARKETING_CONTEXT_DEBUG=1 in the enabling one).
 */
export function isEnabled(cfg: MarketingContextConfig, key: keyof ContextSettings): boolean {
  switch (key) {
    case 'auto_update':
      if (process.env.MARKETING_CONTEXT_NO_UPDATE === '1') return false;
      break;
    case 'enforce_required_reading':
      if (process.env.MARKETING_CONTEXT_ENFORCE === '0') return false;
      break;
    case 'semantic_ranking':
      if (process.env.MARKETING_CONTEXT_SEMANTIC === '0') return false;
      break;
    case 'embeddings':
      if (process.env.MARKETING_CONTEXT_EMBED === '0') return false;
      break;
    case 'debug':
      if (process.env.MARKETING_CONTEXT_DEBUG) return true;
      break;
  }
  return cfg.settings[key];
}

export function resolveRootsSync(): MarketingContextConfig {
  const bundled = bundledKnowledgeDir();
  const env = process.env.MARKETING_CONTEXT_DIR || process.env.MARKETING_KNOWLEDGE_DIR;
  if (env) {
    const rootDir = resolve(env);
    const bundledDir = bundled && bundled !== rootDir ? bundled : undefined;
    const marker = readContextMarker(rootDir);
    const mode = marker.knowledge_mode === 'plugin' || marker.knowledge_mode === 'copy' ? marker.knowledge_mode : 'unset';
    return {
      rootDir,
      bundledDir,
      knowledgeMode: bundledDir ? mode : 'plugin',
      settings: settingsFromMarker(marker),
    };
  }
  const localKnowledge = resolve(process.cwd(), 'knowledge');
  const rootDir = existsSync(localKnowledge) ? localKnowledge : bundled || localKnowledge;
  return { rootDir, knowledgeMode: 'plugin', settings: settingsFromMarker(readContextMarker(rootDir)) };
}

export async function configFromEnv(): Promise<MarketingContextConfig> {
  const cfg = resolveRootsSync();
  await mkdir(cfg.rootDir, { recursive: true });
  return cfg;
}
