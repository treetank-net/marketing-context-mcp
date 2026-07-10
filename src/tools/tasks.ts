import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketingContextConfig } from '../config.js';
import {
  appendTaskNote,
  createTask,
  listDueTasks,
  listKnowledgeFiles,
  listTasks,
  markTaskRun,
  readKnowledgeFile,
  updateTaskStatus,
  type TaskRecord,
} from '../storage.js';

const STATUS = z.enum(['open', 'active', 'paused', 'done', 'deferred']);
const PRIORITY = z.enum(['low', 'normal', 'high']);
const SOURCE_TYPE = z.enum(['knowledge', 'review', 'manual']);

export function registerTaskTools(server: McpServer, cfg: MarketingContextConfig) {
  server.tool(
    'append_task',
    'Record a durable operational task for a client (a stored intent the agent injects and acts on later). ' +
      'A task should be grounded in the knowledge base: prefer source_type "knowledge" (or "review") and name the ' +
      'knowledge article(s) it follows from, so it is never arbitrary. Point suggested_workflow at a procedural ' +
      'knowledge article (task_type: workflow) when one applies. Stored as a Markdown file under clients/<slug>/tasks/.',
    {
      client_slug: z.string(),
      title: z.string(),
      platform: z.string().optional(),
      account_id: z.string().optional(),
      priority: PRIORITY.optional(),
      due: z.string().optional().describe('ISO date, e.g. 2026-07-10'),
      intent: z.string().optional().describe('Controlled-vocabulary intent, e.g. optimize_budget'),
      reason: z.string().optional().describe('Why this task exists — the business/observation trigger'),
      context: z.string().optional().describe('Concrete context: campaign ids, current values, candidate change'),
      suggested_workflow: z.string().optional().describe('Path to a workflow knowledge article to run'),
      knowledge: z.array(z.string()).optional().describe('Knowledge article paths to read before starting'),
      source_type: SOURCE_TYPE.optional().describe('Where the task follows from (default manual)'),
      source_ref: z.string().optional().describe('Reference for the source, e.g. a knowledge path or review ref'),
      recurring: z.boolean().optional().describe('Make this a recurring routine (defaults status to active)'),
      schedule: z
        .string()
        .optional()
        .describe('Recurrence: alias (daily/weekly/biweekly/monthly/quarterly/yearly) or 5-field cron, e.g. "0 9 * * MON"'),
    },
    async (input) => {
      const task = await createTask(cfg, input);
      const due = task.next_due ? `, next due ${task.next_due}` : '';
      return textResult(`Recorded task ${task.path} (id ${task.id}, status ${task.status}, priority ${task.priority}${due}).`);
    },
  );

  server.tool(
    'list_tasks',
    'List stored client tasks, most urgent first (priority, then due date). Filter by client, platform, status, ' +
      'priority, or due-before date. With no status filter, returns tasks in every status.',
    {
      client_slug: z.string().optional(),
      platform: z.string().optional(),
      status: z.union([STATUS, z.array(STATUS)]).optional(),
      priority: PRIORITY.optional(),
      due_before: z.string().optional().describe('ISO date; return tasks due on or before this date'),
    },
    async ({ client_slug, platform, status, priority, due_before }) => {
      const tasks = await listTasks(cfg, { client_slug, platform, status, priority, due_before });
      if (tasks.length === 0) return textResult('No matching tasks.');
      return textResult(tasks.map(renderTaskLine).join('\n'));
    },
  );

  server.tool(
    'list_due_tasks',
    'List tasks that are actionable now: one-off open tasks, and recurring tasks whose next_due has passed. ' +
      'Recurring tasks scheduled for the future are excluded. This is the "what should I run now" view.',
    {
      client_slug: z.string().optional(),
      platform: z.string().optional(),
      now: z.string().optional().describe('ISO timestamp to evaluate against (default: now)'),
    },
    async ({ client_slug, platform, now }) => {
      const tasks = await listDueTasks(cfg, { client_slug, platform }, now || new Date().toISOString());
      if (tasks.length === 0) return textResult('Nothing due.');
      return textResult(tasks.map(renderTaskLine).join('\n'));
    },
  );

  server.tool(
    'mark_task_run',
    'Record that a recurring task ran: stamps last_run and recomputes next_due from its schedule (or from an ' +
      'explicit next_due), and appends a short run trace to the body. The detailed result should still go to ' +
      'append_review. Use for recurring routines; for one-off tasks use update_task_status.',
    {
      task: z.string().describe('Task path or id'),
      result_summary: z.string().optional().describe('One-line outcome of this run'),
      next_due: z.string().optional().describe('Override the computed next_due (ISO timestamp)'),
    },
    async ({ task, result_summary, next_due }) => {
      const updated = await markTaskRun(cfg, task, result_summary, next_due);
      return textResult(
        `Marked run for ${updated.path}. last_run ${updated.last_run}${updated.next_due ? `, next_due ${updated.next_due}` : ''}.`,
      );
    },
  );

  server.tool(
    'update_task_status',
    'Change a task status (open/active/paused/done/deferred) and append a timestamped trace to the task body. ' +
      'Identify the task by its path or id (from append_task / list_tasks). Record the substantive outcome with ' +
      'append_review / append_mutation as well; this only moves the task state.',
    {
      task: z.string().describe('Task path or id'),
      status: STATUS,
      note: z.string().optional().describe('Short note on why the status changed / the outcome'),
    },
    async ({ task, status, note }) => {
      const updated = await updateTaskStatus(cfg, task, status, note);
      return textResult(`Task ${updated.path} → ${updated.status}.`);
    },
  );

  server.tool(
    'append_task_note',
    'Append a timestamped note to a task body without changing its status. Identify the task by path or id.',
    {
      task: z.string().describe('Task path or id'),
      note: z.string(),
    },
    async ({ task, note }) => {
      const updated = await appendTaskNote(cfg, task, note);
      return textResult(`Appended note to ${updated.path}.`);
    },
  );

  server.tool(
    'list_task_templates',
    'List available task templates — workflow knowledge articles (task_type: workflow) that can be instantiated ' +
      'as recurring/one-off client tasks. Filter by platform or intent. Use before setup_client_tasks to pick routines.',
    {
      platform: z.string().optional(),
      intent: z.string().optional(),
    },
    async ({ platform, intent }) => {
      const templates = (await listKnowledgeFiles(cfg)).filter((d) => asArray(d.frontmatter.task_type).includes('workflow'));
      const rows = templates
        .filter((d) => !platform || asArray(d.frontmatter.applies_to).includes(platform))
        .filter((d) => !intent || String(d.frontmatter.intent || '') === intent)
        .map((d) => {
          const sched = d.frontmatter.default_schedule ? ` · schedule ${d.frontmatter.default_schedule}` : '';
          const it = d.frontmatter.intent ? ` · intent ${d.frontmatter.intent}` : '';
          return `- ${d.path}${it}${sched}\n  ${String(d.frontmatter.summary || d.title || '').slice(0, 200)}`;
        });
      return textResult(rows.length ? rows.join('\n') : 'No workflow templates found.');
    },
  );

  server.tool(
    'instantiate_task_template',
    'Create a client task from a workflow template (task_type: workflow article). Pulls platform/intent/schedule ' +
      'defaults from the template frontmatter; the created task points suggested_workflow back at the template. ' +
      'Recurring when a schedule (given or template default) applies.',
    {
      template: z.string().describe('Path to a workflow knowledge article'),
      client_slug: z.string(),
      account_id: z.string().optional(),
      schedule: z.string().optional().describe('Override the template default schedule'),
      priority: PRIORITY.optional(),
      due: z.string().optional(),
    },
    async ({ template, client_slug, account_id, schedule, priority, due }) => {
      const task = await instantiateTemplate(cfg, template, { client_slug, account_id, schedule, priority, due });
      return textResult(`Created ${task.path} from ${template} (status ${task.status}${task.next_due ? `, next due ${task.next_due}` : ''}).`);
    },
  );

  server.tool(
    'setup_client_tasks',
    'Set up a client\'s operational baseline: instantiate several workflow templates as tasks in one call. ' +
      'Pass the template paths to enable; each becomes a task (recurring if it has a schedule). Idempotency is not ' +
      'enforced — call list_tasks first if unsure.',
    {
      client_slug: z.string(),
      templates: z.array(z.string()).describe('Workflow template paths to enable'),
      account_id: z.string().optional(),
      priority: PRIORITY.optional(),
    },
    async ({ client_slug, templates, account_id, priority }) => {
      const created: string[] = [];
      const failed: string[] = [];
      for (const template of templates) {
        try {
          const task = await instantiateTemplate(cfg, template, { client_slug, account_id, priority });
          created.push(`${task.path}${task.next_due ? ` (next due ${task.next_due})` : ''}`);
        } catch (error) {
          failed.push(`${template}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      return textResult(
        [`Created ${created.length} task(s) for ${client_slug}:`, ...created.map((c) => `- ${c}`), ...(failed.length ? ['', 'Failed:', ...failed.map((f) => `- ${f}`)] : [])].join('\n'),
      );
    },
  );
}

interface InstantiateOpts {
  client_slug: string;
  account_id?: string;
  schedule?: string;
  priority?: 'low' | 'normal' | 'high';
  due?: string;
}

async function instantiateTemplate(cfg: MarketingContextConfig, template: string, opts: InstantiateOpts): Promise<TaskRecord> {
  const doc = await readKnowledgeFile(cfg, template);
  if (!asArray(doc.frontmatter.task_type).includes('workflow')) {
    throw new Error(`${template} is not a workflow template (needs task_type: workflow).`);
  }
  const platform = asArray(doc.frontmatter.applies_to).find((p) => p === 'google-ads' || p === 'meta-ads');
  const intent = doc.frontmatter.intent ? String(doc.frontmatter.intent) : undefined;
  const schedule = opts.schedule || (doc.frontmatter.default_schedule ? String(doc.frontmatter.default_schedule) : undefined);
  const knowledge = [template, ...asArray(doc.frontmatter.related)].filter((v, i, a) => a.indexOf(v) === i);
  return createTask(cfg, {
    client_slug: opts.client_slug,
    title: doc.title,
    platform,
    account_id: opts.account_id,
    intent,
    priority: opts.priority,
    due: opts.due,
    reason: `Instantiated from workflow template ${template}.`,
    suggested_workflow: template,
    knowledge,
    source_type: 'knowledge',
    source_ref: template,
    recurring: Boolean(schedule),
    schedule,
  });
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value === undefined || value === null || value === '') return [];
  return [String(value)];
}

function renderTaskLine(t: TaskRecord): string {
  const bits = [
    `[${t.priority}]`,
    t.status,
    t.due ? `due ${t.due}` : '',
    t.recurring && t.next_due ? `next ${t.next_due}` : '',
    t.platform || '',
  ]
    .filter(Boolean)
    .join(' ');
  const refs = [
    t.suggested_workflow ? `workflow: ${t.suggested_workflow}` : '',
    t.knowledge.length ? `knowledge: ${t.knowledge.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('; ');
  return `- ${t.path}\n  ${bits} — ${t.title}${refs ? `\n  ${refs}` : ''}`;
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
