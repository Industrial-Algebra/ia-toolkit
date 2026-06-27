---
name: ia-website
description: Integrate Industrial Algebra projects with the IA website (industrialalgebra.com). Covers the full content lifecycle (create, preview, update, delete) via admin API and publish scripts, release announcements via reusable GitHub Actions workflow, reusing the IA design system (CSS custom properties, fonts, visual identity), and content format conventions. Other agent sessions can fully manage blog posts and papers — no SSH or DB access needed, just the ADMIN_API_KEY. Use when setting up release announcements for an IA crate, publishing/updating/deleting a blog post or paper from any IA project, or building a project website that matches the IA brand.
---

# IA Website

## Overview

Industrial Algebra's website at **industrialalgebra.com** is the public face of
the ecosystem. It hosts blog posts, academic papers, and the IA design system.
The backend (Axum + PostgreSQL) exposes a full admin API — create, update,
delete — behind Bearer-token auth. Other agent sessions can manage content
autonomously: clone the IA-home repo, set `ADMIN_API_KEY`, and use the npm
scripts or direct curl calls. No SSH access or database credentials are needed.

Every IA project should integrate with it for release announcements and brand
consistency. This skill covers all integration patterns.

## When to Use

- Setting up auto-publish release announcements for a crate
- Writing and publishing a blog post or paper from an IA project
- Updating or deleting existing blog posts or papers
- Previewing content before publishing (offline HTML render with real CSS)
- Building a project website that matches the IA visual identity
- User says "publish this release" or "create a blog post for this"
- User says "update the paper" or "fix the blog post" or "delete that announcement"
- User says "make this look like the IA website"

## Integration Patterns

### 1. Release Announcements (Recommended)

The primary pattern: every IA crate should auto-publish a blog post to
industrialalgebra.com when a new version is released. This is done via a
reusable GitHub Actions workflow.

**Add to your crate's release workflow** (e.g., `.github/workflows/publish.yml`):

```yaml
name: Publish

on:
  push:
    tags: ['v*']

jobs:
  cargo-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo publish --token ${{ secrets.CARGO_REGISTRY_TOKEN }}

  announce:
    needs: cargo-publish
    uses: Industrial-Algebra/IA-home/.github/workflows/release-announce.yml@main
    with:
      product_name: "Your Crate Name"
      version: ${{ github.ref_name }}
      release_notes: ${{ github.event.release.body }}
    secrets:
      ADMIN_API_KEY: ${{ secrets.IA_BLOG_API_KEY }}
```

**What it does:** When you push a `v*` tag, the workflow:
1. Publishes to crates.io (your existing publish job)
2. Creates a blog post on industrialalgebra.com with the release notes
3. Title: "Your Crate Name v0.2.0 Released"
4. Tags: `release, Your Crate Name`

**Setup:**
1. Add the `announce` job to your `.github/workflows/publish.yml`
2. Set `product_name` to your crate's display name
3. Add `IA_BLOG_API_KEY` secret to your repo (ask the IA admin for the key)
4. Ensure your release workflow triggers on `v*` tags

**Required GitHub secret:**
```
IA_BLOG_API_KEY = <admin-api-key-for-industrialalgebra.com>
```

### 2. Content Lifecycle (Create / Preview / Update / Delete)

The IA website supports the full content lifecycle for blog posts and papers.
Other agent sessions can manage content autonomously — clone the IA-home repo,
set `ADMIN_API_KEY`, and use the npm scripts. No SSH or database access needed.

#### Quick Start (from any machine)

```bash
git clone https://github.com/Industrial-Algebra/IA-home.git
cd IA-home

# Set env vars for production publishing
export BASE_URL=https://industrialalgebra.com
export ADMIN_API_KEY=<the production key>

# Or, for local dev: run `npm run dev` in another terminal and omit BASE_URL
```

#### The Seven Commands

| Command | What it does |
|---|---|
| `npm run publish:post -- <file>` | Create a blog post from a markdown file |
| `npm run publish:paper -- <file>` | Create a paper landing page from a markdown file |
| `npm run preview -- <file>` | Render to standalone HTML with real CSS (no backend/DB) — **check before publishing** |
| `npm run update:post -- <file>` | Update an existing blog post in place (by slug from frontmatter) |
| `npm run update:paper -- <file>` | Update an existing paper in place (by slug from frontmatter) |
| `npm run delete:post -- <slug>` | Delete a blog post by its slug |
| `npm run delete:paper -- <slug>` | Delete a paper by its slug |

