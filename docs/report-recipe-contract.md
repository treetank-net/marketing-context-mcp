# Report-Recipe Contract

Pins the file format shared by `marketing-context-mcp` (owner of recipe
definitions) and `report-baby` (executor). MCP servers cannot call each other,
so the hand-off is the filesystem. Sibling of `response-format-contract.md`.

## Location

```
<context root>/clients/<client_slug>/recipes/<name>.json
<context root>/clients/<client_slug>/recipes/<name>.template.html   (optional)
```

`<context root>` is `MARKETING_CONTEXT_DIR` when set. Otherwise it is whatever
root the marketing-context server resolved; the server writes it on every start
to the locator file `~/.config/marketing-context/root.json`
(`{ "root_dir": "...", "updated_at": "..." }`, path overridable with
`MARKETING_CONTEXT_LOCATOR`). Executors resolve `MARKETING_CONTEXT_DIR` first,
then the locator.

A recipe is addressed as `<client_slug>/<name>`. Both parts match
`^[a-z0-9][a-z0-9_-]{0,63}$` (the client part is a `safeSlug`).

## Recipe JSON (`schema_version: 1`)

| Field | Type | Meaning |
|---|---|---|
| `schema_version` | `1` | Bumped on any breaking change. |
| `name`, `client_slug` | string | Identity; match the file location. |
| `description` | string? | Free text. |
| `steps[]` | array, ≥ 1 | Tool calls to capture, in order. |
| `steps[].id` | string | Unique within the recipe; key of the step's records in the run data. |
| `steps[].tool` | string | Tool name as the agent calls it; executors also match it as a `__<tool>` suffix. |
| `steps[].args` | object | Exact arguments. Matching is a subset match: every listed argument must equal the call's, extra call arguments are ignored. |
| `steps[].page_params` | string[]? | Arguments that only select a page; excluded from matching, each distinct value is another page of the step. |
| `steps[].description` | string? | What the step measures. |
| `template_html` | string? | File name of the template, relative to the recipe directory. |
| `created_at`, `updated_at` | ISO timestamp | Maintained by `save_recipe`. |

## Date placeholders

Inside any string in `args`: `{{start}}`, `{{end}}` (`YYYY-MM-DD`),
`{{start_iso}}` (`T00:00:00.000Z`), `{{end_iso}}` (`T23:59:59.999Z`),
`{{start_ms}}`, `{{end_ms}}` (epoch ms of those instants), and the same six
with a `prev_` prefix for the comparison period. Unknown placeholders are
rejected on save.

## Template markers

- `<!--RECIPE_DATA-->` → `<script>window.RECIPE_DATA = {...}</script>` with
  `{ recipe, run_id, period, comparison?, generated_at, steps: { <id>: [flat records] } }`.
- `<!--RECIPE_CONCLUSIONS-->` → the conclusions rendered as HTML.

## Run data stays local

Captured tool results, `data.json` and `report.html` are written by the
executor under its own data directory and never into the context root: they
can hold personal data from CRMs. Only the definition and the conclusions
(via `append_review` with `summary_path`) belong to marketing context.
