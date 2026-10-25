#!/usr/bin/env node
// Emit a compact, phase-tagged digest of every intent so /ql-check-scope can
// reason about whether PR feedback is already covered by future scope without
// loading every full intent file into context.
//
// Canonical source: intents/INT-NNN/intent.md — the LIVING canonical Intent
// (human-authored, refined in-repo via /ql-refine-intent; see AGENTS.md). This
// script only reads it.
//
// Usage: node scope-digest.mjs [--phase N] [--deps] [--neighbors INT-NNN]
//   --phase N  mark intents with phase > N as "FUTURE" (the ones to watch for).
//              If omitted, nothing is marked future; all intents are listed.
//   --deps     append a cross-intent DEPENDENCIES view — every external /
//              cross-team dependency with its system + owner, for the up-front
//              client-alignment conversation (so other IT teams are lined up
//              before the build needs them).
//   --neighbors INT-NNN
//              emit a compact, FOCUSED digest of just ONE intent's neighborhood —
//              what it's built ON (upstream deps, flagged delivered from the
//              ledger), the forward cone of future intents that will build ON it
//              (downstream), and its epic-siblings (same epic, no declared dependency; they may touch the same objects even
//              with no declared dependency). For /ql-design-intent + /ql-start-intent
//              to design in light of past AND future scope without loading every
//              full intent file. Ignores --phase/--deps when set.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Work from inside the active engagement (decisions/0082 W1), and read intents
// with the engine's own parser, so this digest and the scope hash can never
// disagree on what an intent says (#123). Walk up from the cwd to the repo's
// committed launchpad/scripts/intent-ledger.mjs and borrow its resolver and
// parsers. A plugin checkout with no engine in the repo uses the plugin's copy.
// The skill updates with the plugin but the repo's engine only with /ql-resync.
// NEEDS_API is the oldest engine API this script works with; and reaching for an
// export the engine doesn't have says the same thing, rather than a TypeError.
const NEEDS_API = 1;
function checkEngine(mod, path) {
  const stale = (why) => {
    console.error(`${path} is older than this skill (${why}). Run /ql-resync to update it.`);
    process.exit(2);
  };
  if ((mod.ENGINE_API ?? 0) < NEEDS_API) stale(`engine API ${mod.ENGINE_API ?? 0}, needs ${NEEDS_API}`);
  return new Proxy(mod, { get: (m, k) => (typeof k !== 'string' || k === 'then' || k in m ? m[k] : stale(`it has no ${k}`)) });
}
async function loadEngine() {
  for (let d = process.cwd(); ; d = dirname(d)) {
    const engine = join(d, 'launchpad', 'scripts', 'intent-ledger.mjs');
    if (existsSync(engine)) {
      const mod = checkEngine(await import(pathToFileURL(engine).href), engine);
      const taken = mod.takeEngagementArgs(process.argv.slice(2));
      const eng = taken.error ? taken
        : mod.resolveEngagement({ cwd: process.cwd(), flag: taken.flag, qualified: taken.qualified, env: process.env });
      if (eng.error) {
        console.error(eng.error);
        process.exit(2);
      }
      process.chdir(eng.dir);
      process.argv.splice(2, Infinity, ...taken.args);
      return mod;
    }
    if (dirname(d) === d) break;
  }
  const bundled = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates', 'launchpad', 'scripts', 'intent-ledger.mjs');
  if (existsSync(bundled)) return checkEngine(await import(pathToFileURL(bundled).href), bundled);
  console.error('No launchpad/scripts/intent-ledger.mjs found. Run this from an engagement repo (or run /ql-resync to restore the engine).');
  process.exit(2);
}
const engine = await loadEngine();

const INTENTS_DIR = 'intents';
const LEDGER = 'delivery/intent-ledger.md';

const phaseArgIdx = process.argv.indexOf('--phase');
const currentPhase =
  phaseArgIdx !== -1 ? Number(process.argv[phaseArgIdx + 1]) : null;
const showDeps = process.argv.includes('--deps');
const neighborsArgIdx = process.argv.indexOf('--neighbors');
const neighborsId =
  neighborsArgIdx !== -1 ? (process.argv[neighborsArgIdx + 1] || '') : null;

