---
name: ia-mdbook
description: Scaffold a deployable mdBook for an Industrial Algebra Rust crate with the IA Navy theme, standard chapter structure, and Netlify deploy config. Use when setting up documentation for an IA crate, or when the release polish checklist demands a deployable book.
---

# IA mdBook

## Overview

Scaffold a complete mdBook for an Industrial Algebra crate — theme, chapter
structure, stub pages, and deploy configuration. Produces what the release
polish checklist demands: a deployable, themed, multi-chapter book.

## When to Use

- Setting up documentation for a new IA crate
- Release polish checklist says "book missing" or "no deploy config"
- User says "set up mdBook" or "add docs book"

## Theme Reference

The IA theme is a Navy-based dark theme used across Schubert, Orlando, and
other IA crates. It is styled after IA-home's design language:

| Element | Value |
|---|---|
| Background | `#0a0a0f` (deep blue-black) |
| Accent | `#00cccc` (cyan) |
| Body font | Inter (Google Fonts) |
| Heading/code font | JetBrains Mono (Google Fonts) |
| Heading glow | `text-shadow` with cyan tint |
| Code blocks | `#0e0e16` background, `#1a1a25` border |
| Tables | Cyan header text, alternating row bg |

**IA-home variant:** For crates that want the pure IA-home look (black background
`#000`, brighter cyan `#00ffff`, custom JetBrains Mono IA font), adjust the CSS
variables in `custom.css`. The Schubert theme is the default for technical books;
use the IA-home variant for consumer-facing or brand-forward documentation.

## Workflow

### 1. Determine the Crate

Identify:
- Crate root (where `Cargo.toml` lives)
- Book title (usually the crate name, title-cased)
- Git repository URL (from `Cargo.toml` `[package].repository`)

### 2. Create Directory Structure

```bash
mkdir -p book/src/{concepts,guide,api,design,examples}
mkdir -p book/theme
```

```
book/
├── theme/
│   ├── custom.css
│   └── head.hbs
├── src/
│   ├── SUMMARY.md
│   ├── introduction.md
│   ├── getting-started.md
│   ├── concepts/
│   │   └── math.md
│   ├── guide/
│   │   ├── installation.md
│   │   └── feature-flags.md
│   ├── api/
│   │   └── overview.md
│   ├── design/
│   │   ├── security.md
│   │   ├── critique.md
│   │   └── roadmap.md
│   └── examples/
│       └── basic.md
├── book.toml
└── netlify.toml
```

### 3. Write book.toml

```toml
[book]
title = "Crate Name"
description = "One-line description of the crate"
authors = ["Industrial Algebra"]
language = "en"
src = "book/src"

[build]
build-dir = "book/book"

[output.html]
additional-css = ["book/theme/custom.css"]
default-theme = "navy"
preferred-dark-theme = "navy"
git-repository-url = "https://github.com/Industrial-Algebra/crate-name"
```

**Key config decisions:**
- `default-theme` and `preferred-dark-theme` MUST be `"navy"` — the CSS overrides style the Navy theme
- `git-repository-url` enables the "Edit on GitHub" link
- `build-dir` is `"book/book"` because netlify.toml expects it there

### 4. Write Theme Files

**book/theme/head.hbs** — Google Fonts preload:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**book/theme/custom.css** — Copy from `/home/elliotthall/.pi/agent/git/github.com/Industrial-Algebra/ia-toolkit/skills/ia-mdbook/theme/custom.css`.

The custom CSS defines:
- `.navy` CSS custom properties (colors)
- Typography: Inter body, JetBrains Mono headings/code
- Heading glow effects (h1, h2 text-shadow)
- Code block styling
- Table styling with cyan header
- Sidebar, blockquote, link hover effects

### 5. Write SUMMARY.md

The standard IA chapter structure (adapt to crate specifics):

```markdown
# Summary

- [Introduction](./introduction.md)
- [Getting Started](./getting-started.md)

# Concepts

- [Mathematical Foundation](./concepts/math.md)
- [Core Abstractions](./concepts/core.md)

# Guide

- [Installing and Configuring](./guide/installation.md)
- [Feature Flags](./guide/feature-flags.md)
- [API Patterns](./guide/api-patterns.md)

# API Reference

- [Overview](./api/overview.md)

# Design

- [Security Considerations](./design/security.md)
- [Critique & Future Work](./design/critique.md)
- [Roadmap](./design/roadmap.md)

# Examples

- [Basic Usage](./examples/basic.md)
```

