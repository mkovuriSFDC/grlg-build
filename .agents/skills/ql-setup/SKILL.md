---
name: ql-setup
disable-model-invocation: true
description: Set up (or re-sync) this AI-native delivery engagement workspace — installs the toolchain and wires up `.mcp.json`. Run on first clone or any time tooling drifts.
produces: >-
  `.mcp.json` (the Atlassian MCP server, plus Azure DevOps on an ADO engagement), and — when opencode is present — a committed `opencode.json` `mcp` block with the same servers in opencode's format; plus the installed toolchain (sf CLI and the build toolkits the repo profile picked) and `sfdx-project.json` if it was missing. No engagement content — that's /ql-ingest-scopezilla.
---

# Setup — AI-native delivery engagement workspace

The first thing a consultant runs after cloning the repo. Step 1 runs the installs itself, so the user never runs `node launchpad/scripts/setup.mjs` separately (that would double-install).

## Prereq

**Node ≥ 22.20.** If `node --version` is missing or older, point the user at https://nodejs.org or `nvm install 22`. Don't try to install Node yourself.

## Step 1 — Run the setup script

```bash
node launchpad/scripts/setup.mjs
```

That handles the stable installs in one go:
- `@salesforce/cli` (npm global)
- the build toolkits in the repo profile's `toolkits` (`.launchpad/repo.json`): Pi with sf-pi, and forcedotcom/sf-skills per agent. On Claude Code that's the `salesforce-development` plugin from the `salesforce` marketplace, turned on for this repo only, with its auto-update turned on; the other agents setup finds on the machine get the skills globally. Each brings its own Salesforce skills, so none land in the repo. Pass on the follow-ups setup prints, including a `.gitignore` line to commit. The repo profile's `sf_skills` says which Claude Code gets: `plugin` (the default) or `skills` (plain global skills, in every folder). A builder who wants the other on their machine runs `node launchpad/scripts/setup.mjs --sf-skills plugin|skills`, and setup remembers it.
- the `ql-*` skills, only when the profile sets `commit_skills: false` and the quantum-leap-launchpad plugin isn't installed here (the plugin already serves them; `--harness other` installs them anyway, for a second harness on this machine)

Stream the output. If it fails, the most common cause is a stale npm cache or Node too old.

## Step 1b — Make the launchpad skills available to your agent

**First, check the repo profile, `.launchpad/repo.json`.** If it sets `commit_skills: false` (`decisions/0072`), the skills are **not** in the repo: they're gitignored, and either the quantum-leap-launchpad plugin serves them (Claude Code, SEAP) or `node launchpad/scripts/setup.mjs` (Step 1) just installed them for this machine. Confirm the skills load (a `ql-*` dir in `.claude/skills/` or `.agents/skills/`, or the plugin in `/plugin`), tell the user re-running `node launchpad/scripts/setup.mjs` is how they refresh, and **skip the rest of this step and Step 1d** (the Windows symlink repair only fixes committed links). Otherwise, the default:

