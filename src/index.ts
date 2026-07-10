import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { configFromEnv } from './config.js';
import { registerKnowledgeTools } from './tools/knowledge.js';
import { registerSetupTools } from './tools/setup.js';
import { registerTaskTools } from './tools/tasks.js';
import { registerUpdateTools } from './tools/update.js';
import { registerWriteTools } from './tools/write.js';
import { startEmbedService } from './embed.js';

async function main() {
  const server = new McpServer(
    {
      name: 'marketing-context',
      version: '0.1.0',
    },
    {
      instructions: [
        'Use marketing-context to retrieve durable local marketing knowledge before ads, analytics, reporting, and client-communication work.',
        'Record concise decisions, preferences, reviews, and confirmed mutations when they will matter for future work.',
        'Never write secrets, tokens, private keys, cookies, raw auth headers, or other credentials into marketing context.',
        'The bundled knowledge library is always served from the plugin install; a custom MARKETING_CONTEXT_DIR overlays it with clients/, tasks, and user-authored articles.',
        'When the user sets or changes MARKETING_CONTEXT_DIR, or knowledge looks missing/stale, call get_context_health; if it reports knowledge_mode "unset", ask the user to choose and call update_config.',
      ].join(' '),
    },
  );

  const cfg = await configFromEnv();
  startEmbedService(cfg);
  registerKnowledgeTools(server, cfg);
  registerSetupTools(server, cfg);
  registerWriteTools(server, cfg);
  registerTaskTools(server, cfg);
  registerUpdateTools(server, cfg);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
