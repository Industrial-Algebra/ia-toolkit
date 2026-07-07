#!/usr/bin/env bash
# install-comfy-skills.sh — fetch Comfy-Org/comfy-skills and port its canonical
# Claude Code commands into pi skill format under ~/.pi/agent/skills/comfy-skills/.
#
# Port (mechanical, reproducible):
#   - source: upstream claude-code/commands/<base>.md  (the skills/*.md are legacy)
#   - name:   comfy-<base>
#   - description: upstream `description:` + " Requires the comfy-cloud MCP server."
#                 (only when the body calls an MCP tool)
#   - compatibility: added when the body calls an MCP tool
#   - $ARGUMENTS placeholders stripped (pi passes slash-command args separately)
# Idempotent: re-running overwrites with the latest upstream.
set -euo pipefail

DST="${1:-$HOME/.pi/agent/skills/comfy-skills}"
UPSTREAM="${COMFY_SKILLS_REPO:-https://github.com/Comfy-Org/comfy-skills}"

# MCP tool names that mark a skill as MCP-dependent.
MCP_TOOLS='submit_workflow|get_job_status|get_output|search_templates|search_models|search_nodes|upload_file|partner_generate|cancel_job'
COMPAT='Requires the comfy-cloud MCP server (https://cloud.comfy.org/mcp), authenticated via `/mcp` or `/mcp-auth comfy-cloud`.'

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
git clone --depth 1 --quiet "$UPSTREAM" "$tmp/src"
src="$tmp/src/claude-code/commands"
[ -d "$src" ] || { echo "ERROR: $src not found upstream (layout changed?)" >&2; exit 1; }

mkdir -p "$DST"
count=0
for f in "$src"/*.md; do
  base="$(basename "$f" .md)"
  name="comfy-$base"
  skilldir="$DST/$name"; mkdir -p "$skilldir"
  out="$skilldir/SKILL.md"

  # upstream description (first description: line in frontmatter)
  desc="$(awk -F': ' '/^description:/{sub(/^description:[ ]*/,""); print; exit}' "$f")"
  [ -n "$desc" ] || { echo "WARN: $base has no description — skipping"; continue; }

  # body = everything after the closing frontmatter ---, with $ARGUMENTS stripped
  body="$(awk 'NR==1 && /^---$/{fm=1;next} fm && /^---$/{fm=0;next} fm{next} {print}' "$f" \
          | sed -E 's/[[:space:]]*:[[:space:]]*\$ARGUMENTS//g; s/\$ARGUMENTS//g')"

  # does the body call an MCP tool?
  if printf '%s' "$body" | grep -Eq "$MCP_TOOLS"; then
    # ensure a sentence boundary before appending (upstream descs often lack a trailing period)
    case "$desc" in
      *[.!?]) sep=" " ;;
      *)      sep=". " ;;
    esac
    desc="$desc${sep}Requires the comfy-cloud MCP server."
    compat_line="compatibility: $COMPAT"
  else
    compat_line=""
  fi

  {
    echo "---"
    echo "name: $name"
    echo "description: $desc"
    [ -n "$compat_line" ] && echo "$compat_line"
    echo "---"
    echo ""
    printf '%s\n' "$body"
  } > "$out"
  count=$((count+1))
done

# Provenance README
cat > "$DST/README.md" <<EOF
# Comfy Skills (pi)

Pinned-by-SHA, refreshed from [$UPSTREAM]($UPSTREAM) \`claude-code/commands/\` by
\`ia-media-setup\`. See ia-toolkit's \`skills/ia-media-setup/SKILL.md\` for the port
rules. Upstream license: MIT (© Comfy-Org).
EOF

echo "Installed/refreshed $count comfy skills into $DST (from $(git -C "$tmp/src" rev-parse --short HEAD))"
