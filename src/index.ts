import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { configFromEnv } from './config.js';
import { registerKnowledgeTools } from './tools/knowledge.js';
import { registerSetupTools } from './tools/setup.js';
import { registerTaskTools } from './tools/tasks.js';
import { registerUpdateTools } from './tools/update.js';
import { registerWriteTools } from './tools/write.js';
import { registerRecipeTools } from './tools/recipes.js';
import { writeContextRootLocator } from './recipes.js';
import { compactToolListing } from './compact-listing.js';
import { startEmbedService } from './embed.js';
import { PLUGIN_VERSION } from './version.js';

async function main() {
  const server = new McpServer(
    {
      name: 'marketing-context',
      version: PLUGIN_VERSION,
    },
    {
      instructions: [
        'Use marketing-context to retrieve durable local marketing knowledge before ads, analytics, reporting, and client-communication work.',
        'Record concise decisions, preferences, reviews, and confirmed mutations when they will matter for future work.',
        'Never write secrets, tokens, private keys, cookies, raw auth headers, or other credentials into marketing context.',
        'The bundled knowledge library is always served from the plugin install; a custom MARKETING_CONTEXT_DIR overlays it with clients/, tasks, and user-authored articles.',
        'Recurring reports are recipes (save_recipe/list_recipes) executed by report-baby (skills /recipe-setup, /recipe-run); a recurring task with a recipe field is the schedule. After the run, append_review with summary_path pointing at the conclusions file report-baby wrote, then mark_task_run.',
        'When the user sets or changes MARKETING_CONTEXT_DIR, or knowledge looks missing/stale, call get_context_health; if it reports knowledge_mode "unset", ask the user to choose and call update_config.',
      ].join(' '),
    },
  );

  const cfg = await configFromEnv();
  startEmbedService(cfg);
  writeContextRootLocator(cfg);
  registerKnowledgeTools(server, cfg);
  registerSetupTools(server, cfg);
  registerWriteTools(server, cfg);
  registerTaskTools(server, cfg);
  registerRecipeTools(server, cfg);
  registerUpdateTools(server, cfg);
  compactToolListing(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
