---
name: ia-website
description: Integrate Industrial Algebra projects with the IA website (industrialalgebra.com). Covers release announcements via reusable GitHub Actions workflow, content publishing (blog posts and papers) via the admin API, reusing the IA design system (CSS custom properties, fonts, visual identity), and content format conventions. Use when setting up release announcements for an IA crate, publishing a blog post or paper from any IA project, or building a project website that matches the IA brand.
---

# IA Website

## Overview

Industrial Algebra's website at **industrialalgebra.com** is the public face of
the ecosystem. It hosts blog posts, academic papers, and the IA design system.
Every IA project should integrate with it for release announcements and brand
consistency. This skill covers all integration patterns.

## When to Use

- Setting up auto-publish release announcements for a crate
- Writing and publishing a blog post or paper from an IA project
- Building a project website that matches the IA visual identity
- User says "publish this release" or "create a blog post for this"
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

### 2. Manual Content Publishing

For one-off blog posts, milestone announcements, or papers, use the publish
script from the I⊗A website repo.

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

#### Publishing Commands

From the IA-home repo directory:

```bash
# Publish a blog post
npm run publish:post -- content/posts/my-post.md

# Publish a paper
npm run publish:paper -- content/papers/my-paper.md

# Preview locally (offline — no backend needed)
npm run preview -- content/posts/my-post.md
npm run preview -- content/papers/my-paper.md
```

**Publish requirements:**
- `ADMIN_API_KEY` in `IA-home/.env`
- `python3` with `PyYAML` (`pip install pyyaml`)
- Node.js (for npm scripts)

**Preview requirements:**
- `pandoc` (for markdown → HTML rendering)
- `python3` with `PyYAML`
- No backend or database needed — renders to `content/.preview/` and opens in browser

#### Admin API (Direct)

If you need to publish programmatically from outside the IA-home repo:

```
POST https://industrialalgebra.com/api/admin/posts
POST https://industrialalgebra.com/api/admin/papers
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json

{
  "title": "My Post Title",
  "body": "# Markdown content here\n\n...",
  "slug": "my-post",
  "excerpt": "Optional excerpt",
  "tags": ["rust", "announcement"]
}
```

**Public read endpoints (no auth):**
```
GET /api/blog/posts              # list (paginated: ?page=&per_page=)
GET /api/blog/posts/{slug}       # detail
GET /api/papers                  # list
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
| Frontend | Leptos 0.8 (CSR), compiled to WASM |
| Backend | Axum 0.8, port 3001 |
| Database | PostgreSQL (sqlx) |
| Dev server | Vite on port 3000, proxies API to backend |
| Production | DigitalOcean droplet, systemd, Let's Encrypt + rustls |
| Tailnet | Tailscale at `norma-wall.tail0311a1.ts.net:3000` |

#### Environment

```bash
# Required for publishing
ADMIN_API_KEY=<api-key>

# Required for backend development
DATABASE_URL=postgresql:///industrial_algebra?host=/var/run/postgresql

# Vite allowed hosts for Tailscale access
VITE_ALLOWED_HOSTS=localhost,norma-wall.tail0311a1.ts.net,norma-wall
```

## Quick Reference

```bash
# Publish content from IA-home repo
npm run publish:post -- content/posts/my-post.md
npm run publish:paper -- content/papers/my-paper.md
npm run preview -- content/posts/my-post.md

# Test locally
npm run dev              # starts Vite + frontend watcher + backend

# Build for production
npm run build
```

## Common Pitfalls

| Mistake | Fix |
|---|---|
| Forgot `IA_BLOG_API_KEY` secret | Add to repo Secrets → Actions |
| Wrong `product_name` in workflow | Must match display name, used in blog title |
| Missing `tags` in frontmatter | Posts without tags won't show in filtered views |
| Frontmatter YAML not between `---` lines | Must be exactly `---` on its own line, before and after |
| Paper missing `authors` or `abstract` | Both are required for paper type |
| `ADMIN_API_KEY` not in `.env` | Set it or the publish script will fail with a clear error |
| Using IA-home CSS variables but not loading the font | Add `@font-face` and copy `font.ttf` |

## Related Skills

- `/skill:ia-version-bump` — Version bumps should trigger release announcements
- `/skill:ia-release-polish` — After polishing, announce the release
- `/skill:ia-mdbook` — The book theme is a variant of the IA design system
- `/skill:ia-coding-standards` — Content should match IA technical precision
