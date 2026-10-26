import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketingContextConfig } from '../config.js';
import { listRecipes, readRecipe, saveRecipe, type RecipeStep } from '../recipes.js';

const stepSchema = z.object({
  id: z.string().describe('Lowercase id'),
  tool: z.string().describe('Tool name; a "__" suffix like execute_gaql matches'),
  args: z.record(z.unknown()).describe('Exact args; dates as {{start}} {{end}} (+_iso/_ms, prev_* = comparison). No chatInsights'),
  page_params: z.array(z.string()).optional().describe('Paging args, e.g. offset'),
  description: z.string().optional(),
});

export function registerRecipeTools(server: McpServer, cfg: MarketingContextConfig) {
  server.tool(
    'save_recipe',
    'Save/replace a report recipe: data tool calls with date placeholders + HTML template. Run: report-baby start_recipe_run "<client>/<name>".',
    {
      client_slug: z.string(),
      name: z.string().describe('Lowercase, e.g. test_lp'),
      description: z.string().optional(),
      steps: z.array(stepSchema).min(1),
      template_html_path: z.string().optional().describe('Local .html template; omit to keep'),
    },
    async ({ client_slug, name, description, steps, template_html_path }) => {
      const saved = await saveRecipe(cfg, { client_slug, name, description, steps: steps as RecipeStep[], template_html_path });
      const warnings = saved.warnings.length ? `\nWarnings:\n${saved.warnings.map((warning) => `- ${warning}`).join('\n')}` : '';
      return textResult(`Saved recipe ${saved.recipe.client_slug}/${saved.recipe.name} (${saved.recipe.steps.length} steps${saved.recipe.template_html ? ', with template' : ''}) to ${saved.path}.${warnings}`);
    },
  );

  server.tool(
    'list_recipes',
    'List report recipes; with client_slug + name, return that recipe as JSON for editing.',
    {
      client_slug: z.string().optional(),
      name: z.string().optional(),
    },
    async ({ client_slug, name }) => {
      if (name) {
        if (!client_slug) throw new Error('name needs client_slug.');
        const { recipe, path } = await readRecipe(cfg, client_slug, name);
        return textResult(`# ${path}\n${JSON.stringify(recipe)}`);
      }
      const recipes = await listRecipes(cfg, client_slug);
      if (!recipes.length) return textResult('No recipes saved.');
      return textResult(recipes.map((recipe) => `- ${recipe.client_slug}/${recipe.name}: ${recipe.steps.map((step) => step.id).join(', ')}${recipe.template_html ? ' · template' : ''}${recipe.description ? ` — ${recipe.description}` : ''}`).join('\n'));
    },
  );
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
