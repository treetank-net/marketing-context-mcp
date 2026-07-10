# Mutation-Safety Contract

Single source of truth for the mutation-safety **interface** that every
ads-platform plugin in this ecosystem (`google-ads-baby`, `meta-ads-baby`, and any
future platform plugin) must expose identically.

This pins the **contract**, not the code. Implementations legitimately differ per
platform (env-var prefixes, account-id field names, validation). What may NOT
differ are the tool names, the confirmation protocol, and the mutation-log record
shape — because `marketing-context`'s enforcement gate and the auto-inject
`trigger_tools` map bind to exactly these. Code drift is fine; contract drift
breaks the hub.

Conformance is checked by `.claude/skills/plugin-contract-guard/check-contract.mjs`
(run via the `plugin-contract-guard` skill). This document is the check's input —
edit the machine-readable regions below and the check follows.

## 1. Required kernel tools

Every plugin MUST register these tool names exactly (no prefix, no rename):

<!-- kernel-tools:start -->
```
confirm_mutation
confirm_all_mutations
confirm_safe_word
get_safety_setup
list_pending_mutations
get_mutation_history
get_mutation_stats
update_plugin
```
<!-- kernel-tools:end -->

## 2. Confirmation protocol

- Every mutating tool is named `prepare_*` and returns a **preview** plus an
  **LLM-invented safe word**. It never executes.
- The model shows the full preview to the user and waits for the user to reply
  with the safe word.
- Execution happens only via `confirm_mutation` (single) or
  `confirm_all_mutations` (batch, one safe word covers the batch).
- `prepare_*` and `confirm_*` must never run in the same turn.
- New campaigns/entities are created **paused** by default.
- Prepared operations are held as tokens with a TTL. Defaults:
  - `standard` safety level: token TTL **3600s**, confirm-state TTL **3600s**.
  - `strict`: both **300s**.
  - `off`: confirmation bypassed (local/testing only).

## 3. Mutation-log record

Append-only JSONL at `mutation-history.jsonl` in the plugin's config dir. Each line
is one record with these fields:

<!-- log-fields:start -->
```
timestamp        required  ISO-8601 string
action           required  string (the prepare_* action name)
<accountId>      required  string  (platform-named; see variation points)
preview          required  string
params           required  object
success          required  boolean
error            optional  string   (present on failure)
apiResult        optional  any      (present on success)
assetIds         optional  string[]
batchId          optional  string   (groups a confirm_all_mutations batch)
```
<!-- log-fields:end -->

## 4. Variation points (allowed to differ per platform)

These are legitimate, expected differences — the check must NOT flag them:

- **Env-var prefix**: `<PLATFORM>_ADS_*` — e.g. `GOOGLE_ADS_SAFETY_LEVEL` vs
  `META_ADS_SAFETY_LEVEL`, same for `*_MUTATION_TOKEN_TTL_SECONDS`,
  `*_CONFIRM_STATE_TTL_SECONDS`, `*_ENABLE_MANUAL_CONFIRM`, `*_YOLO`.
- **Account-id field** in the log record and params: `customerId` (Google) vs
  `adAccountId` (Meta). Each plugin picks one and uses it consistently.
- **Safe-word / confirm-state dotfiles**: `.gads-safe-word` vs `.mads-safe-word`,
  `.gads-confirm-state` vs `.mads-confirm-state`.
- **Validation** (`validation.ts`) and all `prepare_*` domain logic: fully
  platform-specific, not shared.
- **Composite `*_full` tools**: platform-specific and encouraged; not part of the
  kernel contract.

## 5. What the check verifies (v1)

- Every kernel tool in §1 is registered, by exact name, in each plugin.
- `mutation-history.jsonl` is the log filename.
- Every required field in §3 (except the platform-named account-id) is present in
  the plugin's history record type.

Not yet verified (later, when it earns its cost): full input-schema shape of each
kernel tool, TTL default values, protocol behavior at runtime.
