---
name: ia-gitflow
description: "Industrial Algebra's branch-and-release discipline for Rust workspaces: feature branches → develop → release branch → main → tag → publish, with two hard rules that keep the graphs joined. Use when starting feature work, opening PRs, cutting a release, or syncing branches after a release. Prevents the two failure modes that bit Schubert v0.4.0: direct pushes to develop, and squash-merged releases with no backmerge. Triggers: gitflow, branch strategy, open a PR, cut a release, release PR, backmerge, main to develop, sync branches, prepare release, publish workflow."
---

# IA Gitflow

## Overview

IA Rust repos (Schubert, Karpal, Amari, Cliffy, …) use a release-oriented
gitflow: work lands on `develop` via reviewed feature PRs, releases cut a
`release/*` branch onto `main`, a `v*` tag triggers the publish workflow, and a
**mandatory `main → develop` backmerge** rejoins the graphs afterward.

The discipline exists because two specific shortcuts have each caused real
damage. **Follow the hard rules.** A release that skips the backmerge looks
shipped but silently diverges `main` from `develop`, surfacing as a conflict at
the *next* release.

## When to Use

- Starting any feature/fix work → which branch, how to land it
- Opening a PR → base branch, what to verify
- Cutting a release → version bump, release branch, tag, publish
- After a release merges to `main` → the backmerge
- A release PR shows conflicts it "shouldn't" → you skipped a backmerge
- User says "open a PR", "cut a release", "backmerge", "sync develop"

## The Branch Model

```
            feature/* ──PR──▶ develop ──release PR──▶ release/v* ──PR──▶ main ──tag v*──▶ publish
                                ▲                                                        │
                                └────────────── backmerge (merge commit) ────────────────┘
```

- **`main`** — what shipped. Every commit here is a release or a release PR
  merge. Tagged `v*`. Protected.
- **`develop`** — integration branch for the *next* release. Protected.
- **`feature/*`** — one PR's worth of work, off `develop`, PR'd back to `develop`.
- **`release/v*`** — cut off `develop` for release-only commits (version bump
  already done, dating the changelog, last polish). PR'd to `main`.
- **`fix/*`** — bug fixes, same lifecycle as `feature/*`.

Toolkit/docs repos (e.g. `ia-toolkit`) are **trunk-based**: `feature/* → main`,
no `develop`. The hard rules still apply to `main`.

## Hard Rules

### Rule 1 — Never push directly to a protected branch

`develop` and `main` receive changes **only via merged PRs**. No `git push` to
either, ever — not "just a one-line fix", not "last-minute release tweak", not
"it's faster". Branch it, PR it, let CI run.

**Why:** Schubert v0.4.0 work was pushed straight to `develop`. CI never ran on
it. `develop` went red (broken format, dead doc-links, an ungated example) and
stayed red until the first proper PR surfaced it — blocking the release. The PR
flow isn't ceremony; it's what runs CI before code lands.

### Rule 2 — Every release to `main` is followed by a `main → develop` backmerge

After the release PR merges to `main`, **immediately backmerge `main` into
`develop`** using a **merge commit, never a squash**.

**Why:** Release PRs are commonly squash-merged (one tidy commit on `main`). A
squash creates a `main`-only commit that `develop`'s graph never contains, so
`main` and `develop` diverge the instant the squash lands. The divergence is
invisible until the *next* release PR — where it surfaces as a confusing
"how did this conflict?" against `main`. Schubert v0.3.0's release was
squash-merged with no backmerge; that latent debt caused the v0.4.0 release PR
to conflict against `main`.

The backmerge is the **last step of releasing**, not an optional chore. If you
tagged and published, you owe `develop` a backmerge.

### Rule 3 — Release-only commits live on a `release/*` branch

The release branch is the gitflow-correct home for release-specific commits —
dating the changelog, a final version touch — so they're **reviewed** (in the
release PR) rather than pushed straight to `develop` (which would violate Rule 1)
or buried in the squash. After the release, the backmerge carries them to
`develop`.

## Workflow

### Feature work

```bash
git checkout develop && git pull
git checkout -b feature/<short-scope>
# ... work, commit ...
git push -u origin feature/<short-scope>
gh pr create --base develop --head feature/<short-scope>
```

After review + green CI, merge (squash or merge commit — either is fine for
features; the backmerge rule only governs the release step).

### Rebasing a PR onto updated `develop`

If `develop` moved while your PR was open, rebase and force-push. With the IA
**dual-push** remote (GitHub + Forgejo mirror on `origin`), `--force-with-lease`
fails across the two mirrors ("stale info"). For a rebased feature branch:

```bash
git push origin feature/<branch> --force          # own branch, deliberate rebase
# mirror catches up too — verify if needed:
git push king-ghidorah feature/<branch> --force    # only if the mirror lagged
```