**Requirements:** `python3` with `PyYAML` (`pip install pyyaml`). For preview: also `pandoc`.

#### Full Workflow

```bash
# 1. Write content (markdown + YAML frontmatter)
vim content/posts/my-post.md

# 2. Preview how it will look (offline, no backend writes)
npm run preview -- content/posts/my-post.md

# 3. Publish to production
npm run publish:post -- content/posts/my-post.md

# 4. Verify it's live
curl https://industrialalgebra.com/api/blog/posts/my-post

# 5. Fix a typo or update content (in-place, preserves slug/id/created_at)
npm run update:post -- content/posts/my-post.md

# 6. Remove entirely (takes the slug string, NOT a file path)
npm run delete:post -- my-post
```

#### Blog Posts

Create a markdown file with YAML frontmatter:

```markdown
---
title: My Blog Post Title
slug: my-post-slug          # optional, auto from title
excerpt: A short summary    # optional, auto from first paragraph
tags: [rust, announcement]  # optional
published_date: 2026-06-15  # optional, defaults to today
---

Content goes here in **markdown**.

## Section

Code blocks, tables, lists — all standard markdown.
```

**Required frontmatter fields:** `title`

**Auto-generated fields (if omitted):**
- `slug` — lowercased, hyphenated title
- `excerpt` — first paragraph of the body
- `published_date` — today's date

#### Academic Papers

Papers support all blog post fields plus academic metadata:

```markdown
---
title: A Novel Approach to Schubert Calculus
authors: [Jane Doe, John Smith]
affiliations: [Industrial Algebra, University of X]
abstract: |
  We present a novel approach to Schubert calculus
  that dramatically reduces computation time.
doi: 10.5281/zenodo.123
arxiv_id: 2606.12345
tags: [math, schubert, paper]
links:
  - label: Paper
    url: https://arxiv.org/abs/2606.12345
  - label: Code
    url: https://github.com/Industrial-Algebra/Schubert
bibtex: |
  @article{doe2026,
    title={A Novel Approach to Schubert Calculus},
    author={Doe, Jane and Smith, John},
    year={2026}
  }
teaser_image_url: https://example.com/teaser.png
---

# Abstract

Content starts here. The abstract in the frontmatter renders
in the academic landing page format — the body is the full text.
```

**Paper-specific frontmatter:**
| Field | Required | Description |
|---|---|---|
| `authors` | Yes | List of author names |
| `affiliations` | No | List of affiliations (same order as authors) |
| `abstract` | Yes | Full abstract text (supports multiline `\|`) |
| `doi` | No | DOI URL or identifier |
| `arxiv_id` | No | arXiv identifier |
| `bibtex` | No | BibTeX citation (multiline `\|`) |
| `links` | No | List of `{label, url}` objects |
| `teaser_image_url` | No | Hero image URL |

#### Update and Delete Details

**Update (`update:post` / `update:paper`):** Reads the slug from frontmatter (or derives from title) and PUTs new content. Preserves `id`, `slug`, and `created_at`; replaces `title`/`body`/other fields; bumps `updated_at`. Returns 404 if the slug doesn't exist yet — publish it first. The slug in your frontmatter must match the post you intend to update.

**Delete (`delete:post` / `delete:paper`):** Takes a **slug string** (e.g. `welcome-to-the-blog`), not a file path. Calls the admin DELETE endpoint. Returns 204 on success, 404 if not found.

To fix a published post you have two options:
1. `update:post <file>` — in-place update, preserves slug/created_at (usually what you want)
2. `delete:post <slug>` then `publish:post <file>` — fresh create with new slug/id

#### Admin API (Full CRUD)

All admin endpoints require `Authorization: Bearer <ADMIN_API_KEY>`. Auth failures: 401 (bad/missing key), 500 (`ADMIN_API_KEY` not configured on server), 503 (DB down).

| Method | Path | Effect | Success |
|---|---|---|---|
| POST | `/api/admin/posts` | Create blog post. Body: `{title, body, slug?, excerpt?, tags?}` | 201 + created post |
| POST | `/api/admin/papers` | Create paper. Body: `{title, body, authors, affiliations?, abstract?, doi?, arxiv_id?, tags?, links?, bibtex?, ...}` | 201 + created paper |
| PUT | `/api/admin/posts/{slug}` | Update blog post in place. Body: `{title, body, excerpt?, tags?}` (no slug — in URL). Preserves id/created_at, bumps updated_at. | 200 + updated post |
| PUT | `/api/admin/papers/{slug}` | Update paper in place. Same body shape as POST (minus slug). | 200 + updated paper |
| DELETE | `/api/admin/posts/{slug}` | Delete blog post by slug. | 204 |
| DELETE | `/api/admin/papers/{slug}` | Delete paper by slug. | 204 |

