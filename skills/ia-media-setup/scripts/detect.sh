#!/usr/bin/env bash
# detect.sh — detect media-production prerequisites on a workstation.
# Prints KEY=VALUE lines (and a human summary) the setup skill / agent reads to
# decide which MCP servers to register and which manual steps to print.
# Safe to run anywhere; never modifies the system.
set -euo pipefail

say() { printf '%s\n' "$*"; }

# --- Node / Python tooling --------------------------------------------------
command -v npx   >/dev/null 2>&1 && say "NPX=$(command -v npx)"     || say "NPX="
command -v uvx   >/dev/null 2>&1 && say "UVX=$(command -v uvx)"     || say "UVX="
command -v uv    >/dev/null 2>&1 && say "UV=$(command -v uv)"       || say "UV="
command -v python3 >/dev/null 2>&1 && say "PYTHON3=$(command -v python3)" || say "PYTHON3="
command -v node  >/dev/null 2>&1 && say "NODE=$(node --version 2>/dev/null)" || say "NODE="

# --- ComfyUI install --------------------------------------------------------
COMFYUI=""
for c in \
  "$HOME/working/comfy/ComfyUI" \
  "$HOME/ComfyUI" \
  "$HOME/projects/ComfyUI" \
  "/opt/ComfyUI" ; do
  if [ -d "$c" ] && { [ -f "$c/main.py" ] || [ -f "$c/comfy/cli_args.py" ]; }; then COMFYUI="$c"; break; fi
done
say "COMFYUI=$COMFYUI"

# --- Blender install --------------------------------------------------------
BLENDER=""
for b in \
  "$HOME/apps/blender-"*/blender \
  "/opt/blender/blender" \
  "/usr/bin/blender" ; do
  if [ -x "$b" ] 2>/dev/null; then BLENDER="$(readlink -f "$b")"; break; fi
done
[ -n "$BLENDER" ] && say "BLENDER=$BLENDER" || say "BLENDER="
# Blender MCP addon socket (default; the addon listens here once "Connect" is clicked)
say "BLENDER_MCP_HOST=localhost"
say "BLENDER_MCP_PORT=9876"

# --- DaVinci Resolve --------------------------------------------------------
RESOLVE=""
[ -d "/opt/resolve" ] && RESOLVE="/opt/resolve"
say "RESOLVE=$RESOLVE"
# Studio vs free: the scripting API (and thus the live MCP) needs Studio.
# Heuristic: Studio installs ship a license activation; we can't read it reliably,
# so we flag presence only and let the skill ask / test.
RESOLVE_INSTALLER=""
for r in \
  "$HOME/apps/DaVinci_Resolve_Studio_"*.run \
  "$HOME/apps/DaVinci_Resolve_"*.run \
  "$HOME/Downloads/DaVinci_Resolve_"*.run ; do
  if [ -f "$r" ] 2>/dev/null; then RESOLVE_INSTALLER="$r"; break; fi
done
say "RESOLVE_INSTALLER=$RESOLVE_INSTALLER"
case "$(basename "$RESOLVE_INSTALLER" 2>/dev/null)" in
  *Studio*) say "RESOLVE_EDITION=studio (per installer filename)" ;;
  "")       say "RESOLVE_EDITION=unknown (no installer found)" ;;
  *)        say "RESOLVE_EDITION=free (per installer filename — live MCP blocked)" ;;
esac

# --- Target dirs ------------------------------------------------------------
say "PI_AGENT_DIR=${PI_AGENT_DIR:-$HOME/.pi/agent}"
say "SKILLS_DIR=${PI_AGENT_DIR:-$HOME/.pi/agent}/skills"
say "MCP_JSON=${PI_AGENT_DIR:-$HOME/.pi/agent}/mcp.json"
