# Setup — Windows: vendored-skill symlinks

Reached from `/ql-setup` Step 1d.

The vendored skills are stored as **symlinks** (one canonical copy at `.agents/skills/<name>/`, each harness dir linked to it — git tracks them as mode-120000 objects). That model is deliberate (no duplication, clean update diffs), but **on Windows `git clone` writes each symlink as a one-line text file** unless the machine can create symlinks — so Claude Code finds a file where it expects a skill directory and the skill never loads (it won't auto-trigger; you'd have to point at it by name). This is a known limitation of the `skills` CLI on Windows-committed repos ([vercel-labs/skills#1199](https://github.com/vercel-labs/skills/issues/1199)), not something the repo can fix by itself.

**On Windows, one-time prerequisite:** enable **Developer Mode** (Settings → Privacy & security → For developers → *Developer Mode*) — this grants symlink-creation rights **without admin** on Win10 1703+. Then set the global default so every future clone materializes links correctly:

```bash
git config --global core.symlinks true
```

**Then repair any skill links this repo already checked out as files** — surgical and safe (it only re-materializes paths git *itself* tracks as symlinks; skills you added by hand are never touched, and it never deletes a directory):

```bash
node launchpad/scripts/fix-skill-symlinks.mjs          # repairs in place, sets core.symlinks=true on the repo
# node launchpad/scripts/fix-skill-symlinks.mjs --check  # report-only (exit 1 if any are still broken)
```

Run it on every harness (macOS/Linux no-op cleanly — links already resolve). If it reports paths it *couldn't* fix, the machine still can't create symlinks (Developer Mode off, or a locked-down/MDM-managed box) — enable Developer Mode and re-run, or re-clone with `git clone -c core.symlinks=true <url>`. **Windows users should take skill updates via `git pull` of a resync run on macOS, Linux or WSL, not a local `npx skills`** — that avoids the CLI's other open Windows bugs.
