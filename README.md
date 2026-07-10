# Marketing Context MCP

Filesystem-backed MCP server for shared marketing context: client profiles,
decision logs, review notes, mutation logs, and reusable platform knowledge.

## Usage

```json
{
  "mcpServers": {
    "marketing-context": {
      "command": "npx",
      "args": ["@treetank/marketing-context-mcp"],
      "env": {
        "MARKETING_CONTEXT_DIR": "/path/to/shared/marketing-context"
      }
    }
  }
}
```

`MARKETING_KNOWLEDGE_DIR` is still accepted for compatibility. If neither env
var is set, the server uses the bundled `knowledge/` directory directly.

## Knowledge layers

The bundled knowledge library (`knowledge/` in the plugin install) is **always
served from the plugin** and stays current via `update_plugin`. A custom
`MARKETING_CONTEXT_DIR` does not replace it — it overlays it:

- The context dir holds what is yours: `clients/` (profiles, preferences,
  decision/review/mutation logs, tasks) and any knowledge articles you author.
- Bundled articles remain visible underneath; a context file at the same
  relative path overrides the bundled one (intentional local override).
- Setting the env var to a fresh directory therefore never yields an empty
  knowledge base.

On first use with a custom dir the knowledge mode is *unset* — the model is
instructed to ask you and record the choice via `update_config`:

- `knowledge_mode: "plugin"` (recommended): the layered behavior described above.
- `knowledge_mode: "copy"`: seed the full library into the context dir once
  (existing files are never overwritten) and serve everything from there — for
  a team co-editing the library over a synced drive. Shipped-article updates
  then only arrive as NEW articles; edited copies are yours to maintain.

Run `get_context_health` anytime knowledge looks missing or stale — it reports
both layers, the mode, the stored + effective configuration, shadowed
duplicates (with advice which are safe to delete), and what to do next.

## Configuration

Durable settings live in `.marketing-context.json` inside the context dir and
are managed with the `update_config` tool:

| Setting | Default | Meaning |
| --- | --- | --- |
| `knowledge_mode` | *(unset)* | `plugin` (layered, recommended) or `copy` (seeded once) |
| `auto_update` | `true` | self-update the plugin runtime on server start |
| `enforce_required_reading` | `true` | deny ads-platform tools until required articles are read |
| `semantic_ranking` | `true` | embedding-based knowledge matching in the hook |
| `embeddings` | `true` | local embedding service (restart to apply) |
| `debug` | `false` | hook decision log (JSONL under the state dir) |

The legacy env vars remain as kill-switch overrides — they can only disable a
feature (or enable debug), never re-enable one the config turned off:
`MARKETING_CONTEXT_NO_UPDATE=1`, `MARKETING_CONTEXT_ENFORCE=0`,
`MARKETING_CONTEXT_SEMANTIC=0`, `MARKETING_CONTEXT_EMBED=0`,
`MARKETING_CONTEXT_DEBUG=1`.

## Tools

Knowledge & clients:

- `search_knowledge`
- `read_knowledge`
- `list_knowledge`
- `set_current_client`
- `get_client_context`

Setup & diagnostics:

- `get_context_health`
- `update_config`
- `update_plugin`

Writes:

- `append_decision`
- `append_mutation`
- `append_review`
- `upsert_client_profile`
- `append_preference`

Tasks:

- `append_task`
- `list_tasks`
- `list_due_tasks`
- `update_task_status`
- `append_task_note`
- `mark_task_run`
- `list_task_templates`
- `instantiate_task_template`
- `setup_client_tasks`

Writes are constrained to the configured context directory. Decision and review
logs are append-only; mutation logs are JSONL. Common secret patterns are
redacted before writing.

## Licence and knowledge provenance

The project is MIT-licensed; see [LICENSE](LICENSE). Knowledge articles must name
their sources and follow [the provenance policy](docs/knowledge-provenance-policy.md).
Historical third-party attribution is recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Before a release, run:

```sh
PROVENANCE_STRICT=1 npm run audit:provenance
npm run audit:knowledge
```
