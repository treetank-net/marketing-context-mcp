# Changelog

## 0.12.5 — 2026-08-19

### Fixed
- **`scripts/start-mcp.js` no longer updates the plugin code on every start.** Code updates happen only
  through `update_plugin`; the wrapper fetches `bundle.cjs`/`hook.cjs` exactly once, when one of them is
  missing from disk. A stale `raw.githubusercontent.com` cache used to let a start-up fetch overwrite a
  freshly installed newer copy with older files. The `knowledge/` refresh still runs on every start — it
  is content, not code — and `MARKETING_CONTEXT_NO_UPDATE=1` / `auto_update: false` now govern that
  refresh only.
- **`update_plugin` compares versions with semver ordering instead of string equality.** A copy newer than
  the update server is left untouched with an explicit message instead of being silently downgraded; a
  same-version install with a stale stamp is still repaired.
- **Downloads and the install stamp are written atomically** (`<name>.download` + rename), so an
  interrupted update leaves the previous working file instead of a truncated one.
- **`update_plugin` reports the installed version separately from the running one.** `PLUGIN_VERSION` is
  compiled into the bundle, so a download that has not been activated yet says so instead of reading as
  done — a running MCP server cannot swap its own bundle.
- **The MCP server no longer reports version `0.1.0`.** It had been hardcoded since the first release and
  now tracks `PLUGIN_VERSION`.

## 0.12.4 — 2026-08-07

- Semantic ranking now judges the shape of the ranking, not the absolute cosine.
  Measured against the live embedding model on this library, every prompt —
  including "refactor the TypeScript hook code, no account work" — scores
  0.79-0.86 against every article, so the 0.45 injection and 0.60 enforcement
  floors sat below the entire range and admitted the whole library. A match must
  now also stand at least 0.025 above the batch median
  (`MARKETING_CONTEXT_SEMANTIC_MARGIN`): a topical prompt produces a leader that
  clears the pack (~0.03), an off-topic one is flat (~0.01) and injects nothing.
- Fixed the smoke harness running the hook with `spawnSync`, which blocked the
  event loop of the very process hosting the fake `/rank` endpoint. Every
  semantic ranking in the suite timed out, so all semantic assertions were
  passing vacuously. The hook now runs asynchronously and the ranker really
  answers.

## 0.12.3 — 2026-08-06

- Updated the MCP SDK and transitive dependencies to remove current high and
  moderate npm security advisories, then rebuilt the runtime bundle.

## 0.12.2 — 2026-08-06

- Synchronized the Claude, Codex, marketplace, and update-stamp metadata with
  the package version and declared the shared `skills/` plugin path.
- Documented the global `release-compat` gate so releases inspect and confirm
  repository-specific procedures before any external action.

## 0.12.1 — 2026-08-06

- Required-reading gate follows the tool being called instead of the session's
  chatter. Requirements come in two tiers: the platform's `enforce_read`
  baseline (every ads tool) and a topical tier derived from the tool name
  (`prepare_*` only) — `prepare_budget_change` asks for the budget article,
  `prepare_search_campaign_full` for keywords/copywriting. Semantically ranked
  paths now only reorder the topical tier; they can no longer make an unrelated
  article mandatory.
- `confirm_*` carries the platform baseline only. The second phase of an
  operation whose `prepare_*` already passed the gate must not introduce new
  reading between the preview and its execution.
- An article wired to the tool through `trigger_tools` outranks anything matched
  by tool-name relevance, and recurring review workflows (`default_schedule` —
  daily check, weekly feed health, reporting refresh) are never required before
  an operation unless wired explicitly: they are task templates to schedule, not
  preflight reading.
- At most three articles are demanded per call; the rest is deferred to the next
  call, not dropped. A deny only counts towards the open-the-gate cap when the
  previous deny changed nothing — a session that keeps reading is no longer
  pushed towards the warn-through path.
- Injection is platform-scoped everywhere: semantic prompt matches and
  `trigger_tools` pre-tool matches are filtered by the platform in play, and the
  session remembers it, so a Google Ads session stops receiving Meta articles.
- `google-ads/always-never-checklist.md` is marked `enforce_read: true`. Google
  Ads had no deterministic baseline at all — its gate depended on the semantic
  ranker being up; Meta already had one.

## 0.12.0 — 2026-08-06

- `read_knowledge` returns the article as plain markdown instead of a JSON
  envelope with escaped newlines: path header, body, and a short footer with
  `related` and `source`. Router-only frontmatter (summary, keywords,
  applies_to, task_type, priority, inject, trigger_*) is stripped — it cost
  roughly a fifth of every article and duplicated what the hook already
  injects. A title is synthesized only when the body has no H1 of its own.
- `search_knowledge` and `list_knowledge` return compact text lines
  (`path — title` plus the summary) instead of JSON arrays, with an explicit
  message when nothing matches.
- Smoke suite covers the new rendering: markdown out, no metadata leaks, no
  duplicated H1, original casing preserved in `source` URLs.

## Clean-source baseline — 2026-07-10

- Re-established the repository as a single clean-source baseline commit.
- Independently rewrote the legacy marketing knowledge articles from public
  primary sources and repository-native specifications.
- Added a strict provenance gate, a knowledge-graph audit, project licensing,
  third-party notices, and a documented independent-source rewrite policy.
- Preserved product functionality: layered knowledge, client context, durable
  tasks, auto-injection, required-reading enforcement, embeddings, configuration,
  and update tooling.

Older release notes were removed with the superseded Git history. The current
package version remains the compatibility identifier for existing installations;
this file no longer claims a reconstructable release-by-release history.