Direct curl works for everything:

```bash
# Create
curl -X POST https://industrialalgebra.com/api/admin/posts \
  -H "Authorization: Bearer $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"# markdown"}'

# Update
curl -X PUT https://industrialalgebra.com/api/admin/posts/hello \
  -H "Authorization: Bearer $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"Hello (updated)","body":"# fixed typo"}'

# Delete
curl -X DELETE https://industrialalgebra.com/api/admin/posts/hello \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

**Public read endpoints (no auth):**
```
GET /api/blog/posts              # list (paginated: ?page=&per_page=)
GET /api/blog/posts/{slug}       # detail (full body)
GET /api/papers                  # list (paginated)
GET /api/papers/{slug}           # detail (academic landing page format)
```

### 3. IA Design System

Projects that build their own websites should use the IA visual identity.
The design system lives in `IA-home/styles.css` and defines CSS custom properties.

#### CSS Variables

```css
:root {
    --bg-primary: #000;                    /* Pure black background */
    --bg-surface: rgba(255,255,255,0.018); /* Subtle surface elevation */
    --border-color: rgba(0,255,255,0.15);  /* Cyan-tinted borders */
    --border-glow: rgba(0,255,255,0.2);    /* Glowing borders */
    --text-primary: rgba(225,255,255,1);   /* Main text */
    --text-secondary: rgba(175,175,175,1); /* Secondary text */
    --text-dimmed: rgba(110,110,110,1);    /* Dimmed/muted text */
    --accent: rgba(0,255,255,1);           /* Cyan accent (#00ffff) */
    --accent-dim: rgba(0,200,200,1);       /* Dimmed cyan */
    --font-mono: 'JetBrains Mono IA', 'JetBrains Mono', monospace;
    --content-width: 860px;
}
```

**To reuse in a new project:**

1. Copy `IA-home/styles.css` to your project
2. Use the CSS variables throughout your stylesheets
3. Load the custom font:

```css
@font-face {
    font-family: 'JetBrains Mono IA';
    src: url('/font.ttf') format('truetype');
    font-weight: 400 700;
    font-style: normal;
    font-display: swap;
}
```

4. Copy the font file from `IA-home/frontend/src/font.ttf`

#### Visual Identity Checklist

| Element | Value |
|---|---|
| Background | `#000` (pure black) — never gray or dark blue |
| Accent color | `#00ffff` (cyan) — use sparingly on interactive elements |
| Body font | JetBrains Mono IA (monospace for everything) |
| Border style | Thin cyan-tinted borders (`rgba(0,255,255,0.15)`) |
| Glow effects | Cyan text-shadow or box-shadow for headings/brand |
| Content width | 860px max-width, centered |
| Logo | I⊗A — tensor product symbol in cyan |

#### Brand Usage

The I⊗A logo and brand guidelines:
- **Logo text:** `I⊗A` (capital I, U+2297 CIRCLED TIMES, capital A)
- **Full name:** Industrial Algebra
- **Domain:** industrialalgebra.com
- **Color:** `#00ffff` (cyan) on black
- **Font:** JetBrains Mono (medium weight for body, bold for headings)

#### Relationship to mdBook Theme

The IA mdBook theme (in `/skill:ia-mdbook`) is a Navy-based variant designed
for documentation readability. The full IA-home design (pure black, brighter
cyan, monospace-only) is for consumer-facing websites. Use the mdBook theme
for docs; use the IA-home design system for product websites.

### 4. Content Guidelines

#### Post Types and When to Use

| Type | Use Case | Example |
|---|---|---|
| Release announcement | Every crate version bump | "Amari v0.2.0 Released" |
| Technical blog post | Deep dives, tutorials, case studies | "Schubert Calculus for Access Control" |
| Paper | Academic publications, preprints | "A Novel Approach to Hyperdimensional Memory" |
| Ecosystem update | Cross-project news, roadmap updates | "Industrial Algebra Q2 2026 Update" |

#### Writing Style

