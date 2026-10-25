---
name: ql-slack-notifications-setup
description: >-
  Configure the Slack notifications add-on (threaded PR and deploy cards) in
  this engagement repo after it's installed. Triggers — "set up Slack
  notifications", "wire up slack-deploy-notify",
  "/ql-slack-notifications-setup".
produces: >-
  A configured Slack app, repo secrets (SLACK_BOT_TOKEN, SLACK_CHANNEL_ID,
  SLACK_QA_CHANNEL_ID), a populated .github/slack-user-map.json, and the
  add-on marked configured in .launchpad/repo.json. No commit — you
  review the diff.
---

# Slack notifications setup

This skill configures the Slack notifications add-on (decisions/0074): picked in the setup interview at `/ql-init-engagement`, or added later through `/ql-resync`. Until this skill finishes, the repo profile records the add-on as not configured, and `/ql-setup` and a daily session reminder name this command. The files themselves are generic and every entry point degrades safely (a `::warning::` + skip, never a failing check) when the secrets below aren't set yet — but nothing actually *posts* until the Slack app, repo secrets, and user map are configured for this repo and Slack workspace.

## Step 0 — Confirm the bundle is present

Check for `.github/workflows/slack-pr-notify.yml`. If it's missing, the add-on isn't in this repo yet: run `/ql-resync`, ask it for the add-ons, and pick **Slack notifications** before continuing here. Don't hand-copy the files from the plugin; `/ql-resync` records the add-on in the engagement profile.

## What's in this bundle

| Path | What it is |
|---|---|
| `.github/workflows/slack-pr-notify.yml` | Threaded PR lifecycle notifications (opened/ready/review/comment/merge/close) |
| `.github/actions/slack-deploy-notify/` | Composite action — reports a deploy job's outcome into the merged PR's thread |
| `.github/actions/slack-notify/` | Composite action — standalone (PR-agnostic) pass/fail post, for scheduled/cron jobs |
| `.github/lib/slack-card.js` | Shared rendering + lookup helpers (single source of truth for the message card) |
| `.github/slack-user-map.json` | GitHub login → Slack member ID (template — needs populating) |

Read `.github/lib/slack-card.js` before changing any rendering behavior — it's the one file both the PR workflow and the deploy action depend on, so a change there affects both.

## Step 1 — Create/configure the Slack app

1. Under **Basic Information**, set the **App Name** and upload an **App icon** — this is the identity (name + avatar) every card/reply posts under, so pick something that reads clearly as "this repo's CI bot" in a shared channel.
2. Create a Slack app (or reuse an existing one) with these two OAuth scopes under **OAuth & Permissions**, then reinstall the app to the workspace:
   - **`chat:write`** — send messages as the app's bot user. This is the one this bundle actually runs on: every post/update/thread reply goes through it.
   - **`incoming-webhook`** — post messages to specific channels in Slack. Some workspace app-approval flows expect this alongside `chat:write` even though this bundle never uses a webhook (see point 6).
