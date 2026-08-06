# Changelog

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
