# Operational Roadmap - reviews, tasks, and optimization loops

Goal: complete the operational layer around `marketing-context`,
`google-ads-baby`, `meta-ads-baby`, `google-analytics-baby`, and `report-baby`.
The system should not only store knowledge and expose tools, but regularly turn
data into decisions, tasks, mutations, and follow-ups.

## Diagnosis

We have solid foundations:

- a knowledge library and auto-inject,
- client memory: profiles, preferences, decisions, review logs, mutation logs,
- safe mutations in Google Ads and Meta Ads,
- read-only GA4 with channel-level ROAS,
- reporting as a separate rendering engine.

What is missing is the layer that turns those pieces into a repeatable specialist
workflow:

- daily and monthly account reviews,
- detection of alerts and scaling candidates,
- conversion of insights into priorities,
- reminders to the agent: "you now need to do X" with the right knowledge and
  tools,
- logging outcomes and client decisions.

Other Google Ads systems may productize those pieces more tightly. Our direction
should be more platform-neutral: task/review as the orchestration layer, with
platform plugins acting as executors.

## Task Model

A task should not be a heavy PM system. In this ecosystem, a task is a
**durable operational intent** that lets the agent inject context at the right
moment and run the right skill/workflow.

Example task:

```yaml
id: task_2026_07_07_001
client_slug: example-client
platform: google-ads
account_id: "1234567890"
title: "Review budget-limited campaigns and propose scaling"
status: open
priority: high
due: 2026-07-10
intent: optimize_budget
source:
  type: review
  ref: "monthly-review 2026-07"
context:
  campaign_ids: ["111", "222"]
  reason: "ROAS above target and search_lost_is_budget > 15%"
suggested_workflow: google_ads_budget_scaling_review
knowledge:
  - google-ads/budget-scaling-seasonality.md
  - google-ads/bidding-strategies.md
```

The important part: a task does not need to know every step. It should describe
**what needs to be achieved**, why it exists, where to find context, and which
workflow should run.

## Task Injection

Preferred model:

1. `PostToolUse` or a review workflow detects an important insight.
2. The agent proposes or records a task through `append_task`.
3. On the next prompt, session start, or "what should I do" request, the
   hook/task retriever injects active tasks:
   - the most urgent ones,
   - tasks matching the client/platform,
   - tasks matching the current tool or prompt intent.
4. The task injection tells the agent:
   - what needs to be done,
   - what the business context is,
   - which knowledge docs to read,
   - which workflow/skill to use,
   - where to record the result.

So the task is not a separate "task app". It is work routing:

> You need to do X. Before you start, read A and B. Use workflow C.
> After the result, record review/decision/mutation and close or defer the task.

## Minimal Tool Set

P0 should stay small:

- `append_task(client_slug, title, platform?, account_id?, priority?, due?, intent?, context?, suggested_workflow?, knowledge?, source?)`
- `list_tasks(client_slug?, platform?, status?, due_before?, priority?)`
- `update_task_status(task_id, status, note?)`
- `append_task_note(task_id, note)`

Storage:

```text
task-templates/
  google-ads-weekly-check.md
  google-ads-monthly-review.md
  meta-ads-creative-review.md
clients/<client-slug>/tasks/
  2026-07-07-scale-brand-budget.md
  2026-07-09-review-pmax-leakage.md
clients/<client-slug>/checklists/
  weekly.md
  monthly.md
```

A task is a normal Markdown file with frontmatter. This is more natural than
append-only JSONL because a task is a living operational note: its status,
priority, due date, context, and result change over time.

Task templates are ordinary articles/notes in the knowledgebase. Project setup
should let the user choose which routines should be enabled for a client, then
materialize them as files under `clients/<slug>/tasks/`.

Example:

```md
---
type: task
status: open
priority: high
client_slug: example-client
platform: google-ads
account_id: "1234567890"
intent: optimize_budget
due: 2026-07-10
suggested_workflow: google_ads_budget_scaling_review
knowledge:
  - google-ads/budget-scaling-seasonality.md
  - google-ads/bidding-strategies.md
source_type: monthly_review
source_ref: 2026-07
---

# Review scaling for Search - Brand

Reason: the campaign has ROAS above target and loses 22% impression share due to
budget.

Context:
- campaign_id: `111`
- current budget: 100 PLN/day
- initial candidate: +20%
```