**Minimum sections** (from release polish): Introduction, Getting Started, Concepts, Guide, API Reference, Design, Examples. Adapt chapter names to the crate's domain — a mathematical crate gets "Mathematical Foundation," a networking crate gets "Protocol Architecture."

### 6. Write Stub Pages

Each page gets a minimal stub. Example for `introduction.md`:

```markdown
# Introduction

**Crate Name** is a [one-line description].

## What It Does

Brief paragraph.

## Why It Exists

Motivation paragraph.

## Key Features

- Feature one
- Feature two
```

**Every stub MUST:**
- Have a `# Title` matching SUMMARY.md
- Contain at least one paragraph (not just a heading)
- Use the crate's actual domain terminology

### 7. Write netlify.toml

```toml
[build]
  command = "curl -sSL https://github.com/rust-lang/mdBook/releases/download/v0.4.40/mdbook-v0.4.40-x86_64-unknown-linux-gnu.tar.gz | tar -xz && ./mdbook build"
  publish = "book/book"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**Check the latest mdBook version** before writing. The v0.4.40 URL may need updating.
Use `curl -sI https://github.com/rust-lang/mdBook/releases/latest | grep location`
to find the current version.

### 8. Write GitHub Actions Docs Workflow

`.github/workflows/docs.yml`:

```yaml
name: Deploy Docs

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download mdBook
        run: |
          curl -sSL https://github.com/rust-lang/mdBook/releases/download/v0.4.40/mdbook-v0.4.40-x86_64-unknown-linux-gnu.tar.gz | tar -xz

      - name: Build book
        run: ./mdbook build

      - name: Deploy to Netlify
        run: |
          npm install -g netlify-cli
          netlify deploy --prod --dir=book/book --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

**Note:** This workflow needs `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` set in
GitHub repository secrets. The user must configure these manually.

### 9. Add Badge to README

Add a docs badge to the crate's README:

```markdown
[![Docs](https://img.shields.io/badge/docs-math.industrial--algebra.com-blue)](https://crate-name.industrial-algebra.com)
```

### 10. Verify

```bash
# Download mdBook if not installed
cargo install mdbook

# Build and check for errors
mdbook build

# Open locally
mdbook serve --open
```

Fix any broken links (SUMMARY.md references to non-existent files).

### 11. Commit

```bash
git add book/ book.toml netlify.toml .github/workflows/docs.yml
git commit -m "docs: add mdBook with IA Navy theme and Netlify deploy

- Standard IA chapter structure (Concepts, Guide, API, Design, Examples)
- Navy theme with Inter + JetBrains Mono, cyan accents
- Netlify deploy config with security headers
- GitHub Actions workflow for v* tag deploy"
```

## Theme Customization

### IA-Home Variant (Pure Black)

For crates wanting the exact IA-home website look, modify the CSS variables:

```css
.navy {
    --bg: #000;                     /* pure black instead of #0a0a0f */
    --fg: #e0e0e8;
    --sidebar-bg: #050508;          /* slightly lighter than bg */
    --sidebar-active: #00ffff;      /* brighter cyan */
    --links: #00ffff;               /* brighter cyan */
    --inline-code-color: #00ffff;
    --quote-border: #00ffff;
    --icons-hover: #00ffff;
    --searchresults-header-fg: #00ffff;
    --search-mark-bg: rgba(0, 255, 255, 0.2);
}
```

### Custom Font (IA-Home)

To use the IA-home custom font (if you have the font file):

1. Place `font.ttf` in `book/theme/`
2. Update `head.hbs` to include `@font-face` and reference it

## Common Pitfalls

| Mistake | Fix |
|---|---|
| `src` path in book.toml wrong | Must be `"book/src"` if book files are in `book/src/` |
| `build-dir` doesn't match netlify | netlify expects `publish = "book/book"` |
| Theme CSS doesn't load | Check `additional-css` path: `"book/theme/custom.css"` (relative to root) |
| SUMMARY.md links 404 | Every link must point to an existing `.md` file in `book/src/` |
| Stub pages are empty | Every page needs at least `# Title` + one paragraph |
| mdBook version hardcoded in netlify | Check for latest mdBook release, update URL |
| Forgot netlify.toml | Without it, docs deploy step will fail |

## Related Skills

- `/skill:ia-release-polish` — Documentation is step 3 of release polish
- `/skill:ia-coding-standards` — Book content should follow IA documentation patterns