function loadIntents() {
  let dirs;
  try {
    dirs = readdirSync(INTENTS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^INT-\d+/i.test(e.name))
      .map((e) => e.name);
  } catch (e) {
    console.error(`Could not read ${INTENTS_DIR}/: ${e.message}`);
    console.error('Run from the engagement repo root. If intents/ is missing,');
    console.error('run /ql-ingest-scopezilla to seed it from the Scopezilla output.');
    process.exit(1);
  }
  const intents = [];
  for (const dir of dirs) {
    const path = `${INTENTS_DIR}/${dir}/intent.md`;
    try { intents.push(engine.parseIntentFile(readFileSync(path, 'utf8'), path).intent); }
    catch { /* skip a dir with no intent.md — validate surfaces it */ }
  }
  return intents.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

const intents = loadIntents();
const list = (arr) => (arr && arr.length ? arr : []);

// Canonical intent id: uppercase, numeric part zero-padded to 3, so a typed
// "INT-5" matches the "INT-005" on disk. The engine's own, so the two can't drift.
const normId = (raw) => engine.normId(raw);

// Read delivery status per intent from the ledger, soft (missing ledger → {}).
// The digest stays read-only; this only enriches the neighborhood with "already
// delivered" so the design builds consistently with what's shipped. Read with
// the engine's ledger parser, the one the gates use.
function loadLedgerStatus() {
  let text;
  try { text = readFileSync(LEDGER, 'utf8'); }
  catch { return {}; }
  const { byId } = engine.parseLedgerText(text);
  return Object.fromEntries(Object.entries(byId).map(([id, row]) => [normId(id), row.status]));
}
// Short, glanceable status label (empty string when not tracked / no ledger).
function statusLabel(raw) {
  // Read the cell's leading status token, as the engine's gates do, not a
  // substring: "⬜ Not started (delivered under INT-004)" is not Delivered.
  // Retired is surfaced: a de-scoped neighbor is exactly what check-scope must
  // not hide (#139).
  const s = String(raw || '').replace(/[`*~]/g, '').trim();
  const lead = s.split(/[(—]|\s-+\s/)[0].trim().toLowerCase();
  if (s.startsWith('🚫') || lead === 'retired') return '🚫 Retired';
  if (s.startsWith('🔄') || lead === 'needs re-verify') return '🔄 Needs re-verify';
  if (s.startsWith('✅') || lead === 'delivered') return '✅ Delivered';
  if (s.startsWith('🔧') || lead === 'in progress') return '🔧 In progress';
  return '';
}

// ── --neighbors INT-NNN: the focused neighborhood digest ─────────────────────
// Emits just ONE intent's neighborhood so /ql-design-intent and /ql-start-intent can
// design in light of PAST and FUTURE scope without loading every intent file:
//   • BUILT ON      — the upstream internal-dependency cone (what must exist
//                     first), tagged with delivered status from the ledger.
//   • BUILDS ON THIS — the downstream forward cone (future intents that depend
//                     on this one). Designing so you don't corner these is the
//                     gap this whole mode exists to close.
//   • EPIC SIBLINGS — same epic_id, no declared dependency. The honest proxy
//                     for "likely touches the same objects" that the dependency
//                     graph alone can't see.
if (neighborsId !== null) {
  const targetId = normId(neighborsId);
  if (!/^INT-\d+/.test(targetId)) {
    console.error('Usage: node scope-digest.mjs --neighbors INT-NNN');
    process.exit(2);
  }
  const byId = Object.fromEntries(intents.map((i) => [normId(i.id), i]));
  const target = byId[targetId];
  if (!target) {
    console.error(`No intent matched "${neighborsId}". Known: ${intents.map((i) => i.id).join(', ') || '(none)'}`);
    process.exit(1);
  }
  const ledger = loadLedgerStatus();
  const truncate = (s, n = 220) => {
    const t = (s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
  };

  // Forward adjacency (upstream): id → the intents it depends on.
  // Reverse adjacency (downstream): id → the intents that depend on it.
  const upstreamOf = {}, downstreamOf = {};
  for (const i of intents) {
    const id = normId(i.id);
    upstreamOf[id] = upstreamOf[id] || [];
    for (const raw of list(i.dependencies && i.dependencies.internal)) {
      const dep = normId(raw);
      upstreamOf[id].push(dep);
      (downstreamOf[dep] = downstreamOf[dep] || []).push(id);
    }
  }
  // BFS the cone from `start` over `adj`, recording each reached node's first
  // predecessor (for the "via INT-xxx" transitive annotation). Excludes start.
  const cone = (start, adj) => {
    const seen = new Set([start]);
    const via = {}; // id → immediate predecessor it was first reached through
    const order = [];
    let frontier = [start];
    while (frontier.length) {
      const next = [];
      for (const node of frontier) {
        for (const n of (adj[node] || [])) {
          if (seen.has(n)) continue;
          seen.add(n);
          via[n] = node;
          order.push(n);
          next.push(n);
        }
      }
      frontier = next;
    }
    return { order, via, directs: new Set(adj[start] || []) };
  };

  const meta = (id) => {
    const i = byId[id];
    if (!i) return { id, phase: '?', title: '(unknown intent — dependency does not resolve)', missing: true };
    return { id, phase: i.phase, title: i.title, epic_id: i.epic_id, build_target: i.build_target };
  };
  const statusOf = (id) => statusLabel(ledger[id]);

  const header = `${targetId} · phase ${target.phase} · epic ${target.epic_id || '—'}${statusOf(targetId) ? ` · ${statusOf(targetId)}` : ''}`;
  console.log(header);
  console.log(target.title);
  if (target.build_target) console.log(`\n  BUILD TARGET: ${truncate(target.build_target, 400)}`);
  if (target.grounding && target.grounding.entries?.length) {
    console.log('\n  GROUNDING (the approved requirement/architecture this build must conform to — flag any deviation):');
    for (const e of target.grounding.entries) console.log(`    - ${e.label ? e.label + ': ' : ''}${e.value}`);
  }

  const printCone = (ids, via, directs, { withTarget }) => {
    for (const id of ids) {
      const m = meta(id);
      const st = statusOf(id);
      const viaNote = directs.has(id) ? '' : `  (transitive via ${via[id]})`;
      const stNote = st ? ` · ${st}` : '';
      console.log(`  - ${m.id} · phase ${m.phase}${stNote}${viaNote}`);
      console.log(`      ${m.title}`);
      if (withTarget && m.build_target) console.log(`      BUILD TARGET: ${truncate(m.build_target)}`);
    }
  };

  const up = cone(targetId, upstreamOf);
  console.log(`\n${'─'.repeat(72)}`);
  console.log('BUILT ON (upstream — must exist first; ✅ = already delivered, build consistent with it):');
  if (up.order.length) printCone(up.order, up.via, up.directs, { withTarget: true });
  else console.log('  (no declared internal dependencies)');

  const down = cone(targetId, downstreamOf);
  console.log(`\n${'─'.repeat(72)}`);
  console.log('BUILDS ON THIS (downstream forward cone — design so you don\'t paint these into a corner):');
  if (down.order.length) printCone(down.order, down.via, down.directs, { withTarget: true });
  else console.log('  (nothing declares a dependency on this intent yet — but check epic siblings below)');

  // Epic siblings: same epic_id, not already shown in either cone, not self.
  const shown = new Set([targetId, ...up.order, ...down.order]);
  const siblings = target.epic_id
    ? intents.filter((i) => i.epic_id && i.epic_id === target.epic_id && !shown.has(normId(i.id)))
    : [];
  console.log(`\n${'─'.repeat(72)}`);
  console.log(`EPIC SIBLINGS (epic ${target.epic_id || '—'}, no declared dependency):`);
  if (siblings.length) {
    for (const i of siblings) {
      const sid = normId(i.id);
      const st = statusOf(sid);
      console.log(`  - ${sid} · phase ${i.phase}${st ? ` · ${st}` : ''}`);
      console.log(`      ${i.title}`);
    }
  } else {
    console.log(target.epic_id ? '  (no other intents in this epic)' : '  (this intent has no epic_id)');
  }

  console.log(`\n${'─'.repeat(72)}`);
  console.log('Reason over this BEFORE choosing the data model / relationships: reuse what BUILT ON');
  console.log('delivered; leave room for what BUILDS ON THIS; expect epic siblings to touch the same');
  console.log('objects. Where a future intent needs a shape this build precludes, flag it — don\'t silently');
  console.log('pick an approach that corners it.');
  process.exit(0);
}

for (const i of intents) {
  const future =
    currentPhase != null && typeof i.phase === 'number' && i.phase > currentPhase;
  const tag = future ? '  ⟵ FUTURE PHASE (watch for this)' : '';
  console.log(`\n${'='.repeat(72)}`);
  console.log(`${i.id} · phase ${i.phase} · epic ${i.epic_id} · ${i.confidence}${tag}`);
  console.log(`${i.title}`);
  if (i.build_target) console.log(`\n  BUILD TARGET: ${i.build_target}`);
  const oos = list(i.out_of_scope);
  if (oos.length) {
    console.log('\n  OUT OF SCOPE (explicitly deferred):');
    for (const x of oos) console.log(`    - ${x}`);
  }
  const deps = i.dependencies || {};
  if ((deps.internal && deps.internal.length) || (deps.external && deps.external.length)) {
    console.log('\n  DEPENDENCIES:');
    for (const d of list(deps.internal)) console.log(`    - internal: ${d}`);
    for (const e of list(deps.external)) {
      console.log(`    - external: ${e.system}${e.need ? ` — ${e.need}` : ''}${e.owner ? ` (owner: ${e.owner})` : ''}`);
    }
  }
  if (i.grounding && i.grounding.entries?.length) {
    console.log('\n  GROUNDING (approved requirement/architecture backing this intent):');
    for (const e of i.grounding.entries) console.log(`    - ${e.label ? e.label + ': ' : ''}${e.value}`);
  }
  const oq = list(i.open_questions);
  if (oq.length) {
    console.log('\n  OPEN QUESTIONS (if unanswered, building the dependent behavior is premature):');
    for (const q of oq) {
      const status = q.answer ? `ANSWERED: ${q.answer}` : 'UNANSWERED';
      console.log(`    - ${q.id ? q.id + ': ' : ''}${q.question}  [${status}]`);
    }
  }
}

console.log(`\n${'='.repeat(72)}`);
console.log(`${intents.length} intents across phases ${[...new Set(intents.map((i) => i.phase))].sort().join(', ')}.`);
if (currentPhase != null) console.log(`Current phase = ${currentPhase}; FUTURE = anything after it.`);

// ── Cross-intent dependencies view (for the client-alignment conversation) ───
if (showDeps) {
  console.log(`\n${'='.repeat(72)}`);
  console.log('EXTERNAL / CROSS-TEAM DEPENDENCIES — line these up before the build needs them');
  console.log('='.repeat(72));
  const ext = [];
  for (const i of intents) {
    for (const e of list(i.dependencies && i.dependencies.external)) {
      ext.push({ intent: i.id, phase: i.phase, ...e });
    }
  }
  if (!ext.length) {
    console.log('\n  (none declared)');
  } else {
    // Group by system so one team sees everything asked of them at once.
    const bySystem = {};
    for (const e of ext) (bySystem[e.system] = bySystem[e.system] || []).push(e);
    for (const [system, items] of Object.entries(bySystem)) {
      const owner = items.find((x) => x.owner)?.owner;
      console.log(`\n  ${system}${owner ? ` — owner: ${owner}` : ''}`);
      for (const e of items.sort((a, b) => (a.phase ?? 0) - (b.phase ?? 0))) {
        console.log(`    - [${e.intent}, phase ${e.phase}] ${e.need || '(need unspecified)'}`);
      }
    }
  }

  console.log(`\n${'-'.repeat(72)}`);
  console.log('INTERNAL (Salesforce build-order) DEPENDENCIES:');
  let anyInternal = false;
  for (const i of intents) {
    const internal = list(i.dependencies && i.dependencies.internal);
    if (!internal.length) continue;
    anyInternal = true;
    console.log(`  ${i.id} (phase ${i.phase}) depends on: ${internal.join(', ')}`);
  }
  if (!anyInternal) console.log('  (none declared)');
}
