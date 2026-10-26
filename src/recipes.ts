import { mkdirSync, writeFileSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import type { MarketingContextConfig } from './config.js';
import { relativeToRoot, resolveInsideRoot, safeSlug } from './storage.js';

// A report recipe is the durable definition of a recurring report: the
// data-fetching tool calls (any MCP server) with date placeholders, plus an
// optional HTML template. marketing-context owns the definition so a team can
// share it through MARKETING_CONTEXT_DIR; report-baby executes it and keeps
// the captured data local. The file format is pinned in
// docs/report-recipe-contract.md.

export type RecipeArgValue = string | number | boolean | null | RecipeArgValue[] | { [key: string]: RecipeArgValue };

export interface RecipeStep {
  id: string;
  tool: string;
  args: { [key: string]: RecipeArgValue };
  page_params?: string[];
  description?: string;
}

export interface Recipe {
  schema_version: 1;
  name: string;
  client_slug: string;
  description?: string;
  steps: RecipeStep[];
  template_html?: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeDraft {
  client_slug: string;
  name: string;
  description?: string;
  steps: RecipeStep[];
  template_html_path?: string;
}

const IDENTIFIER = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const PLACEHOLDER = /\{\{([a-z_]+)\}\}/g;
export const RECIPE_PLACEHOLDERS = [
  'start', 'end', 'start_iso', 'end_iso', 'start_ms', 'end_ms',
  'prev_start', 'prev_end', 'prev_start_iso', 'prev_end_iso', 'prev_start_ms', 'prev_end_ms',
] as const;
export const RECIPE_DATA_MARKER = '<!--RECIPE_DATA-->';
export const RECIPE_CONCLUSIONS_MARKER = '<!--RECIPE_CONCLUSIONS-->';

function recipeDir(clientSlug: string): string {
  return `clients/${safeSlug(clientSlug)}/recipes`;
}

function assertIdentifier(value: string, label: string): void {
  if (!IDENTIFIER.test(value)) throw new Error(`${label} '${value}' must be lowercase letters, digits, '_' or '-' (max 64).`);
}

function placeholdersIn(value: RecipeArgValue): string[] {
  return [...JSON.stringify(value).matchAll(PLACEHOLDER)].map((match) => match[1]);
}

export async function saveRecipe(cfg: MarketingContextConfig, draft: RecipeDraft): Promise<{ recipe: Recipe; path: string; warnings: string[] }> {
  assertIdentifier(draft.name, 'Recipe name');
  if (!draft.steps.length) throw new Error('A recipe needs at least one step.');
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const step of draft.steps) {
    assertIdentifier(step.id, 'Step id');
    if (seen.has(step.id)) throw new Error(`Step id '${step.id}' is used twice.`);
    seen.add(step.id);
    if (!step.tool.trim()) throw new Error(`Step '${step.id}' has no tool name.`);
    const used = placeholdersIn(step.args);
    const unknown = used.filter((name) => !(RECIPE_PLACEHOLDERS as readonly string[]).includes(name));
    if (unknown.length) throw new Error(`Step '${step.id}' uses unknown placeholders: ${unknown.map((name) => `{{${name}}}`).join(', ')}. Allowed: ${RECIPE_PLACEHOLDERS.map((name) => `{{${name}}}`).join(', ')}.`);
    if (!used.length) warnings.push(`Step '${step.id}' has no date placeholder; it fetches the same data for every period.`);
  }

  const dir = recipeDir(draft.client_slug);
  const jsonPath = resolveInsideRoot(cfg, `${dir}/${draft.name}.json`);
  await mkdir(dirname(jsonPath), { recursive: true });
  const existing = await readRecipeFile(jsonPath);

  let templateHtml = existing?.template_html;
  if (draft.template_html_path) {
    if (extname(draft.template_html_path).toLowerCase() !== '.html') throw new Error('template_html_path must point to an .html file.');
    templateHtml = `${draft.name}.template.html`;
    await copyFile(draft.template_html_path, resolveInsideRoot(cfg, `${dir}/${templateHtml}`));
    const template = await readFile(resolveInsideRoot(cfg, `${dir}/${templateHtml}`), 'utf8');
    if (!template.includes(RECIPE_DATA_MARKER)) warnings.push(`The template has no ${RECIPE_DATA_MARKER} marker; captured data will not be injected.`);
  }

  const now = new Date().toISOString();
  const recipe: Recipe = {
    schema_version: 1,
    name: draft.name,
    client_slug: safeSlug(draft.client_slug),
    ...(draft.description ? { description: draft.description } : {}),
    steps: draft.steps,
    ...(templateHtml ? { template_html: templateHtml } : {}),
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  await writeFile(jsonPath, `${JSON.stringify(recipe, null, 2)}\n`, 'utf8');
  return { recipe, path: relativeToRoot(cfg, jsonPath), warnings };
}

async function readRecipeFile(fullPath: string): Promise<Recipe | undefined> {
  try {
    return JSON.parse(await readFile(fullPath, 'utf8')) as Recipe;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

export async function readRecipe(cfg: MarketingContextConfig, clientSlug: string, name: string): Promise<{ recipe: Recipe; path: string }> {
  assertIdentifier(name, 'Recipe name');
  const fullPath = resolveInsideRoot(cfg, `${recipeDir(clientSlug)}/${name}.json`);
  const recipe = await readRecipeFile(fullPath);
  if (!recipe) throw new Error(`Recipe '${clientSlug}/${name}' does not exist. Call list_recipes.`);
  return { recipe, path: relativeToRoot(cfg, fullPath) };
}

export async function listRecipes(cfg: MarketingContextConfig, clientSlug?: string): Promise<Recipe[]> {
  const clientsDir = resolveInsideRoot(cfg, 'clients');
  const clients = clientSlug ? [safeSlug(clientSlug)] : await readdir(clientsDir).catch(() => [] as string[]);
  const recipes: Recipe[] = [];
  for (const client of clients.sort()) {
    const dir = join(clientsDir, client, 'recipes');
    const files = (await readdir(dir).catch(() => [] as string[])).filter((file) => file.endsWith('.json')).sort();
    for (const file of files) {
      const recipe = await readRecipeFile(join(dir, file));
      if (recipe) recipes.push(recipe);
    }
  }
  return recipes;
}

// report-baby cannot ask this server where the context root is (MCP servers
// do not call each other), and without MARKETING_CONTEXT_DIR the root is the
// plugin install. The locator file is the hand-off: one small JSON at a fixed
// per-user path, rewritten on every server start.
export function contextRootLocatorPath(): string {
  return process.env.MARKETING_CONTEXT_LOCATOR || join(homedir(), '.config', 'marketing-context', 'root.json');
}

export function writeContextRootLocator(cfg: MarketingContextConfig): void {
  try {
    const path = contextRootLocatorPath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify({ root_dir: cfg.rootDir, updated_at: new Date().toISOString() })}\n`, 'utf8');
  } catch {
    // A read-only home must not stop the server; report-baby then falls back to MARKETING_CONTEXT_DIR.
  }
}