Plain pushes (new branches, merge commits) hit both mirrors fine; only rewritten
history needs `--force`.

### Releasing

1. **Version bump** — `/skill:ia-version-bump` on a branch off `develop`; PR to
   `develop`; merge. (Leave the CHANGELOG `## [X.Y.Z] — Unreleased` for now.)
2. **Cut the release branch** off the updated `develop`:
   `git checkout -b release/v<ver> origin/develop`.
3. **Date the changelog** on the release branch: `## [X.Y.Z] — <YYYY-MM-DD>`.
   Commit. Verify (`cargo check --all-features`, `cargo fmt --all --check`).
4. **Open the release PR** `release/v<ver> → main`. If it conflicts against
   `main`, that's a missed backmerge from the *last* release — merge `origin/main`
   into the release branch, resolve to the release branch's (superset) content,
   verify, push. See *Reconciling a conflicting release PR* below.
5. **Merge** the release PR to `main` (squash is conventional).
6. **Tag** `v<ver>` on the merge commit and push the tag → the repo's
   `publish.yml` (`on: push: tags: ['v*']`) publishes to crates.io.
7. **Backmerge** `main → develop` (Rule 2): branch off `develop`, `git merge
   origin/main`, resolve (usually one changelog-date line, take `main`'s), PR to
   `develop`, merge with a **merge commit**.
8. **Announce** via `/skill:ia-website`.

### Reconciling a conflicting release PR

A release PR that "shouldn't" conflict means a prior release skipped its
backmerge. Diagnose:

```bash
git merge-base --is-ancestor origin/main origin/develop \
  && echo "clean (FF possible)" || echo "DIVERGED — backmerge was skipped"
git log --oneline origin/develop..origin/main   # what main has that develop lacks
```

Almost always `develop`'s tree is a **strict superset** of `main`'s (it holds the
prior release's content plus new work). Verify before resolving:

```bash
git diff --stat origin/main origin/develop   # expect a few metadata files only
```

Resolve conflicted metadata files (CHANGELOG, Cargo.toml, Cargo.lock, README) to
the release branch's content, regenerate `Cargo.lock`, and run the **full
verification matrix** (fmt, clippy `--all-targets --all-features -D warnings`,
tests across all feature combos, `cargo doc --all-features`) before committing.
Don't assume the superset — confirm with `git diff` per file.

## Common Pitfalls

| Shortcut | Symptom | Fix |
|---|---|---|
| Push straight to `develop` | `develop` red; CI never ran on the change | Rule 1 — always feature branch + PR |
| Squash-merge release, no backmerge | Next release PR conflicts against `main` | Rule 2 — backmerge `main → develop` (merge commit) every release |
| Date changelog by pushing to `develop` | Violates Rule 1; also re-stales if reverted | Rule 3 — date it on the `release/*` branch |
| Backmerge as a squash | Graphs *still* don't join; divergence persists | Backmerge with a **merge commit** |
| `--force-with-lease` on dual-push | "stale info" rejection from the Forgejo mirror | `--force` for rebased own branches |
| Tag on `develop` instead of `main` | `publish.yml` doesn't fire (or fires on unreleased code) | Tag the `main` merge commit |
| Forget `required-features` on a gated example | Example fails `cargo test` under default features | Gate every feature-dependent example in Cargo.toml |

## Optional Enforcement

A local `pre-push` hook blocks accidental pushes to `develop`/`main` (Rule 1 at
the machine, not just the mind). Opt-in per clone:

```bash
cat > .git/hooks/pre-push <<'EOF'
#!/usr/bin/env bash
while read local_ref local_sha remote_ref remote_sha; do
  case "$remote_ref" in
    refs/heads/develop|refs/heads/main|refs/heads/master)
      echo "ia-gitflow: direct push to $remote_ref blocked (use a PR)." >&2
      exit 1 ;;
  esac
done
EOF
chmod +x .git/hooks/pre-push
```

This catches the most common slip. It does **not** replace Rule 2 (the backmerge)
— that's a release-process check, not a push check.

## Verification Before Claiming Done

Before declaring a PR mergeable or a release shipped, run the actual commands and
read their output (per `/skill:verification-before-completion`):

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features          # and each feature combo the CI matrix covers
cargo doc --all-features --no-deps # zero "unresolved link"
```

`cargo fmt --all` formats feature-gated files too — never use standalone
`rustfmt --edition` (it disagrees with cargo-fmt's style).

## Related Skills

- `/skill:ia-version-bump` — the version + CHANGELOG step that precedes the release branch
- `/skill:ia-release-polish` — full release checklist (publish + tag = "shipped")
- `/skill:ia-website` — the post-release announcement (step 8)
- `/skill:ia-forgejo-mirror` — the dual-push remote this skill assumes
- `/skill:ia-coding-standards` — what the verification matrix is protecting
