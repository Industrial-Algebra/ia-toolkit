# ia-toolkit

Pi package with skills, extensions, and themes for the [Industrial Algebra](https://github.com/Industrial-Algebra) Rust ecosystem, plus media-production tooling for creating IA informational and promotional videos.

## Skills

### Development

| Skill | Description |
|---|---|
| `ia-workspace-new-crate` | Scaffold a new sub-crate inside an IA workspace with correct boilerplate |
| `ia-clippy-hammer` | Systematic zero-warning clippy fix across all feature combinations |

### Release & Quality

| Skill | Description |
|---|---|
| `ia-version-bump` | Coordinate version bumps across multi-crate workspaces |
| `ia-ecosystem-audit` | Audit a crate against IA coding standards — produces pass/fail report |

> **Note:** `ia-coding-standards` and `ia-release-polish` are available via [pi-superpowers](https://github.com/coctostan/pi-superpowers).

### Documentation & Tooling

| Skill | Description |
|---|---|
| `ia-mdbook` | Scaffold deployable mdBook with IA Navy theme and Netlify config |
| `ia-mcp-manifest` | Generate and validate TOML manifests for IA-MCP / amari-mcp servers |
| `ia-website` | Integrate with industrialalgebra.com — release announcements, content publishing, design system |

### Media Production

Provision a workstation for AI-driven media production (Comfy Cloud + local ComfyUI, Blender, DaVinci Resolve Studio). The setup skill installs the comfy & blender skill packs from upstream and registers the provider MCP servers — the lean path that keeps ia-toolkit free of vendored third-party content.

| Skill | Description |
|---|---|
| `ia-media-setup` | Provision/refresh a workstation: detect installs, fetch comfy & blender skills from upstream, register provider MCP servers, print manual steps |

Provider MCPs (registered by `ia-media-setup`): Comfy Cloud, local ComfyUI (`comfyui-mcp`), Blender (`blender-mcp`), DaVinci Resolve Studio (`davinci-resolve-mcp`, Studio-only). All upstream skills and MCPs are MIT-licensed.

## Install

```bash
# From git (recommended)
pi install git:github.com/Industrial-Algebra/ia-toolkit

# From local path (development)
pi install ./path/to/ia-toolkit
```

## Adding a Skill

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: What it does and when to use it.
---

# My Skill

...
```

2. That's it. Pi auto-discovers `SKILL.md` directories recursively.

## License

MIT — see [LICENSE](LICENSE).