3. Grab the **bot token** (`xoxb-...`) from **OAuth & Permissions**.
4. Set the **Redirect URL** (also under **OAuth & Permissions**) to the GitHub repo this app is being wired into, e.g. `https://github.com/<org>/<repo>` — not functionally required by this bundle (nothing here drives Slack's OAuth redirect flow), but keeps the app's config pointing at the actual project for anyone reviewing it later.
5. **Invite the bot to every channel it will post in** (`/invite @YourAppName`) — otherwise every post fails with `not_in_channel`.
6. Threading (this whole system) **requires the bot token** — an incoming webhook cannot post into a thread, so don't substitute one even though the `incoming-webhook` scope above is enabled.
7. Once the App Name, OAuth scopes, and Redirect URL are set, go to **Install App** and click **Request to Install to Workspace**. On a workspace that gates app installs (see below), this is what actually kicks off the approval review — installing/reinstalling before those three are set just means redoing this step later.

### If the app needs to clear an internal approval process

Some Slack workspaces gate new app installs (and scope changes on existing apps) behind an internal review — a security/compliance sign-off before the app can post at all. If this engagement's workspace works that way, budget real calendar time for it (a multi-business-day review SLA is common) and expect to demonstrate the app working in a lower/sandbox environment before a production install is approved. Approval doesn't block testing: build against a personal/sandbox Slack app meanwhile, then swap `SLACK_BOT_TOKEN`/`SLACK_CHANNEL_ID` once it clears.

## Step 2 — Repo secrets and variables

In **Settings → Secrets and variables → Actions**:

| Name | Kind | Used by |
|---|---|---|
| `SLACK_BOT_TOKEN` | Repository **secret** | all workflows/actions in this bundle |
| `SLACK_CHANNEL_ID` | Repository **secret** | `slack-pr-notify`, `slack-deploy-notify` (fallback) |
| `SLACK_QA_CHANNEL_ID` | Repository **variable** (not secret) | any `slack-notify` caller posting to a QA/monitoring channel |

Channel IDs are the `C0XXXXXXX` form (right-click the channel → View channel details → copy ID at the bottom), not the `#name`.

**Keep `SLACK_BOT_TOKEN`/`SLACK_CHANNEL_ID` at the repository level, not environment-scoped.** `slack-pr-notify` is a notifier, not a deploy — if it declared `environment: CI` (the only way to read an environment-scoped secret), GitHub would register a phantom "deployment to CI" on every PR event (open/push/review/comment/close), cluttering the PR timeline. Deploy jobs that use `slack-deploy-notify` can keep their own `environment:` (they're real deployments reading their own `SFDX_URL`) — they can still read the repo-level Slack secrets fine.

**Done when** `gh secret list` shows `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID`, and `gh variable list` shows `SLACK_QA_CHANNEL_ID` if a QA channel is used. Point `SLACK_CHANNEL_ID` at a sandbox/test channel first; swap to the real channel once verified. No code change needed either way. Until these secrets are set, every entry point in this bundle logs a `::warning::` and skips — it will not fail a PR check or a deploy job while unconfigured.

## Step 3 — Populate the user map

`.github/slack-user-map.json` is shipped as a template with two placeholder entries (`octocat`, `hubot`) showing the expected shape — replace them with real logins/IDs, don't just add alongside them.

GitHub login → Slack **member ID** (`U…`/`W…`, NOT the `@handle` or display name). Get it from a person's Slack profile → **⋯ → Copy member ID**. An unmapped login safely degrades to a bold display name (renders, doesn't ping) — so an incomplete map never breaks a notification, it just pings fewer people.

- `_groups.reviewers` — a Slack **user-group (subteam) ID** (`S…`, shown as the `S0XXXXXXX` placeholder) to ping as a whole when a PR enters the review queue. Find it on the group's page in Slack, or from an existing `<!subteam^S…>` mention in message history. Leave `""` to skip this ping entirely.
- `_qa` — array of GitHub logins to ping on the "ready for QA" deploy hand-off (the template ships `["octocat"]` as a placeholder). Leave `[]` if there's no separate QA role.

**Done when** no `octocat` or `hubot` placeholder remains and every active contributor's login has a member ID. The map is **committed, secret-free** — never put a token or password in it, only logins/IDs. This file is inherently per-repo: real Slack IDs, never generic. The add-on is recorded as expecting local edits, so `/ql-resync` only ever offers a hand-merge for it, never a swap.

## Step 4 — Adapt branch scoping to this repo

`slack-pr-notify.yml` ships with a minimal, single-branch default:

```yaml
branches:
  - "main"
```

and the job's `if:` condition repeats the same branch list for the `pull_request_review` gate. **Edit both spots** to match this repo's actual branch names/model (e.g. a `develop` → `release/*` → `main` pipeline should list all three in both places). **Done when** both lists name the same branches.

If your pipeline has an intermediate promotion/staging branch and you want reviewers to see which intents (`intents/INT-NNN/`) a promotion PR carries, that's a pattern you'd add on top of this bundle — it isn't wired in by default, since it assumes a specific multi-stage branching model this bundle doesn't presume.

## Step 5 — Wire deploy jobs to `slack-deploy-notify`

`slack-deploy-notify` is a composite action, not a standalone workflow — it does nothing by itself. **You must add a step calling it to every existing deployment workflow you want reported** (`sf-deploy.yml`, a `feature-*` env deploy, etc.); nothing posts back to the PR thread until that step exists in the actual deploy job. If you have more than one deploy workflow, repeat this wiring in each one.

For each deploy job (e.g. a `sf project deploy start` step), tee its output to a log and call the action with `if: always()`:

```yaml
- name: Deploy
  run: |
    set -o pipefail
    sf project deploy start ... 2>&1 | tee deploy-output.log
- name: Notify Slack of deploy outcome
  if: always()
  uses: ./.github/actions/slack-deploy-notify
  with:
    status: ${{ job.status }}          # success | failure
    environment: My Sandbox            # the card/thread label shown in Slack
    error-log-file: deploy-output.log  # optional; quoted into the failure reply
    slack-bot-token: ${{ secrets.SLACK_BOT_TOKEN }}
    slack-channel-id: ${{ secrets.SLACK_CHANNEL_ID }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

The job needs `permissions: { contents: read, pull-requests: read }` — it resolves the merged PR from the pushed commit and reads its hidden thread marker to reply/update the right card. If the push has no associated PR (a direct push), it falls back to a standalone channel post. **Done when** every deploy workflow under `.github/workflows/` has a `slack-deploy-notify` step (`rg --files-without-match slack-deploy-notify .github/workflows/` lists only non-deploy workflows).

## Step 6 — Wire scheduled/cron jobs to `slack-notify`

For a job with no PR to thread onto (a nightly scan, a scheduled test suite), resolve any failure-ping tokens first (optional), then call the action:

```yaml
- name: Resolve QA mentions
  id: qa
  if: always()
  uses: actions/github-script@v7
  with:
    script: |
      const path = require('path');
      const lib = require(path.join(process.env.GITHUB_WORKSPACE, '.github', 'lib', 'slack-card.js'));
      const userMap = lib.loadUserMap(core);
      core.setOutput('mentions', lib.qaMentions(userMap, lib.qaLogins(userMap)).join(' '));

- name: Notify Slack of outcome
  if: always()
  uses: ./.github/actions/slack-notify
  with:
    status: ${{ job.status }}               # or needs.<job>.result for a matrix
    title: My scheduled job
    details: 'optional one-line context'
    log-file: my-output.log                 # optional; tail quoted on failure
    mention-on-failure: ${{ steps.qa.outputs.mentions }}
    slack-bot-token: ${{ secrets.SLACK_BOT_TOKEN }}
    slack-channel-id: ${{ vars.SLACK_QA_CHANNEL_ID }}
```

`slack-notify` makes no GitHub API calls and needs no `github-token` — it's a pure standalone post, so it works for any cron/dispatch job. Only `success`/`failure` post; `cancelled`/`skipped` posts nothing.

## Step 7 — Verify it works

1. Open a throwaway PR against a tracked branch — confirm a parent card posts and a `<!-- slack-thread:ts=...;channel=... -->` marker comment appears on the PR.
2. Approve/comment on it — confirm a threaded reply appears (not a new top-level post).
3. Merge it — confirm the parent card recolors to "Merged" (purple) and a threaded reply posts.
4. If a deploy job is wired, confirm the same card gets a second update ("Deployed to ..." blue, or the amber failure state with quoted log tail).

## Step 8 — Mark the add-on configured

Once a test PR posts and threads (Step 7), record it so `/ql-setup` and the session reminder stop asking:

```bash
node -e 'const fs=require("fs"),f=fs.existsSync(".launchpad/repo.json")?".launchpad/repo.json":".launchpad/engagement.json",p=JSON.parse(fs.readFileSync(f,"utf8"));for(const e of p.add_ons||[])if(e.id==="slack-notifications")e.configured=true;fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
```

Commit it with the user map. Mark it configured only after a post actually landed: until then, the reminder is doing its job.

Afterwards, to change what the bundle posts or how it looks, see `.claude/skills/ql-slack-notifications-setup/customizing.md`, or `.agents/skills/ql-slack-notifications-setup/customizing.md` on other harnesses, or `${CLAUDE_PLUGIN_ROOT}/skills/ql-slack-notifications-setup/customizing.md` on a plugin-only checkout.

## Common failure modes

| Symptom | Cause |
|---|---|
| A run logs `::warning::...skipping Slack notification` and posts nothing | `SLACK_BOT_TOKEN`/`SLACK_CHANNEL_ID` (or an action input derived from them) aren't set yet — expected until Steps 1–2 here are done; not a bug, and it never fails the check. |
| `not_in_channel` error | Bot wasn't invited to the target channel |
| No ping, just a bold name | Login/ID missing (or a typo) in `slack-user-map.json` — check the exact GitHub login casing |
| Thread reply never appears, only a `core.notice` in the Action log | No `<!-- slack-thread:... -->` marker on the PR (predates this workflow, or PR opened against an untracked branch) — the "reply" path deliberately never orphans a post to the channel |