This engagement's operating skills (the `ql-*` set — `/ql-ingest-scopezilla`, `/ql-check-scope`, `/ql-start-intent`, …) are **vendored into the repo** (into your harness's skills dir — `.claude/skills/` for Claude Code, `.agents/skills/` for other harnesses), so they work in **any** harness on clone (see the plugin's `decisions/0012`). How each agent picks them up, and how they stay current:

- **Claude Code** — the vendored skills load as project skills automatically. Salesforce team members should also install the `quantum-leap-launchpad` **plugin** (it adds a once-a-day nudge when the vendored skills fall behind upstream, plus `/ql-init-engagement` and `/ql-resync`):

  ```
  /plugin marketplace add https://git.soma.salesforce.com/dgerow/quantum-leap-launchpad.git
  /plugin install quantum-leap-launchpad@quantum-leap-launchpad
  ```

- **opencode, Cursor, Codex, Copilot, or any other agent** — the skills are already in the repo; nothing to install. These harnesses read their skills from `.agents/skills/` (opencode also reads `AGENTS.md` for the build conventions directly). If your agent keeps its skills in its own directory and the repo's copy isn't picked up, fan them into every detected harness dir with:

  ```bash
  npx -y skills@1.5.25 add . --yes    # re-vendors from the repo into each agent's skills dir
  ```

  **Joining on a non-Claude harness (e.g. opencode):** clone the engagement repo, then run `/ql-setup` — the vendored skills + `AGENTS.md` conventions are already present, and Step 1c covers opencode. Note: **scaffolding a *new* engagement (`/ql-init-engagement`) and pulling committed-content updates (`/ql-resync`) run in Claude Code** (they read the plugin's templates), so a team with no Claude user does those steps another way (a teammate on Claude, or by hand: `npx skills add` plus the matching `launchpad/scripts/` from the plugin repo, together). Day-to-day build/validate/report skills run in any harness.

**Keeping them current:** `/ql-resync` (Claude Code, with the plugin) refreshes them together with the engine scripts they call, and teammates on any harness pick that up with `git pull`. Nothing auto-applies; the merge/commit is the gate.

## Step 1c — opencode (only if `command -v opencode` finds it)

opencode needs two things Claude Code gets elsewhere: its per-machine telemetry plugin, and the repo's MCP servers in a committed `opencode.json`. Both are in `.claude/skills/ql-setup/opencode.md`, or `.agents/skills/ql-setup/opencode.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-setup/opencode.md` on a plugin-only checkout ("Telemetry plugin" here, "MCP config" at Step 2d). Skip both when opencode isn't installed; never block setup on them.

## Step 1d — Windows only: make vendored-skill symlinks resolve

On Windows, `git clone` can write each vendored-skill symlink as a one-line text file, so the skill never loads. Follow `.claude/skills/ql-setup/windows.md`, or `.agents/skills/ql-setup/windows.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-setup/windows.md` on a plugin-only checkout (Developer Mode, `core.symlinks`, then `node launchpad/scripts/fix-skill-symlinks.mjs`). **Done when** `fix-skill-symlinks.mjs --check` exits 0. macOS/Linux skip this.

## Step 2 — Wire up the MCP servers

`.mcp.json` carries the **Atlassian** server (for `/ql-sync-jira` reporting), plus **Azure DevOps** when the engagement tracks there (2b) and any an add-on wrote. **Salesforce Docs** (doc grounding) needs an auth token, so it never goes in the repo (2c). Org work (deploy, retrieve, query, tests) comes from the build toolkit's skills and the `sf` CLI, not an MCP server.

If `.mcp.json` already exists, merge server by server: add or update the ones this step owns and leave every other server in place, including any an add-on wrote (`add_ons` in `.launchpad/repo.json`, e.g. `salesforce-docs-labs`). Say you're keeping them; don't ask. Ask before overwriting a server this step owns that differs from what it would write.

### 2a — Retire the Salesforce DX server

`@salesforce/mcp` reaches end of life on 2026-11-02 (archived, npm package deprecated), so setup no longer writes it (decisions/0086). If `.mcp.json` or `opencode.json` still has a server running `@salesforce/mcp` (usually `Salesforce DX` or `salesforce-dx`), say it's retired and ask before removing that one entry; keep every other server. If they'd rather keep it, leave it: it keeps working until it doesn't.

### 2b — Atlassian (Jira reporting)

`/ql-sync-jira` projects scope + delivery status into Jira, and it can reach Jira **two ways** (see decisions/0011) — **which one depends on the customer's tenant policy**, so this step figures out which is available and records it. Some enterprise tenants block third-party MCP OAuth apps but allow create-your-own API tokens; others are the reverse. Don't assume MCP.

**Always ship the MCP server block** (it's inert until used) — in `.mcp.json`:

```json
"atlassian": { "type": "http", "url": "https://mcp.atlassian.com/v1/mcp" }
```

- Use the streamable-HTTP endpoint `https://mcp.atlassian.com/v1/mcp` (`type: "http"`). **Not** the older `…/v1/sse` endpoint — Atlassian deprecated SSE (sunset 30 June 2026). No `mcp-remote` npx shim is needed; Claude Code does remote OAuth natively.
- Auth is a one-time **browser OAuth** on first use (`/mcp` → Atlassian login), not an API token.

**Then figure out the transport** so `/ql-sync-jira` fails fast at config time, not at push time. Ask the user (or, if they already know their tenant blocks third-party OAuth apps, skip straight to API):

- **MCP available** (the common, default case) → nothing more to configure here; the OAuth happens on first `/ql-sync-jira`. The transport stays the default `"mcp"`.
- **MCP blocked, API token allowed** → the projection runs over `launchpad/scripts/jira-rest.mjs` (Jira Cloud REST v3, zero-dep). It needs, at `/ql-sync-jira` time:
  - env vars `JIRA_EMAIL` + `JIRA_API_TOKEN` (a token from id.atlassian.com/manage-profile/security/api-tokens) — **never committed**; tell the user to export them (or add to a local, gitignored env file).
  - `base_url` (the customer's `…atlassian.net`) and `transport: "api"` in `delivery/jira.config.json` — non-secret, committed. `/ql-sync-jira` creates that config on first run; you can pre-seed `transport`/`base_url` now from `delivery/jira.config.example.json` so the choice is recorded.

Recording the transport now is the point: `/ql-sync-jira` reads it and confirms the right prerequisite up front, instead of dying mid-push when the MCP won't connect. A complete `.mcp.json` has these servers under `mcpServers` regardless of transport: `atlassian` (the block above), plus `azure-devops` when the engagement tracks in Azure DevOps (below).

**Azure DevOps Boards instead of Jira.** Ask which tracker the engagement uses. If it's Azure DevOps, `/ql-sync-jira` runs its ADO adapter (`tracker: "ado"`, the `ado` block of `delivery/jira.config.example.json`). Ask for the org URL and the project, then figure out the transport the same way:

- **MCP** (the default; Azure DevOps Services only) → add the server to `.mcp.json`, with the org name from the URL. An org name is not a secret:

  ```json
  "azure-devops": { "command": "npx", "args": ["-y", "@azure-devops/mcp", "<org>"] }
  ```

  It opens a browser sign-in on first use. If that's blocked, `"--authentication", "azcli"` at the end of `args` makes it use the user's `az login` instead.
- **API** (the MCP is blocked, or the org is on Azure DevOps Server, which is untested and may differ) → `launchpad/scripts/ado-rest.mjs` (ADO REST, zero-dep). At `/ql-sync-jira` time it needs `ADO_PAT` (scopes **Work Items: Read & write** and **Project and Team: Read**) or `ADO_TOKEN` in the environment, **never committed**.

Either way, pre-seed `tracker: "ado"` and the `ado` block's `transport`, `org_url` and `project` in `delivery/jira.config.json`. The `atlassian` block stays; it's inert.

**Step 2 is done when** `.mcp.json` has `atlassian` (plus `azure-devops` on an ADO engagement), the tracker transport is recorded, no shipped header-less `salesforce-docs` entry remains (2c), any `@salesforce/mcp` entry is retired or kept on the user's say-so (2a), and every server that was already there still is.

### 2c — Salesforce Docs (doc grounding): not in the repo

The `salesforce-docs` server needs an auth token, so **it never goes in `.mcp.json` or `opencode.json`**: the plugin carries it for Claude Code, other harnesses add it at user scope, and the token-free `salesforce-docs-labs` add-on is the committed option. Then remove an older setup's header-less `salesforce-docs` entry only when it **exactly matches one we shipped**. Where each option comes from, and the exact-match removal rule: `.claude/skills/ql-setup/docs-server.md`, or `.agents/skills/ql-setup/docs-server.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-setup/docs-server.md` on a plugin-only checkout.

### 2d — opencode's MCP config (only if opencode is present)

Write or merge `opencode.json` with the same servers in opencode's format, per `.claude/skills/ql-setup/opencode.md`, or `.agents/skills/ql-setup/opencode.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-setup/opencode.md` on a plugin-only checkout ("MCP config").

## Step 3 — Generate the SFDX project (if missing)

If `sfdx-project.json` is absent, run `sf project generate --name . --manifest`. Otherwise skip.

## Step 4 — Verify the MCP servers load

Writing `.mcp.json` is not the same as the servers running. Two things bite people:

1. **They only load after a restart.** Claude Code reads MCP config at startup, so a `.mcp.json` written during this session won't be active until Claude Code is restarted. There's no hot-reload (`/mcp` shows status and handles auth, but doesn't reload config).
2. **You approve the project servers once.** On restart, Claude Code prompts to trust the project MCP servers declared in `.mcp.json` — tell the user to accept it. (The shipped `.claude/settings.json` deliberately does *not* auto-trust every project MCP server, so this one-time prompt is expected and healthy — it's the gate on a repo's `.mcp.json`.)

After the restart, `claude mcp list` should show them. A cold first `npx` start can exceed the connect window: in Claude Code, set `MCP_TIMEOUT` (milliseconds, e.g. `"MCP_TIMEOUT": "60000"` under `env` in `.claude/settings.local.json`) and restart; other harnesses have their own MCP startup-timeout setting.

**Done when** you've told the user the restart, the one-time trust prompt, and each server's expected state.

The `atlassian` server won't have authenticated yet — its tools stay gated until the user completes the one-time browser OAuth via `/mcp` (Atlassian login). That OAuth only matters before the first `/ql-sync-jira`; if this engagement doesn't report through Jira, it can be skipped entirely. An `azure-devops` server shows connected once `npx` has fetched it; it signs in on its first tool call.

**If you wrote `opencode.json` (Step 2d),** check with `opencode mcp list`; expect `atlassian` ⚠ needs authentication (`opencode mcp auth atlassian`).

**On any other harness (Cursor, Codex, a customer's own agent):** it reads MCP config from its *own* location, not `.mcp.json`/`opencode.json`. Configure the same servers wherever that harness expects them, including any an add-on put in `.mcp.json` (plus `salesforce-docs` at user scope if you have a token, 2c), and verify with its own MCP list/status command — consult the harness's MCP docs for both (the repo doesn't scaffold non-Claude/opencode harnesses; the servers and OAuth model are the same, only the config location and verify command differ).

## Step 4b — Check GitHub Actions can run

A repo with Actions off has PRs with no checks at all, and that looks just like a green gate. If the repo has a GitHub remote and `gh` is signed in, probe once:

```bash
gh api 'repos/{owner}/{repo}/actions/permissions'
```

Point the user to "Prerequisite — enable GitHub Actions" in `.github/workflows/README.md` when either of these holds:

- `enabled` is `false`: no workflow will run, the trust chain included.
- `allowed_actions` is anything but `all`: the workflows run only if the allowlist includes the actions they use. If the call fails (no remote, not signed in, no admin rights to read the setting), say the check was skipped and point to the same section. It's a warning, never a block.

## Step 5 — Carry on with any pending setup steps

If `.launchpad/local.json` exists, it's this machine's record of what setup still owes the repo (written when the repo was seeded; `pending` is an ordered list, `scopezilla_source` an absolute path). Tooling is done, so drop `setup` from `pending` and write the file back. Then:

- **`ingest` pending, with a `scopezilla_source` that still exists** → tell the user the next command: "Type `/ql-ingest-scopezilla` to pull in the Scopezilla scope from `<source>` (it picks up that path)." It's user-invoked, so you can't start it yourself. It clears `ingest` when it finishes; until then it stays pending.
- **`ingest` pending but the source is gone** (moved, a different machine) → say so and ask for the new path, or leave it pending.
- **No file, or nothing pending** → nothing to do. A teammate joining an existing repo lands here: the profiles (`.launchpad/repo.json` and each `launchpad/engagements/<slug>/engagement.json`) are already committed and need nothing from them. When the repo has more than one open engagement, ask which one they're working in and write it to `local.json` as `active_engagement`; skills and the engine read it when no engagement is named (`decisions/0082`).

**Then the add-on follow-ups, for everyone.** The committed repo profile lists each add-on in `add_ons`; one with `configured: false` hasn't been set up yet, so a teammate on any machine sees it. For each, name its `follow_up` command ("The `<id>` add-on isn't set up yet: run `<follow_up>`"). That skill sets `configured: true` when it finishes. Until then the add-on does nothing and keeps CI green.

The MCP restart in Step 4 doesn't block this; ingest doesn't need the MCP servers. **Done when** `pending` is written back without `setup`, and every `configured: false` add-on has its follow-up named.

## What NOT to do

- **Leave engagement identity to the placeholders.** No prompts for client / project / sponsor / org alias; README and AGENTS.md carry `(fill in)` until they're real.
- **Leave org auth to the first command that needs it** (`sf org login web --alias <alias>`). Setup is tooling, not auth.

## After everything installs

Summarize for the user:

- Versions of `node`, `sf`, `pi` now installed.
- Whether the SFDX project was generated or already existed.
- The contents of `.mcp.json` (the `atlassian` server, plus `azure-devops` on an ADO engagement) — **and `opencode.json` if opencode was present** (the same servers, opencode format) — and any retired `Salesforce DX` (2a) or `salesforce-docs` (2c) entry you removed, so it gets committed — and the servers' status from `claude mcp list` (or `opencode mcp list`; or "restart Claude Code, then run `claude mcp list`" if they haven't loaded yet). Note that the `atlassian` server needs a one-time OAuth before `/ql-sync-jira` (`/mcp` in Claude Code, `opencode mcp auth atlassian` in opencode), and is optional if Jira reporting isn't used. On an Azure DevOps engagement, name the `azure-devops` server (or the `ADO_PAT` the API transport needs) and the pre-seeded `ado` config. Docs grounding comes from the plugin's `salesforce-docs` server (it should appear in `claude mcp list`), or from the user-scope setup in 2c on other harnesses; it's optional, and skills fall back to public docs without it.
- The GitHub Actions probe (Step 4b): OK, the warning, or skipped.
- **On Windows:** whether the vendored-skill symlink repair (Step 1d) ran clean, and — if any links couldn't be created — the Developer Mode prerequisite. (macOS/Linux: no-op, skip mentioning.)
- Next steps:
  1. **If the tracker's MCP server (`atlassian` or `azure-devops`) isn't ✅ yet, restart Claude Code and run `claude mcp list` to confirm** before the first `/ql-sync-jira`. Org work doesn't wait on it: that's the build toolkit and the `sf` CLI.
  2. Fill in the engagement-detail placeholders in `README.md` and `AGENTS.md` when known.
  3. If Step 5 left `ingest` pending, run `/ql-ingest-scopezilla` when ready (it picks up the recorded source). No Scopezilla? `/ql-capture-intent` turns notes or a transcript into intents.
  4. When ready to do dev work: `sf org login web --alias <alias>`.

## Maintenance note

`launchpad/scripts/setup.mjs` is the source of truth for the stable installs. Bump versions there (in the plugin's template; `/ql-resync` carries it to repos). The MCP step stays docs-driven on purpose — its config shape changes faster than the install commands do.