- **Technical, precise, minimal** — no marketing fluff
- **Code blocks** required for technical posts
- **Performance numbers** with benchmarks when claiming improvements
- **Links** to GitHub repos, crates.io, docs.rs
- **Tags** always include the project name and `release` for announcements

#### Example: Release Post Structure

```markdown
---
title: ProjectName v0.1.0 Released
tags: [release, ProjectName]
---

ProjectName v0.1.0 is now available.

## Killer Feature

Brief description + code example.

## What Changed

- Bullet list of changes

## Performance

| Metric | Before | After |
|--------|--------|-------|

Full changelog: [link]
```

### 5. Deployment & Infrastructure

#### IA-Home Stack (for reference)

| Layer | Technology |
|---|---|
| Frontend | Leptos 0.8 (CSR), compiled to WASM via wasm-pack |
| Backend | Axum 0.8, port 3001 (dev) / 443 (prod with Let's Encrypt) |
| Database | PostgreSQL (sqlx, peer auth via Unix socket in dev) |
| Dev server | Vite on port 3000, proxies `/api` to backend |
| Production | DigitalOcean droplet, systemd service, rustls (ring backend) |
| Tailnet | Tailscale at `norma-wall.tail0311a1.ts.net:3000` |
| Content | Markdown files in `content/posts/` and `content/papers/` |

#### Environment

```bash
# Required for publishing to production
export BASE_URL=https://industrialalgebra.com
export ADMIN_API_KEY=<api-key>

# Required for local backend development
DATABASE_URL=postgresql:///industrial_algebra?host=/var/run/postgresql
```

**Note:** The `ADMIN_API_KEY` is the single credential needed for any agent to
manage content. No database password, SSH key, or server access is required.
The API key is set as an environment variable on the production server and
must be shared out-of-band with agents that need to publish.

## Quick Reference

```bash
# Full content lifecycle from IA-home repo
npm run preview -- content/posts/my-post.md           # check before publishing
npm run publish:post -- content/posts/my-post.md      # create
npm run update:post -- content/posts/my-post.md       # update in place
npm run delete:post -- my-post                        # remove by slug
npm run publish:paper -- content/papers/my-paper.md   # create paper
npm run update:paper -- content/papers/my-paper.md    # update paper
npm run delete:paper -- my-paper                      # remove paper by slug

# Test locally
npm run dev              # starts Vite (:3000) + frontend watcher + backend (:3001)

# Build for production
npm run build
```

## Agent-First Design

The IA website is designed for agent sessions to manage content autonomously.
The `AGENTS.md` in the IA-home repo documents the full agent workflow. Key
principles:

- **No SSH or DB access needed** — just `ADMIN_API_KEY` and the npm scripts
- **Preview before publishing** — `npm run preview` renders offline with real CSS
- **Idempotent updates** — `PUT` preserves slug/id/created_at, bumps updated_at
- **Slug-based operations** — delete and update reference the slug, not internal IDs
- **Seed data is neutral** — `init_database` uses `ON CONFLICT DO NOTHING`, won't clobber real content

## Common Pitfalls

| Mistake | Fix |
|---|---|
| Forgot `IA_BLOG_API_KEY` secret | Add to repo Secrets → Actions |
| Wrong `product_name` in workflow | Must match display name, used in blog title |
| Update returns 404 | Publish first — update only works on existing slugs. Check your frontmatter slug matches. |
| Delete takes a slug not a file | `delete:post my-slug` not `delete:post content/posts/file.md` |
| Duplicate slug on publish | Returns 500 — update or delete the old one first |
| Missing `tags` in frontmatter | Posts without tags won't show in filtered views |
| Frontmatter YAML not between `---` lines | Must be exactly `---` on its own line, before and after |
| Paper missing `authors` or `abstract` | Both are required for paper type |
| `ADMIN_API_KEY` not in `.env` or exported | Set it or the publish script will fail with a clear error |
| Using IA-home CSS variables but not loading the font | Add `@font-face` and copy `font.ttf` |
| Preview needs pandoc | `apt install pandoc` or `brew install pandoc` — only needed for preview, not publish |

## Related Skills

- `/skill:ia-version-bump` — Version bumps should trigger release announcements
- `/skill:ia-release-polish` — After polishing, announce the release
- `/skill:ia-mdbook` — The book theme is a variant of the IA design system
- `/skill:ia-coding-standards` — Content should match IA technical precision
