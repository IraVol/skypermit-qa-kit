#!/usr/bin/env node
// Validates a <name>.design.json produced by the test-design skill.
// Usage (from the repo root): node .claude/skills/test-design/scripts/check-design.mjs <file.design.json>
// Exit 0 = OK, 1 = problems found (listed on stdout), 2 = usage error.
//
// What it checks mechanically:
//   - every quote's text occurs verbatim in the named spec file
//     (whitespace-normalised, so a sentence wrapped across lines still matches)
//     and starts on the given line
//   - every BV has exactly three values: boundary-1, boundary, boundary+1
//   - the ST matrix has exactly one cell for every state × action pair
//   - every "unknown" result points at an existing unknowns[] id
//   - ids are unique
// It cannot judge whether a quote actually supports the claim — that stays with the skill.

import { readFileSync, existsSync } from 'node:fs';

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const designPath = process.argv[2];
if (!designPath) {
  console.error('usage: check-design.mjs <file.design.json>');
  process.exit(2);
}

let d;
try {
  d = JSON.parse(readFileSync(designPath, 'utf8'));
} catch (e) {
  console.log(`FAIL\n- ${designPath}: not valid JSON (${e.message})`);
  process.exit(1);
}

// ---- spec files -----------------------------------------------------------
const texts = new Map();
const specFiles = Array.isArray(d.spec) ? d.spec : [];
if (!specFiles.length) err('spec', 'must be a non-empty array of spec file paths');
for (const f of specFiles) {
  if (!existsSync(f)) { err('spec', `file not found: ${f}`); continue; }
  const raw = readFileSync(f, 'utf8');
  texts.set(f, { lines: raw.split('\n'), flat: norm(raw) });
}

// ---- unknowns -------------------------------------------------------------
const unknownIds = new Set();
for (const [i, u] of (d.unknowns ?? []).entries()) {
  const where = `unknowns[${i}]`;
  if (!u.id) err(where, 'missing id');
  else if (unknownIds.has(u.id)) err(where, `duplicate id ${u.id}`);
  else unknownIds.add(u.id);
  if (!u.question || !String(u.question).trim()) err(where, 'missing question');
  for (const [j, q] of (u.quotes ?? []).entries()) checkQuote(q, `${where}.quotes[${j}]`);
}

// ---- helpers --------------------------------------------------------------
function checkQuote(q, where) {
  if (!q || typeof q.text !== 'string' || !q.text.trim()) return err(where, 'quote has no text');
  const t = texts.get(q.file);
  if (!t) return err(where, `quote file "${q.file}" is not listed in spec[]`);
  const n = norm(q.text);
  if (!t.flat.includes(n)) {
    return err(where, `not found verbatim in ${q.file}: "${q.text.slice(0, 100)}"`);
  }
  if (!Number.isInteger(q.line) || q.line < 1 || q.line > t.lines.length) {
    return err(where, `line must be an integer within 1..${t.lines.length}`);
  }
  const fromLine = norm(t.lines.slice(q.line - 1).join('\n'));
  const idx = fromLine.indexOf(n);
  const firstLen = norm(t.lines[q.line - 1]).length;
  if (idx < 0 || idx > firstLen) err(where, `quote does not start on line ${q.line} of ${q.file}`);
}

function checkQuotes(item, where, { required }) {
  const qs = item.quotes ?? [];
  if (!Array.isArray(qs)) return err(where, 'quotes must be an array');
  if (required && qs.length === 0) err(where, 'needs at least one quote');
  qs.forEach((q, i) => checkQuote(q, `${where}.quotes[${i}]`));
}

function checkUnknownRef(item, where) {
  if (!item.unknown) return err(where, 'result is "unknown" but no unknown id is given');
  if (!unknownIds.has(item.unknown)) err(where, `unknown "${item.unknown}" is not in unknowns[]`);
}

const ids = new Set();
function checkId(item, where) {
  if (!item.id) return err(where, 'missing id');
  if (ids.has(item.id)) err(where, `duplicate id ${item.id}`);
  ids.add(item.id);
}

