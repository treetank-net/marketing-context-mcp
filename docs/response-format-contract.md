# Response-Format Contract

Single source of truth for **what an MCP response may cost** in the plugin family
(`google-ads-baby`, `meta-ads-baby`, `google-analytics-baby` incl. Search Console,
`marketing-context-mcp`; `report-baby` already conforms by returning file paths).

The reader of every response is an LLM agent working for an analyst. Every
character lands in its context window and is paid for on every following turn.
The server therefore does the shaping that an agent would otherwise do with
`cut`/`sort`/`head`/`awk`: select, filter, aggregate, rank and round **before**
anything is returned.

Sibling of `mutation-safety-contract.md`. Same rule: this pins the **contract**,
not the code. Each repo keeps its own `format.ts`; what may not differ is the
output shape, the shaping parameter names and the budgets below.

## 1. Principles

1. **Answer, don't dump.** Default output is the smallest slice that answers the
   typical question (top-N, totals). Full data is opt-in.
2. **Say it once.** Anything identical across rows, responses or calls goes in a
   header line, the tool description or the server instructions, never per row
   or per response.
3. **Bounded by construction.** No code path may return an unpaginated,
   unlimited payload.
4. **Human units.** The agent never converts micros, cents, epoch ms or enum
   numbers.

## 2. Tabular responses

Every list-shaped response is TSV with this layout:

```
# <what> · <scope> · <window> · currency=<CUR>
# <constant>=<value> · <constant>=<value>          (hoisted columns, optional)
# totals: cost=1234.50 clicks=812 conversions=31   (optional, see §3)
<col>\t<col>\t...
<row>
...
<page note>                                        (only when pages > 1)
```

Rules:

| Topic | Rule |
|---|---|
| Column names | Short snake_case leaf names (`cost`, `clicks`, `campaign`, `campaign_id`). Prefix with the parent only to resolve a collision. Never dotted API paths like `metrics.cost_micros`. |
| Money | Decimal in the account currency, 2 decimals. Never micros or cents. The currency appears once, in the header. |
| Ratios | Percent with 2 decimals and a `_pct` suffix (`ctr_pct`, `bounce_rate_pct`). |
| Other floats | 2 decimals when ≥ 1, otherwise 3 significant digits. No thousands separators. |
| Enums | Always the name. An unmapped value renders as `UNKNOWN(<n>)`, never a bare number. |
| IDs | Bare ids. No resource names (`customers/1/campaigns/2` → `2`). |
| Dates | ISO `YYYY-MM-DD`. Timestamps ISO-8601 to the second. |
| Empty | An empty cell. **Columns empty in every row are dropped.** |
| Constant columns | A column with one value across all returned rows moves to the `#` header line (`campaign=Brand PL`). |
| Arrays | Scalar arrays joined with ` ~ `. Arrays of objects are never JSON-in-a-cell: either a separate TSV section or a count (`headlines=12`). |
| Long values | URLs, image links and raw specs only when explicitly requested via `fields`. |
| Legend | No per-response legend or footer. The TSV conventions are explained once in the server instructions. |

## 3. Shaping parameters

Every read tool that returns rows MUST accept the parameters below where they make
sense, with **these exact names** across plugins:

| Param | Type | Meaning |
|---|---|---|
| `fields` | `string[]` | Columns to return, by the §2 short names. Omitted → the tool's lean default set. |
| `order_by` | `string` | A column name; `-` prefix means descending (`-cost`). Omitted → the tool's natural rank (usually `-cost`). |
| `limit` | `int` | Top-N rows after filtering and sorting. Each tool documents its default (typically 50). |
| `min_cost` / `min_impressions` / `min_clicks` | `number` | Drop rows below the threshold. A zero-activity row is noise unless asked for. |
| `summary` | `boolean` | Return only the header and totals (row count + summable metrics), no rows. |
| `page` / `page_chars` | `int` | Paging, see §4. |
| `output` | `"inline" \| "file"` | See §6. Default `inline`. |

**Truncation is always declared.** When `limit` or a threshold cuts rows, the
header says so and totals cover **all** matching rows, not just the shown ones:

```
# search terms · 30d · showing top 50 of 812 by -cost · currency=PLN
# totals (all 812): cost=18420.11 clicks=9031 conversions=212
```

This lets the agent answer "how much in total" and "what are the worst" from one
small response instead of paging through everything.

## 4. Paging and hard bounds

- Paging is by response size. The default page is **12,000 chars** (about 3k tokens).
  `page_chars` is clamped to 2,000–100,000.
- The page note is one line of at most 120 chars, emitted only when `pages > 1`.
- Every escape hatch (`format=json`, raw GAQL, raw Graph, raw GA reports)
  goes through the same paging. An API call without a row limit
  (e.g. GA `runReport` without `limit`) MUST send an explicit limit.
- A server-side cap such as a GAQL `LIMIT` that silently drops rows is forbidden.
  If a cap exists, the header reports it (`capped at 500`).

## 5. Non-tabular responses

