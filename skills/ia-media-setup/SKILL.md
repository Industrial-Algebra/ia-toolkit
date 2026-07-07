---
name: ia-media-setup
description: Provision a workstation for AI-driven media production — Comfy Cloud + local ComfyUI, Blender, and DaVinci Resolve Studio. Installs/refreshes the comfy and blender skills from upstream into ~/.pi/agent/skills/, registers the provider MCP servers in mcp.json, detects local installs (ComfyUI, Blender, Resolve), and prints the remaining manual steps. Use when setting up a new IA workstation for producing informational/promotional videos, or to refresh the media skills and MCP config.
license: MIT
metadata:
  author: Industrial Algebra
  version: "1.0.0"
  domain: media-production
  role: setup
---

# IA Media Setup

## Overview

Provision a workstation for AI-driven media production — the toolchain for producing
**informational and promotional videos about Industrial Algebra research and projects**.
Three provider MCPs, each with a skills pack:

| Tool | Provider MCP | Skills source | Drives |
|---|---|---|---|
| Comfy Cloud | `comfy-cloud` (HTTP, OAuth) | [Comfy-Org/comfy-skills](https://github.com/Comfy-Org/comfy-skills) | cloud GPUs (image/video/audio/3D) |
| Local ComfyUI | `comfyui-local` (`npx comfyui-mcp`) | (shares comfy skills) | your GPU |
| Blender | `blender` (`uvx blender-mcp`) | [arjun988/blender-skills](https://github.com/arjun988/blender-skills) | live Blender via addon |
| DaVinci Resolve | `davinci-resolve` (`npx davinci-resolve-mcp setup`) | *(none upstream)* | live Resolve **Studio** only |

This skill is **lean**: it ships no third-party content. It fetches the skills fresh from
upstream on each workstation and reconciles the MCP config, so ia-toolkit stays pure
IA-owned MIT content and the skills are always current. All upstreams are MIT.

Helper scripts live in this skill's `scripts/` directory (next to this `SKILL.md`).

## When to Use

- Setting up a new workstation for IA media production
- Refreshing comfy/blender skills to the latest upstream
- Adding or reconciling provider MCP servers after installing Blender/ComfyUI/Resolve
- After a `pi install`/refresh of ia-toolkit on a fresh machine

## Prerequisites

- `pi` with the `git:github.com/Industrial-Algebra/ia-toolkit` package installed (you have it
  — that's how this skill reached you).
- `git`, `python3`, and either `npx` (Node ≥18) or `uvx` (uv) depending on which MCPs you want.
- The DCC apps themselves (ComfyUI, Blender, Resolve) installed to use their MCPs — this skill
  detects them and tells you what's missing rather than failing.

## Workflow

Run the steps below. The scripts are idempotent — re-running refreshes skills and reconciles
MCP config without duplicating. All paths assume you run from **this skill's directory**
(the directory containing this `SKILL.md`).

### 1. Detect what's on this workstation

```bash
bash scripts/detect.sh
```

Reads: `NPX`, `UVX` (full path), `COMFYUI`, `BLENDER`, `RESOLVE`, `RESOLVE_EDITION`,
`PI_AGENT_DIR`, `MCP_JSON`, etc. **Use the detected `UVX` full path in step 3** (GUI-launched
clients don't always inherit `$PATH`). Note `RESOLVE_EDITION`: if it says `free`, the live
Resolve MCP is blocked (Studio only) — skip Resolve.

### 2. Install / refresh the skills from upstream

```bash
bash scripts/install-comfy-skills.sh     # -> ~/.pi/agent/skills/comfy-skills/  (12 skills)
bash scripts/install-blender-skills.sh   # -> ~/.pi/agent/skills/blender-skills/(23 skills + references/)
```

Both accept an optional target-dir argument and `COMFY_SKILLS_REPO` / `BLENDER_SKILLS_REPO`
env overrides. Comfy skills are *ported* (frontmatter + `$ARGUMENTS` handling — see the script
header); blender skills are copied verbatim (already Agent-Skills-compliant). Resolve has no
upstream skills pack — nothing to install there.

### 3. Register the provider MCP servers (idempotent merge)

Build a `servers-to-ensure.json` from the detection results, then merge it into the local
`mcp.json`. Always include `comfy-cloud`. Add `comfyui-local` if `NPX` is present. Add
`blender` if `UVX` is present (use its **full path** as `command`). **Do not** add a static
`davinci-resolve` entry — its installer is interactive (see step 5).

Template (`UVX_PATH` = detected `UVX`, e.g. `/home/you/.local/bin/uvx`):

```json
{
  "mcpServers": {
    "comfy-cloud": { "url": "https://cloud.comfy.org/mcp", "lifecycle": "lazy" },
    "comfyui-local": { "command": "npx", "args": ["-y", "comfyui-mcp"], "lifecycle": "lazy" },
    "blender": {
      "command": "UVX_PATH",
      "args": ["--python", "3.11", "blender-mcp"],
      "env": {
        "BLENDER_HOST": "localhost", "BLENDER_PORT": "9876",
        "UV_PYTHON_PREFERENCE": "only-managed", "DISABLE_TELEMETRY": "true"
      },
      "lifecycle": "lazy"
    }
  }
}
```

Then merge (default keeps any existing entries so per-machine tweaks survive; use `--force`
to overwrite with the template on a refresh):

```bash
python3 scripts/merge-mcp.py "$MCP_JSON" servers-to-ensure.json
```

### 4. Validate

```bash
python3 -m json.tool "$MCP_JSON" >/dev/null && echo "mcp.json: valid"
ls "$HOME/.pi/agent/skills/comfy-skills/" | grep -c SKILL.md   # expect 12 dirs, each w/ SKILL.md
find "$HOME/.pi/agent/skills/blender-skills/" -name SKILL.md | wc -l   # expect 23
```

Confirm the MCP servers you added appear under `mcpServers` in `$MCP_JSON`.

### 5. Print the remaining MANUAL steps (per tool)

These cannot be automated — surface them clearly to the user:

- **Restart pi** — skills and MCP servers load at startup.
- **Comfy Cloud** (one-time): `/mcp-auth comfy-cloud` to complete OAuth.
- **Local ComfyUI**: start it when using — `cd <COMFYUI> && python main.py --port 8188`.
- **Blender** (one-time + each session): install [`addon.py`](https://github.com/ahujasid/blender-mcp/raw/main/addon.py)
  via *Edit → Preferences → Add-ons → Install…*, enable **Blender MCP**, then in the viewport
  press **N → BlenderMCP → Connect to Claude** (socket on `localhost:9876`). Blender must be
  open + connected whenever the blender skills are used.
- **DaVinci Resolve** (Studio only): install Resolve **Studio**, launch it, set
  *Preferences → General → External scripting using → Local*, then run
  `npx davinci-resolve-mcp setup` (interactive — it detects Resolve paths and writes the
  client config itself). The **free edition disables external scripting**, so the live MCP
  won't work on free — only the package's offline `davinci-resolve-advanced-mcp` server
  (file-level `.drp/.drt/.drx` ops, no live control) runs on free.

## Idempotency

Re-running this skill is safe and is the intended way to refresh: the install scripts
overwrite the skill dirs with the latest upstream, and `merge-mcp.py` only adds missing
servers (pass `--force` to also overwrite existing server entries).

## Common Pitfalls

| Mistake | Fix |
|---|---|
| Using a bare `uvx` as `command` | Use the **full path** from `detect.sh` (`UVX=…`) — GUI/launched clients may not have it on `$PATH` |
| Adding a static `davinci-resolve` mcp.json entry | Don't — run `npx davinci-resolve-mcp setup` instead; it's interactive and path-detecting |
| Expecting the Resolve MCP to work on free Resolve | It can't — external scripting is Studio-only. Buy Studio, or use only the offline advanced server |
| Forgetting to restart pi after first setup | Skills + MCP load at startup; restart to see them |
| Not clicking "Connect" in the Blender addon | The `blender` MCP is lazy but will error on first call if the socket server isn't running inside Blender |
| Vendoring the skills into ia-toolkit instead | This skill installs them from upstream on purpose — keeps ia-toolkit lean & always-current |

## Upstream references (all MIT)

- [Comfy-Org/comfy-skills](https://github.com/Comfy-Org/comfy-skills) © 2026 Comfy-Org — comfy skills source (`claude-code/commands/`)
- [arjun988/blender-skills](https://github.com/arjun988/blender-skills) © arjun988 — blender skills source (`.claude/skills/`)
- [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) © 2025 Siddharth Ahuja — Blender provider MCP
- [samuelgursky/davinci-resolve-mcp](https://github.com/samuelgursky/davinci-resolve-mcp) © Samuel Gursky — Resolve provider MCP (Studio)

## Related Skills

- `ia-workspace-new-crate` — same procedural/setup-skill pattern this one follows