// ---- boundary values ------------------------------------------------------
const POSITIONS = ['boundary-1', 'boundary', 'boundary+1'];
const EXPECTED = ['valid', 'invalid', 'unknown'];
let bvValues = 0;
for (const [i, bv] of (d.boundary_values ?? []).entries()) {
  const where = `boundary_values[${i}]${bv.id ? ` (${bv.id})` : ''}`;
  checkId(bv, where);
  checkQuotes(bv, where, { required: true });
  const vals = bv.values ?? [];
  if (vals.length !== 3) err(where, `must have exactly 3 values, has ${vals.length}`);
  vals.forEach((v, j) => {
    const w = `${where}.values[${j}]`;
    bvValues++;
    if (v.position !== POSITIONS[j]) err(w, `position must be "${POSITIONS[j]}", got "${v.position}"`);
    if (!EXPECTED.includes(v.expected)) err(w, `expected must be one of ${EXPECTED.join('/')}`);
    if (v.expected === 'unknown') checkUnknownRef(v, w);
    checkQuotes(v, w, { required: false });
  });
}

// ---- equivalence classes --------------------------------------------------
for (const [i, ec] of (d.equivalence_classes ?? []).entries()) {
  const where = `equivalence_classes[${i}]${ec.id ? ` (${ec.id})` : ''}`;
  checkId(ec, where);
  if (ec.valid === 'unknown') {
    checkUnknownRef(ec, where);
    checkQuotes(ec, where, { required: false });
  } else {
    if (typeof ec.valid !== 'boolean') err(where, 'valid must be true, false or "unknown"');
    checkQuotes(ec, where, { required: true });
  }
}

// ---- state transitions ----------------------------------------------------
let cells = 0, nStates = 0, nActions = 0;
const st = d.state_transitions;
if (!st) {
  err('state_transitions', 'missing — use {"not_applicable": "<reason>"} if the spec has no states');
} else if (typeof st.not_applicable === 'string') {
  // nothing to check
} else {
  const states = (st.states ?? []).map((s) => s.name);
  const actions = (st.actions ?? []).map((a) => a.name);
  nStates = states.length; nActions = actions.length;
  if (!states.length) err('state_transitions.states', 'empty');
  if (!actions.length) err('state_transitions.actions', 'empty');
  (st.states ?? []).forEach((s, i) => checkQuotes(s, `state_transitions.states[${i}] (${s.name})`, { required: true }));
  (st.actions ?? []).forEach((a, i) => checkQuotes(a, `state_transitions.actions[${i}] (${a.name})`, { required: true }));

  const seen = new Set();
  for (const [i, c] of (st.matrix ?? []).entries()) {
    const where = `state_transitions.matrix[${i}] (${c.from} × ${c.action})`;
    cells++;
    checkId(c, where);
    if (!states.includes(c.from)) err(where, `from "${c.from}" is not a listed state`);
    if (!actions.includes(c.action)) err(where, `action "${c.action}" is not a listed action`);
    const key = `${c.from}\u0000${c.action}`;
    if (seen.has(key)) err(where, 'duplicate cell');
    seen.add(key);
    if (c.result === 'legal') {
      const to = Array.isArray(c.to) ? c.to : [c.to];
      if (!c.to || to.some((s) => !states.includes(s))) err(where, 'legal cell needs "to" naming listed state(s)');
      checkQuotes(c, where, { required: true });
    } else if (c.result === 'illegal') {
      checkQuotes(c, where, { required: true });
    } else if (c.result === 'unknown') {
      checkUnknownRef(c, where);
      checkQuotes(c, where, { required: false });
    } else {
      err(where, 'result must be legal / illegal / unknown');
    }
  }
  for (const s of states) for (const a of actions) {
    if (!seen.has(`${s}\u0000${a}`)) err('state_transitions.matrix', `missing cell ${s} × ${a}`);
  }
}

// ---- report ---------------------------------------------------------------
if (errors.length) {
  console.log(`FAIL — ${errors.length} problem(s)`);
  for (const e of errors) console.log(`- ${e}`);
  process.exit(1);
}
const nBv = (d.boundary_values ?? []).length;
const nEc = (d.equivalence_classes ?? []).length;
const stLine = st?.not_applicable ? 'ST n/a' : `ST ${nStates}×${nActions} = ${cells} cells`;
console.log(`OK — BV ${nBv} (${bvValues} values), EP ${nEc}, ${stLine}, unknowns ${unknownIds.size}`);