- **JSON is compact** (`JSON.stringify(x)`, no indent). Omit `null`, `undefined`, `[]`
  and `{}` keys. Do not pass through raw API metadata, quota objects, protobuf
  defaults or `{seconds,nanos}` timestamps.
- **Homogeneous lists inside JSON** (findings, breakdowns) are TSV sections, not
  arrays of objects. Never a TSV string escaped inside JSON.
- **Analysis reports**: fields that are constant across findings (workflow,
  source type, fixed reason, follow-up text) appear once at report level.
  An entity name appears once per finding, not in every text field.
- **Previews and multi-line text** go out as plain text content, not as an escaped
  JSON string.
- **Prose instructions** belong in the tool description or server instructions. A
  response may carry instruction text only when it depends on the current
  state (e.g. "3 other mutations are queued").
- **No duplicate representations.** For example, mutation history returns
  `preview` by default and `params` only with `include_params: true`. Ad
  blueprints carry each text once.
- **Errors**: one actionable line. No stack traces, no raw API error bodies
  beyond the message.

## 6. File output

`output: "file"` writes every shaped row (filters, `order_by`, `limit` and
`fields` apply, paging does not) to `<config-dir>/exports/<table>-<timestamp>.tsv`
and returns only:

```
# <what> · <scope> · currency=<CUR> · rows=4812 · file=/abs/path.tsv
# columns: campaign_id campaign ad_group search_term cost clicks conversions
# totals: ...
<first 5 rows as TSV>
```

The file itself is **plain TSV, not the §2 document**, so any reader parses it
without guessing:

- UTF-8. Line 1 is the column names (the same short names as inline), then one row per line.
- Tab-delimited, no quoting, no `#` lines. Tabs and newlines inside values become spaces.
- Empty cell = no value. Numbers use `.` and no thousands separators; units as in §2.
- Constant columns are **not** hoisted and all-empty columns are dropped.

When a fetch cap exists (Graph pages, a GA row limit), file mode raises it to the
largest cap the API allows, and the response header still reports any cap hit.

The agent then works with `awk`/`duckdb`/`mlr`/`csv` on the file and prints only
aggregates. This mode is useful only in hosts with a shell (Claude Code, Codex,
Cursor). Claude Desktop cannot read the file, so `inline` stays the default and
each plugin's manual skill documents the format with parsing examples.

## 7. Tool surface (schemas, instructions, hooks)

The `tools/list` payload is paid once per session before any work.

- **Profiles.** Every plugin with mutating tools MUST support a read-only
  profile that registers no `prepare_*` / `confirm_*` tools
  (`GOOGLE_ADS_BABY_PROFILE=read`, `META_ADS_BABY_PROFILE=read`), and it is
  the **default**. Mutating profiles are opt-in, and an unknown value falls back
  to `read`.
- **Parameter descriptions** are at most about 100 chars. A concept shared by many
  tools (safe word, customer id, paging, money units) is explained once in the
  server instructions and referenced by name in the parameters.
- **Tool descriptions** are at most about 200 chars (one or two sentences; details go to a manual skill). They say when to use the tool and
  what it returns, not how the whole family works.
- **Hooks** (`marketing-context` injections) stay within the hook budgets below
  and inject titles or pointers rather than full summaries. An unmatched prompt
  injects nothing.

## 8. Budgets

Machine-readable for a future conformance check (`chars`, measured on the built
bundle via `tools/list` and on fixture responses):

<!-- budgets:start -->
```
tools_list.read_profile          15000
tools_list.full_profile          45000
server_instructions               2500
param_description                  100
tool_description                   200
response.default_page            12000
response.page_note                 120
prepare_response.overhead          300
hook.session_start                3000
hook.user_prompt                  2000
```
<!-- budgets:end -->

Each repo SHOULD have a test that fails when its built `tools/list` or a fixture
response exceeds these. Without that test, budgets drift back within weeks.

## 9. Variation points (allowed to differ)

- Platform metric names (`conversions` vs `results`, `sessions`, `clicks` for
  GSC) and each tool's default `fields` set.
- Default `limit` and natural `order_by` per tool.
- Which threshold params a tool offers (GSC has no cost, so it has no `min_cost`).
- Env-var prefixes and config dir names.

## 10. Example: before and after

Before (`get_campaigns`, current google-ads-baby):

```
# Campaigns for customer 1234567890 (last 30 days)
campaign.id	campaign.name	campaign.status	campaign.advertising_channel_type	campaign_budget.amount_micros	metrics.impressions	metrics.clicks	metrics.ctr	metrics.cost_micros	metrics.conversions	metrics.conversions_value
2211	Brand PL	ENABLED	SEARCH	150000000	48211	5120	0.106200	4410230000	212	91234.5
...
Values are tab-separated; ids are bare…
```

After:

```
# campaigns · customer 1234567890 · last 30d · currency=PLN · showing 12 of 12 by -cost
# totals: cost=18420.11 clicks=9031 conversions=212
campaign_id	campaign	status	type	budget	impressions	clicks	ctr_pct	cost	conversions	conv_value
2211	Brand PL	ENABLED	SEARCH	150.00	48211	5120	10.62	4410.23	212	91234.50
```
