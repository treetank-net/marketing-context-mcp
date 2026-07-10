import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MarketingContextConfig } from '../config.js';
import { copyBundledKnowledge } from '../storage.js';

const REPO_RAW = 'https://raw.githubusercontent.com/treetank-net/marketing-context-mcp/master';

function getPluginRoot(): string {
  return process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
}

function getLocalVersion(): string {
  try {
    const pkgPath = join(getPluginRoot(), 'package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// The stamp certifies a COMPLETE install (see scripts/start-mcp.js). Installs
// updated by pre-0.3.1 updaters have a current package.json but a stale
// hook.cjs — the stamp mismatch is what lets us detect and heal them.
function getStampedVersion(): string | null {
  try {
    return JSON.parse(readFileSync(join(getPluginRoot(), '.update-stamp.json'), 'utf8')).version || null;
  } catch {
    return null;
  }
}

async function downloadFile(remotePath: string, localPath: string): Promise<boolean> {
  const res = await fetch(`${REPO_RAW}/${remotePath}`);
  if (!res.ok) return false;
  mkdirSync(dirname(localPath), { recursive: true });
  writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
  return true;
}

function parseSemver(version: string): number[] {
  return version.replace(/^v/, '').split('.').map((part) => parseInt(part, 10) || 0);
}

function semverGt(a: string, b: string): boolean {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da > db;
  }
  return false;
}

function extractChangelog(text: string, fromVer: string, toVer: string): string {
  const lines = text.split('\n');
  const sections: string[] = [];
  let current: { version: string; body: string[] } | null = null;
  const flush = () => {
    if (current && semverGt(current.version, fromVer) && !semverGt(current.version, toVer)) {
      sections.push([`## ${current.version}`, ...current.body].join('\n').trimEnd());
    }
  };

  for (const line of lines) {
    const match = line.match(/^##\s+v?(\d+\.\d+\.\d+)/);
    if (match) {
      flush();
      current = { version: match[1], body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  flush();
  return sections.join('\n\n').trim();
}

// Refresh knowledge articles from the repo tree — they ship with the git
// install and are otherwise never updated by self-update. Best-effort.
async function syncKnowledge(root: string): Promise<number> {
  try {
    const res = await fetch('https://api.github.com/repos/treetank-net/marketing-context-mcp/git/trees/master?recursive=1');
    if (!res.ok) return 0;
    const tree = ((await res.json()) as { tree?: Array<{ type: string; path: string }> }).tree || [];
    const files = tree.filter((e) => e.type === 'blob' && e.path.startsWith('knowledge/'));
    const results = await Promise.all(
      files.map((e) => downloadFile(e.path, join(root, e.path)).catch(() => false)),
    );
    return results.filter(Boolean).length;
  } catch {
    return 0;
  }
}

async function fetchChangelog(fromVer: string, toVer: string): Promise<string> {
  try {
    const res = await fetch(`${REPO_RAW}/CHANGELOG.md`);
    if (!res.ok) return '';
    return extractChangelog(await res.text(), fromVer, toVer);
  } catch {
    return '';
  }
}

export function registerUpdateTools(server: McpServer, cfg: MarketingContextConfig) {
  server.tool(
    'update_plugin',
    'Check for plugin updates and install them. After updating, the user must restart the session for changes to take effect.',
    {},
    async () => {
      const localVer = getLocalVersion();
      try {
        const res = await fetch(`${REPO_RAW}/package.json`);
        if (!res.ok) {
          return { content: [{ type: 'text' as const, text: `Cannot reach update server. Current version: ${localVer}` }] };
        }

        const remote = (await res.json()) as { version?: string };
        const remoteVer = remote.version || '0.0.0';
        if (remoteVer === localVer && getStampedVersion() === remoteVer) {
          return { content: [{ type: 'text' as const, text: `Already up to date: ${localVer}` }] };
        }

        const root = getPluginRoot();
        const changelog = await fetchChangelog(localVer, remoteVer);
        // Keep in sync with scripts/start-mcp.js. NOTE: this only refreshes the
        // runtime (MCP server + hook logic). Hook *registration* lives in
        // .claude-plugin/plugin.json, which Claude Code reads from the installed
        // plugin — new/changed hooks (e.g. SessionStart) require `/plugin update`.
        // package.json goes last so an interrupted update keeps the old version
        // on disk and retries in full on the next run.
        const files = [
          ['bundle.cjs', join(root, 'bundle.cjs')],
          ['hook.cjs', join(root, 'hook.cjs')],
          ['scripts/start-mcp.js', join(root, 'scripts', 'start-mcp.js')],
          ['CHANGELOG.md', join(root, 'CHANGELOG.md')],
          ['package.json', join(root, 'package.json')],
        ];
        const results: string[] = [];
        const ok: Record<string, boolean> = {};
        for (const [remotePath, localPath] of files) {
          ok[remotePath] = await downloadFile(remotePath, localPath);
          results.push(`${remotePath}: ${ok[remotePath] ? 'OK' : 'FAILED'}`);
        }
        const knowledgeCount = await syncKnowledge(root);
        results.push(`knowledge/ (bundled library): ${knowledgeCount} files synced`);
        // In copy mode the context dir owns the library: seed NEW articles there,
        // but never overwrite the user's existing copies.
        if (cfg.knowledgeMode === 'copy' && cfg.bundledDir) {
          try {
            const seed = await copyBundledKnowledge(cfg);
            results.push(
              `context dir (copy mode): ${seed.copied.length} new article(s) seeded, ${seed.skipped.length} existing left untouched`,
            );
          } catch {
            results.push('context dir (copy mode): seeding new articles failed');
          }
        }
        if (ok['bundle.cjs'] && ok['hook.cjs']) {
          writeFileSync(join(root, '.update-stamp.json'), JSON.stringify({ version: remoteVer }));
        }

        return {
          content: [{
            type: 'text' as const,
            text: [
              `Updated ${localVer} -> ${remoteVer}`,
              ...(changelog ? ['', "What's new:", changelog] : []),
              '',
              ...results,
              '',
              'Restart the session for changes to take effect.',
              'If this release adds or changes hooks, also run `/plugin update` so',
              'Claude Code reloads the plugin manifest (hook registration).',
            ].join('\n'),
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Update check failed: ${message}. Current version: ${localVer}` }] };
      }
    },
  );
}
