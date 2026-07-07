#!/usr/bin/env python3
"""Idempotently ensure MCP server entries exist in a pi mcp.json.

Usage:
  merge-mcp.py <target_mcp.json> <servers_to_ensure.json> [--force]

`servers_to_ensure.json` has the same shape as mcp.json: {"mcpServers": {...}}.
  - default: add any server that is MISSING; leave existing entries untouched
    (so per-workstation tweaks survive a refresh).
  - --force: also overwrite entries that already exist with the new definition.

Everything else in the target file (other servers, top-level keys) is preserved.
The file is rewritten with indent=2 + trailing newline. Creates the file if absent.
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser(description="Idempotently ensure MCP servers in a pi mcp.json.")
    ap.add_argument("target", help="Path to the target mcp.json.")
    ap.add_argument("ensure", help="Path to a JSON file of servers to ensure-present.")
    ap.add_argument("--force", action="store_true",
                    help="Overwrite existing server entries (default: only add missing).")
    args = ap.parse_args()

    target = Path(args.target)
    ensure = Path(args.ensure)

    try:
        ensure_data = json.loads(ensure.read_text())
    except (OSError, json.JSONDecodeError) as e:
        print(f"ERROR: cannot read ensure file {ensure}: {e}", file=sys.stderr)
        return 2
    ensure_servers = ensure_data.get("mcpServers", {})
    if not isinstance(ensure_servers, dict):
        print("ERROR: ensure file must have an 'mcpServers' object", file=sys.stderr)
        return 2

    if target.exists():
        try:
            data = json.loads(target.read_text())
        except (OSError, json.JSONDecodeError) as e:
            print(f"ERROR: cannot parse existing {target}: {e}", file=sys.stderr)
            return 2
    else:
        data = {}

    servers = data.setdefault("mcpServers", {})
    if not isinstance(servers, dict):
        print("ERROR: target 'mcpServers' is not an object", file=sys.stderr)
        return 2

    added, updated, kept = [], [], []
    for name, spec in ensure_servers.items():
        if name not in servers:
            servers[name] = spec
            added.append(name)
        elif args.force:
            servers[name] = spec
            updated.append(name)
        else:
            kept.append(name)

    changed = bool(added) or bool(updated)
    if changed:
        target.write_text(json.dumps(data, indent=2) + "\n")

    parts = []
    if added:   parts.append(f"added {added}")
    if updated: parts.append(f"updated {updated}")
    if kept:    parts.append(f"kept existing {kept}")
    msg = "; ".join(parts) if parts else "no changes"
    note = "" if changed else " (file untouched)"
    print(f"{target}: {msg}{note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
