# Setup — opencode

Reached from `/ql-setup` Steps 1c and 2d, only when `command -v opencode` finds it.

## Telemetry plugin (Step 1c)

Claude Code users get usage telemetry from the installed plugin's hooks. **opencode has no plugin-marketplace equivalent**, so if the user builds with **opencode** we install its telemetry sibling per-machine (mirroring the Claude posture — telemetry lives on the machine, never committed into the customer repo). See `decisions/0028`. Skip this entirely if opencode isn't installed.

```bash
command -v opencode >/dev/null 2>&1 || { echo "opencode not installed — skipping its telemetry plugin"; }
```

If opencode **is** present, install it from the Launchpad plugin, never from this repo: the plugin checkout if you have one, otherwise a shallow clone of the plugin source. It lands in opencode's per-machine plugin dir, outside the repo:

```bash
if command -v opencode >/dev/null 2>&1; then
  SRC=""
  for c in "${CLAUDE_PLUGIN_ROOT}/hooks/opencode" "$HOME/.claude/plugins/marketplaces/quantum-leap-launchpad/plugins/quantum-leap-launchpad/hooks/opencode"; do
    [ -f "$c/launchpad-telemetry.js" ] && { SRC="$c"; break; }
  done
  if [ -z "$SRC" ]; then
    TMP=$(mktemp -d)
    git clone -q --depth 1 --filter=blob:none --sparse https://git.soma.salesforce.com/dgerow/quantum-leap-launchpad.git "$TMP" \
      && git -C "$TMP" sparse-checkout set plugins/quantum-leap-launchpad/hooks/opencode \
      && SRC="$TMP/plugins/quantum-leap-launchpad/hooks/opencode"
  fi
  if [ -n "$SRC" ]; then
    DEST="$HOME/.config/opencode/plugin"; mkdir -p "$DEST"
    cp "$SRC/launchpad-telemetry.js" "$DEST/"
    [ -f "$SRC/.tracking-config.json" ] && cp "$SRC/.tracking-config.json" "$DEST/"
    echo "Installed opencode telemetry plugin → $DEST (re-run /ql-setup to refresh)"
  else
    echo "Couldn't reach the Launchpad plugin source — skipping opencode telemetry"
  fi
fi
```

Never block setup on this. To **opt out** of the network posts while keeping the local usage log, set `LAUNCHPAD_TELEMETRY_ENDPOINT=""`. Re-running `/ql-setup` on a new machine (or after an update) refreshes it.

## MCP config (Step 2d)

**opencode does not read `.mcp.json`** — it reads an `mcp` block in a repo-root **`opencode.json`**. So an opencode builder needs the same servers in opencode's format, or they get no Atlassian MCP (the docs server is per-user, 2c). Mirror the committed-`.mcp.json` posture exactly: MCP config is shared project tooling (stable URLs, no secrets), so it's **committed**, not per-machine — the opposite of the opencode *telemetry* plugin (Step 1c, per-machine), which stays out of the repo for machine-path/deliverable reasons that don't apply here. See decisions/0029.

**Gate on `command -v opencode`** (same as Step 1c). Skip entirely if opencode isn't installed — a Claude-only pod that later adds an opencode user gets this when *they* run `/ql-setup`.

Write (or **merge** — never clobber; preserve any existing provider/model/mcp keys, same diff-before-overwrite rule as `.mcp.json`) `opencode.json` at repo root with the **same servers**, translated to opencode's format. When you create `opencode.json`, also carry over every other server already in `.mcp.json` (an add-on's, like `salesforce-docs-labs`, or the team's own), translated the same way, so an opencode builder gets the same set. **The format differs from `.mcp.json` in three ways** (verified live against opencode 1.18.4, decisions/0029):

- Top-level key is **`mcp`**, not `mcpServers`.
- Remote (HTTP) servers use **`"type": "remote"`** — *not* Claude's `"type": "http"`. opencode auto-detects OAuth on remote servers.
- Local (stdio) servers use **`"type": "local"`** with a **single `command` array** (`[cmd, ...args]`) — *not* Claude's split `command` + `args`.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "atlassian": { "type": "remote", "url": "https://mcp.atlassian.com/v1/mcp", "enabled": true }
  }
}
```

The `atlassian` block is the stable shared endpoint from 2b. An `azure-devops` server from 2b becomes `{ "type": "local", "command": ["npx", "-y", "@azure-devops/mcp", "<org>"], "enabled": true }`. Same graceful-degradation applies: `/ql-sync-jira` has the API-token REST transport (2b, decisions/0011) if the customer's tenant blocks the Atlassian MCP OAuth app.
