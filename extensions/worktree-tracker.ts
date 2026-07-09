/**
 * worktree-tracker — track git worktrees and active branches across the IA ecosystem.
 *
 * Shows a persistent TUI widget listing repos with their current branch, dirty
 * status, and stale status. Also registers a /worktrees command for a full
 * interactive overlay.
 *
 * Homes in on the Industrial Algebra working directory (`~/working/industrial-algebra`)
 * but can be pointed elsewhere via the WORKTREE_ROOT env var.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { visibleWidth, truncateToWidth } from "@earendil-works/pi-tui";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RepoState {
  name: string;
  branch: string;
  dirty: boolean;         // uncommitted changes
  behind: number | null;   // commits behind remote (null = couldn't check)
  ahead: number | null;    // commits ahead of remote
  stale: boolean;          // > 7 days since last commit
  lastCommitDate: string | null;
  worktree: boolean;       // true if this is a git-worktree checkout
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT =
  process.env.WORKTREE_ROOT ||
  path.join(os.homedir(), "working", "industrial-algebra");

function isGitRepo(dir: string): boolean {
  try {
    const gitPath = path.join(dir, ".git");
    return fs.existsSync(gitPath);
  } catch {
    return false;
  }
}

async function getBranch(pi: ExtensionAPI, dir: string): Promise<string> {
  const r = await pi.exec("git", ["branch", "--show-current"], { cwd: dir }).catch(() => null);
  return r?.stdout.trim() || "?";
}

async function isDirty(pi: ExtensionAPI, dir: string): Promise<boolean> {
  const r = await pi.exec("git", ["status", "--porcelain"], { cwd: dir }).catch(() => null);
  return (r?.stdout.trim().length ?? 0) > 0;
}

async function getAheadBehind(
  pi: ExtensionAPI,
  dir: string,
  branch: string,
): Promise<{ behind: number | null; ahead: number | null }> {
  if (branch === "?") return { behind: null, ahead: null };
  const r = await pi
    .exec("git", ["rev-list", "--left-right", "--count", `origin/${branch}...${branch}`], {
      cwd: dir,
      timeout: 3000,
    })
    .catch(() => null);
  const parts = r?.stdout.trim().split(/\s+/);
  if (parts && parts.length === 2) {
    return { behind: parseInt(parts[0], 10) || 0, ahead: parseInt(parts[1], 10) || 0 };
  }
  return { behind: null, ahead: null };
}

async function getLastCommit(pi: ExtensionAPI, dir: string): Promise<string | null> {
  const r = await pi
    .exec("git", ["log", "-1", "--format=%ci"], { cwd: dir, timeout: 3000 })
    .catch(() => null);
  return r?.stdout.trim() || null;
}

async function scanRepos(pi: ExtensionAPI): Promise<RepoState[]> {
  const results: RepoState[] = [];
  if (!fs.existsSync(ROOT)) return results;

  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(ROOT, entry.name);
    if (!isGitRepo(dir)) continue;

    const branch = await getBranch(pi, dir);
    const dirty = await isDirty(pi, dir);
    const ab = await getAheadBehind(pi, dir, branch);
    const lastCommitDate = await getLastCommit(pi, dir);

    let stale = false;
    if (lastCommitDate) {
      const d = new Date(lastCommitDate);
      stale = Date.now() - d.getTime() > 7 * 24 * 60 * 60 * 1000;
    }

    // Detect worktree: .git is a file (not dir) pointing elsewhere
    let isWorktree = false;
    try {
      const gitPath = path.join(dir, ".git");
      const stat = fs.statSync(gitPath);
      isWorktree = stat.isFile();
    } catch { /* ignore */ }

    results.push({
      name: entry.name,
      branch,
      dirty,
      behind: ab.behind,
      ahead: ab.ahead,
      stale,
      lastCommitDate,
      worktree: isWorktree,
    });
  }

  // Sort: dirty first, then worktrees, then alphabetically
  results.sort((a, b) => {
    if (a.dirty !== b.dirty) return a.dirty ? -1 : 1;
    if (a.worktree !== b.worktree) return a.worktree ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return results;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatRepoLine(r: RepoState, thm: any): string {
  const parts: string[] = [];

  // Dirty marker
  if (r.dirty) {
    parts.push(thm.fg("warning", "*"));
  } else {
    parts.push(" ");
  }

  // Worktree marker
  parts.push(r.worktree ? thm.fg("accent", "Ⓦ") : " ");

  // Stale marker (only if not dirty — dirty is more important)
  if (!r.dirty && r.stale) {
    parts.push(thm.fg("muted", "⏳"));
  } else {
    parts.push(" ");
  }

  // Repo name
  parts.push(thm.fg("text", r.name.padEnd(16)));

  // Branch
  const branchStr = r.branch.length > 14 ? r.branch.slice(0, 13) + "…" : r.branch;
  parts.push(thm.fg("dim", branchStr.padEnd(15)));

  // Ahead/behind
  const abParts: string[] = [];
  if (r.behind !== null && r.behind > 0) abParts.push(thm.fg("warning", `↓${r.behind}`));
  if (r.ahead !== null && r.ahead > 0) abParts.push(thm.fg("accent", `↑${r.ahead}`));
  parts.push(abParts.join(" "));

  return parts.join(" ");
}

function formatOverview(repos: RepoState[], thm: any, width: number): string[] {
  if (repos.length === 0) return [thm.fg("muted", "  No repos found in " + ROOT)];

  const dirtyCount = repos.filter((r) => r.dirty).length;
  const worktreeCount = repos.filter((r) => r.worktree).length;

  const lines: string[] = [];
  lines.push(
    thm.fg("dim", `  repos: ${repos.length}`) +
      (dirtyCount > 0 ? thm.fg("warning", `  dirty: ${dirtyCount}`) : "") +
      (worktreeCount > 0 ? thm.fg("accent", `  worktrees: ${worktreeCount}`) : ""),
  );
  lines.push(""); // blank separator

  for (const r of repos) {
    const line = "  " + formatRepoLine(r, thm);
    lines.push(truncateToWidth(line, width));
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
  let repos: RepoState[] = [];
  let scanning = false;

  async function refresh(ctx: ExtensionContext) {
    if (scanning) return;
    scanning = true;
    try {
      repos = await scanRepos(pi);
      // Update widget if we have UI
      if (ctx.hasUI) {
        updateWidget(ctx);
      }
    } finally {
      scanning = false;
    }
  }

  function updateWidget(ctx: ExtensionContext) {
    const thm = ctx.ui.theme;
    ctx.ui.setWidget(
      "worktrees",
      (_tui, _theme) => {
        return formatOverview(repos, thm, 120);
      },
      { placement: "belowEditor" },
    );
  }

  // ── Register command ────────────────────────────────────────────

  pi.registerCommand("worktrees", {
    description: "Show active git worktrees and branches across IA repos",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) return;

      await refresh(ctx);

      // Show full list in a custom overlay
      const thm = ctx.ui.theme;
      const lines = formatOverview(repos, thm, 100);

      const handle = ctx.ui.custom({
        render(width: number): string[] {
          const header = thm.bold("  Industrial Algebra — Worktrees & Branches");
          const subheader = thm.fg("dim", `  ${ROOT}`);
          const footer = thm.fg("muted", "  * = dirty  Ⓦ = worktree  ⏳ = stale (>7d)  ↓behind  ↑ahead  [Enter] to dismiss");

          const body: string[] = [];
          for (const r of repos) {
            body.push("  " + formatRepoLine(r, thm));
          }

          if (body.length === 0) {
            body.push(thm.fg("muted", "  No repos found."));
          }

          return [header, subheader, "", ...body, "", footer].map((l) =>
            truncateToWidth(l, width),
          );
        },
        handleInput(data: string) {
          if (data === "\r" || data === "\n" || data === "\x1b") {
            handle.close();
          }
        },
        invalidate() {},
      });
    },
  });

  // ── Session start: initial scan + set up widget ──────────────────

  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;
    await refresh(ctx);

    // Show a compact summary in the status bar
    const dirtyCount = repos.filter((r) => r.dirty).length;
    const thm = ctx.ui.theme;
    if (dirtyCount > 0) {
      ctx.ui.setStatus(
        "worktrees",
        thm.fg("warning", `⚠ ${dirtyCount} dirty repos — /worktrees for details`),
      );
    }
  });

  // ── Reload / resume: refresh ─────────────────────────────────────

  pi.on("resources_discover", async (_event, ctx) => {
    if (ctx.hasUI) await refresh(ctx);
  });
}