Append-only remains required only where it has real audit value:
`decision-log.md`, `review-log.md`, and `mutation-log.jsonl`. Tasks and client
profiles should be editable.

Tasks are part of the same knowledgebase/contextbase, only in the client space.
Global knowledge articles explain **how to run a workflow**. Client tasks explain
**what exactly needs to be done and for whom**.

## Recurring Tasks

A task can be one-off or recurring. Recurrence is frontmatter, not a separate
system. Initially we do not need a cron daemon; it is enough for the hook or the
"what is due" workflow to calculate `next_due` and inject the task when it is
active.

Example recurring task:

```md
---
type: task
status: active
recurring: true
schedule: "0 9 * * MON"
timezone: Europe/Warsaw
last_run: 2026-07-06T09:14:00+02:00
next_due: 2026-07-13T09:00:00+02:00
priority: normal
client_slug: example-client
platform: google-ads
account_id: "1234567890"
intent: weekly_google_ads_check
suggested_workflow: google_ads_daily_check
knowledge:
  - google-ads/account-hygiene-diagnostics.md
  - google-ads/budget-scaling-seasonality.md
---

# Weekly Google Ads Review

Check tracking, zero spend, weekly drops, PMax leakage, and scaling candidates.
After completion, record `append_review`, add concrete follow-up tasks, and set
`last_run` and `next_due`.
```

Semantics:

- `status: active` means the recurring task is enabled.
- `status: paused` means the recurring task is suspended.
- `status: done` mostly makes sense for one-off tasks.
- `schedule` can be a cron expression or a simpler alias (`weekly`, `monthly`,
  `quarterly`) if we do not want to implement a full cron parser immediately.
- `last_run` stores actual completion, not injection.
- `next_due` is a cache recalculated after a `schedule` change or after a run.
- If `next_due <= now`, the task is due and should be included in injection.

At the tool level, this is enough:

- `list_due_tasks(client_slug?, platform?, now?)`
- `mark_task_run(task_path, result_summary?, next_due?)`

`mark_task_run` updates frontmatter (`last_run`, `next_due`) and may append a short
"Last run" section to the task body, but the detailed result should go to
`review-log.md`.

## Project Setup And Templates

Client/project setup should create the operational baseline:

1. Load available templates from `task-templates/` or `knowledge/*/workflows/`.
2. Ask which routines to enable:
   - weekly Google Ads check,
   - monthly client review,
   - PMax leakage review,
   - Meta creative fatigue review,
   - GA4 channel ROAS review.
3. For each selected routine, create a task Markdown file in
   `clients/<slug>/tasks/`.
4. Fill frontmatter: `client_slug`, `platform`, `account_id`, `schedule`,
   `timezone`, `suggested_workflow`, `knowledge`.
5. Set the first `next_due`.

Example tools:

- `list_task_templates(platform?, intent?)`
- `instantiate_task_template(template_path, client_slug, vars)`
- `setup_client_tasks(client_slug, selected_templates, defaults)`

A template is global and versioned with the knowledgebase. A client task is its
concrete instance, editable for the realities of the account.

## Runner And Scheduler

There are two scheduling levels:

1. **Inside the knowledgebase:** `schedule`, `last_run`, `next_due` in the task.
2. **System tick:** an external scheduler periodically starts an agent with a
   prompt like "check due tasks and run safe read-only workflows; only prepare
   mutations for confirmation".

On Linux/macOS, the tick can be a regular cron job or a systemd timer. On Windows,
the cron equivalent is **Task Scheduler** (`schtasks`). In WSL, cron/systemd timers
can be used if available, but native Windows should generate Task Scheduler jobs.

The runner should not treat interactive UI automation as its only foundation. The
local prototype `/home/jm/ai/run-test.sh` uses a pseudo-TTY and types text into
`claude`/`codex`, which is brittle: Codex does not start correctly, and Claude can
get stuck on limits or interactive screens.

Non-interactive modes are technically best, but they may have separate
subscription/cost/auth requirements. Treat them as a **nice-to-have adapter**, not
as a required default:

- Claude: `claude -p "..." --output-format json/text`
- Codex: `CODEX_HOME=... codex exec "..." --cd <workspace>`

The base model should work without them: recurring tasks are injected during a
normal user session, while the scheduler is an optional way to run selected
read-only passes.

Runner requirements:

- lockfile to prevent two runs at once,
- process timeout,
- separate log per run,
- cost/budget limit if supported by the CLI,
- read-only by default,
- no automatic mutation confirmation,
- final report recorded in `review-log.md`,
- `mark_task_run` only after the workflow actually ran.

Proposed structure:

```text
scripts/
  ai-runner.js
  install-scheduler.js
```

`ai-runner.js`:

- loads `marketing-context`,
- fetches `list_due_tasks`,
- builds a prompt with the due task list,
- starts the selected agent if a configured non-interactive adapter is available,
- records stdout/stderr and exit code,
- does not perform mutations without separate approval.

If no adapter is configured, `ai-runner.js` may only generate a "today due tasks"
file/prompt for manual use in Claude/Codex.

`install-scheduler.js`:

- Linux/macOS: generates a crontab entry or systemd timer.
- Windows: generates `schtasks` commands.
- WSL: optionally treats the environment like Linux if systemd/cron works.

## Workflows Do The Work, Not Tasks

A task points to a workflow. The workflow is where the logic lives.

Proposed P0/P1 workflows:

| Workflow | Platform | What it does |
|---|---|---|
| `google_ads_daily_check` | Google Ads | Alerts: tracking, zero spend, cost/conversion drops, PMax leakage. |
| `google_ads_budget_scaling_review` | Google Ads | Scaling candidates, budget formulas, learning phase risk. |
| `google_ads_search_terms_waste_review` | Google Ads | Search terms with cost and no conversions, negative keyword candidates, mutation previews. |
| `google_ads_pmax_channel_review` | Google Ads | Shopping/Search/Display/YouTube split, engaged-view, leakage. |
| `meta_ads_creative_fatigue_review` | Meta Ads | CTR/CVR drops, frequency, creatives to replace/test. |
| `meta_ads_budget_learning_review` | Meta Ads | Budget, learning phase, reset risk, ABO/CBO/Advantage+. |
| `ga4_channel_roas_review` | GA4 | Channel ROAS, source/medium/campaign, revenue/conversion mismatches. |
| `monthly_client_review` | cross-platform | Combines Ads/Meta/GA4, creates summary, tasks, and optional PDF. |

At first, workflows can be instructions plus a sequence of tool calls. Only later
should repeated calculations move into dedicated MCP read-tools.

## Product Priorities

### P0 - Task Injection And Basic Work Backlog

Shipped in 0.10.0:

- [x] Add task storage to `marketing-context` (Markdown + frontmatter under
  `clients/<slug>/tasks/`, editable in place, source-grounded, secret-redacted).
- [x] Add `append_task`, `list_tasks`, `update_task_status`, and `append_task_note`.
- [x] Extend the hook with visible active task injection:
  - on `UserPromptSubmit` when the prompt concerns a client/platform,
  - in a session with a current client set,
  - for prompts like "what are we doing", "what is due", "run a review".
- [x] Add task frontmatter/metadata: `suggested_workflow` and `knowledge`.
- [x] First workflow article `google-ads/google-ads-daily-check.md`
  (`task_type: workflow`) as the first `suggested_workflow` target.

Remaining in P0 (all shipped in 0.10.0):

- [x] Support recurring tasks through `recurring`, `schedule`, `last_run`,
  `next_due`, plus `list_due_tasks` and `mark_task_run`. `schedule` accepts an
  alias (daily/weekly/biweekly/monthly/quarterly/yearly) or a 5-field cron.
- [x] Add task templates and client/project setup that instantiates selected
  routines as tasks under `clients/<slug>/tasks/` (`list_task_templates`,
  `instantiate_task_template`, `setup_client_tasks`).
- [x] Add `general/task-operating-model.md` with the rule:
  task = intent + context + workflow + result.
- [x] Second workflow article `google-ads/google-ads-monthly-review.md`
  (`MONTHLY_DEFAULTS` + 90d waste cross-check).

**P0 complete.** The full task loop — grounded, recurring, template-instantiated,
visibly injected, closed via `mark_task_run`/`update_task_status` — ships without
touching the platform plugins. Next work (P1) crosses into `google-ads-baby`.

### P1 - Google Ads Review Loops

- [x] Add read-only helpers to Google Ads Baby (shipped in `google-ads-baby`
  0.15.0, `server/src/tools/read-analysis.ts` + `analysis-helpers.ts`):
  - [x] `get_budget_scaling_candidates`,
  - [x] `get_account_hygiene_report`,
  - [x] `get_pmax_channel_breakdown` (asset-group level; per-channel PMax split is
    not cleanly available via GAQL — feed-only-leak still needs the manual report),
  - [x] `get_search_terms_waste_candidates` (with the 90d bounce-back cross-check).
- [x] Each helper returns data + diagnosis + severity + suggested tasks +
  possible `prepare_*` actions. Decision logic is pure and unit-tested in the
  smoke suite; thresholds mirror the daily/monthly workflow articles. Live E2E
  against a real account remains open (shared with the plugin's existing E2E TODO).
- [x] Each result carries a `follow_up` line reminding the agent to record acted-on
  findings via `append_task` (`source_type: review`). (Done in-payload rather than
  via a platform-plugin hook — the analysis tools live server-side and the reminder
  travels with the result, so no cross-plugin hook wiring is needed.)

Deferred (P1 runner track — still parked, brittle pseudo-TTY):

- [ ] Optional `scripts/ai-runner.js` for running due tasks when a non-interactive
  adapter is available.
- [ ] Optional `scripts/install-scheduler.js` that generates cron/systemd
  timer/schtasks configuration.
- [ ] Refactor the `/home/jm/ai/run-test.sh` prototype: do not treat pseudo-TTY as
  stable automation; keep it only as a local experiment at most.

### P2 - Client-Level Monthly Review Workflow

This is **not** a new kind of thing. It is the same task model as daily/weekly:
a `task_type: workflow` article, instantiated as a recurring monthly task under
`clients/<slug>/tasks/`. The only differences from `google-ads-monthly-review`
are **scope, not nature**:

- it sits at the **client** level, not a single platform — it spans Google
  Ads + Meta + GA4;
- its steps may **orchestrate the per-platform workflows** (run the Google Ads
  monthly review, the Meta equivalent, then aggregate);
- its result is a **client-facing deliverable** (a report). The report is the
  workflow's *output*, not a separate product or engine.

So: workflow article → recurring monthly task, exactly like the others. Nothing
here introduces a "review product" as a distinct architectural entity.

- Add the `general/monthly-client-review.md` workflow article (`task_type:
  workflow`, `default_schedule: monthly`, `intent: monthly_client_review`) whose
  steps:
  - load the client profile and active tasks (`get_client_context`, `list_tasks`),
  - run the per-platform review workflows / read-only analysis tools,
  - compare against the client's targets,
  - generate action items → `append_task` (`source_type: review`),
  - record the review (`append_review`),
  - close/create tasks and `mark_task_run` on the recurring task,
  - optionally generate a PDF through `report-baby` as the deliverable.
- Add per-client `procedures/monthly.md` as per-client configuration the workflow
  reads (overrides the article defaults):
  - targets,
  - thresholds,
  - ignored campaigns,
  - seasonality,
  - required report language.
- Enable it per client via `setup_client_tasks` / `instantiate_task_template`,
  same as any other routine.

### P3 - Merchant/feed/bucketing

- Decide whether Merchant/feed should live in Google Ads Baby or in a separate
  plugin.
- Add read-only Merchant diagnostics:
  - product statuses,
  - disapprovals,
  - feed label/language,
  - potential title/price issues.
- Only after read-only support, add feed optimizer/product bucketing as mutations
  with preview and safe-word.

## Budgeting - Target Model

Budgeting should have three layers:

1. **Knowledge/injection:** rules from `budget-scaling-seasonality.md`, change
   thresholds, seasonality, learning phase, brand budget cap.
2. **Read-only diagnostics:** scaling candidates and budget-cutting risks.
3. **Mutation:** `prepare_budget_change` with preview, safe-word, and mutation log.

Target output for `get_budget_scaling_candidates`:

```json
{
  "campaign_id": "111",
  "campaign_name": "Search - Category",
  "current_daily_budget": 100,
  "spend_30d": 2900,
  "roas": 6.2,
  "target_roas": 4.5,
  "lost_is_budget": 0.22,
  "suggested_daily_budget": 120,
  "max_safe_step_pct": 20,
  "severity": "high",
  "reason": "ROAS above target and 22% lost impression share due to budget",
  "suggested_task": "Review and prepare +20% budget increase"
}
```

## Architecture Decisions

- `marketing-context` should not connect to Ads/Meta/GA4 itself. It stores memory,
  tasks, decisions, and knowledge.
- Platform plugins calculate metrics and prepare mutations.
- The hook connects the two through injection:
  - current client,
  - active tasks,
  - matching knowledge,
  - reminder to record the outcome.
- Tasks should be platform-neutral, but `intent` and `suggested_workflow` should
  be controlled vocabularies so the hook can map them to knowledge.

## Tooling Strategy — Platform Plugin Surface

Current surface (measured 2026-07):

- `google-ads-baby`: **55 tools** (39 `prepare_*`, ~10 read, safe-mutation kernel,
  auth/plugin).
- `meta-ads-baby`: **38 tools** (similar shape).

Every tool schema is injected into the model's context every session. 55 + 38 is
a real cost on two axes: token budget and selection accuracy (more near-duplicate
tools = worse tool choice). So the surface matters to the whole ecosystem, not
just to the plugins — the `marketing-context` enforcement gate and the auto-inject
`trigger_tools` map both key on these tool names.

The answer to "reduce or expand?" is **both, in order**: first consolidate to
shrink the surface, then apply the consolidated pattern to `meta-ads-baby` — do
not copy the sprawl.

### 1. Consolidate polymorphic families (no capability loss)

Collapse near-duplicate tools into discriminated-union tools keyed by a `type`
parameter:

- Google Ads assets: `prepare_sitelink_assets`, `prepare_callout_assets`,
  `prepare_call_asset`, `prepare_structured_snippet_assets`,
  `prepare_image_asset_from_file`, `prepare_image_asset_from_url`,
  `prepare_campaign_assets`, `prepare_ad_group_assets`,
  `prepare_asset_group_assets` (~9) → `prepare_asset` + `prepare_asset_link` (~2).
- Status toggles: `prepare_campaign_status`, `prepare_ad_status`,
  `prepare_keyword_status`, `prepare_ad_group_settings` → one
  `prepare_status(entity_type, id, status)`.
- Meta mirrors: `prepare_*_status` (3→1), `prepare_*_update` (3→1),
  `prepare_*_removal` (already have `prepare_clone_entity` as a generic; removals
  can follow), creatives `prepare_ad_creative`/`advantage`/`carousel`/`lead`/
  `video` (5→1-2), uploads `image`/`video` (2→1).

Estimated: Google Ads 55 → ~35, Meta 38 → ~24, zero features lost.

### 2. Keep expanding the `*_full` composite pattern

`google-ads-baby` already ships `prepare_search_campaign_full` /
`prepare_display_campaign_full` / `prepare_performance_max_campaign_full` and the
server instructions already tell the model to prefer them over chains of granular
`prepare_*`. This is the right direction: it reduces call-chains and confirmations,
not tool count. Extend it to Meta (`prepare_meta_campaign_full`: campaign + ad set
+ ad + creative in one atomic transaction, one safe-word).

### 3. Pin the mutation-safety contract (not the code)

Both plugins carry ~8 kernel tools (`confirm_mutation`, `confirm_all_mutations`,
`confirm_safe_word`, `get_safety_setup`, `list_pending_mutations`,
`get_mutation_history`, `get_mutation_stats`, `update_plugin`) plus the
prepare→preview→safe-word→confirm protocol.

We do **not** share this as code. There is no shared npm package and no shared
repo, and the copied plumbing has already drifted — but the drift is *legitimate*
(`GOOGLE_ADS_*` vs `META_ADS_*` env prefixes, `customerId` vs `adAccountId`,
`.gads-` vs `.mads-` dotfiles, platform-specific validation). Copying code would
fight that reality. What must stay identical is the **interface**, because
`marketing-context`'s gate (`mcp__.*(google-ads|meta-ads).*`) and the auto-inject
`trigger_tools` map bind to exactly these tool names.

So the shared artifact is a **contract, verified by a check**, not shared code:

- `docs/mutation-safety-contract.md` — single source of truth: required kernel
  tool names, the confirmation protocol, the `mutation-history.jsonl` record
  shape, and explicit variation points that are allowed to differ per platform.
- `.claude/skills/plugin-contract-guard/` — a **developer-only, personal** skill
  (excluded from the npm `files` whitelist and from the plugin export, symlinked
  into `~/.claude/skills/` for cross-repo use) that loads the contract and runs
  `check-contract.mjs`: it statically asserts every kernel tool is present by
  exact name in each plugin, that the log filename and required record fields
  match, and ignores the variation points. Exit non-zero on drift.
- Optional hard backstop: a 3-line `pre-commit` hook in each plugin repo running
  the same `check-contract.mjs` — the one acceptable duplication (three lines,
  never a copy of the kernel).

The contract leads, the plugins follow: an intentional interface change edits the
contract first, then the plugins. New platform plugins inherit the same contract
by conforming to the check. Sequence this after the P0 task layer lands.

### Relationship to `marketing-context`

Fewer, more semantic tool names directly simplify our layer: the gate matcher
(`mcp__.*(google-ads|meta-ads).*`) and the auto-inject `trigger_tools` mapping
(auto-inject P1) both get easier and more precise. Consolidation is not just a
plugin concern — it lowers the maintenance cost of the retrieval/enforcement code
here. Track this as a cross-repo item, sequenced after the P0 task layer lands so
we do not move two moving targets at once.

## Resolved Decisions

- **Tasks are grounded in the knowledge base.** Every task carries a `source`
  (like knowledge notes): it derives from an article/procedure
  (`source_type: knowledge`), from a review/observation (`source_type: review`),
  or is manual (`source_type: manual`) — but even manual tasks point to
  `knowledge:` so the rule they enforce is traceable. A task is never "just
  because"; it always names what it follows from.
- **Task injection is visible to the user.** Active tasks inject as a visible
  block (like the session-start knowledge TOC), not only silent
  `additionalContext`, so the user can see "2 tasks due for client X" and react.
- **Workflows are procedural knowledge articles, not a third artifact.** A
  workflow is a named operational recipe (which tools, in what order, which
  thresholds, what to output). It lives as a knowledge article with
  `task_type: workflow`; `suggested_workflow` is just its path, and the model runs
  it via `read_knowledge` + platform tools. Dedicated MCP tools come only later,
  when a repeated calculation actually hurts. This keeps thresholds as explicit,
  per-client-editable knowledge (`procedures/monthly.md`) instead of frozen in
  code — a deliberate advantage of the editable knowledge layer.

## Open Questions

- Is task status in frontmatter enough, or should selected status changes also
  append a trace to `review-log.md`?
- Should weekly/monthly checklists be recurring tasks or a separate format?

## Next Sensible Step

Build P0 without touching the platform plugins:

1. Add task storage and four MCP tools in `marketing-context`.
2. Add active task injection in the hook.
3. Add one manual documentation workflow: `google_ads_budget_scaling_review`.
4. Test the scenario:
   - a review detects a budget-limited campaign,
   - the agent records a task,
   - the next session injects the task,
   - the agent reads the referenced knowledge,
   - the agent prepares `prepare_budget_change`,
   - after confirmation, the agent records the mutation and closes the task.
