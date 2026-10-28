#!/usr/bin/env node
// Lists skypermit business rules that no test case asserts yet, grouped by
// gate, with everything a case generator needs to cover each one: the rule
// text from 06-business-rules.md §1, the clarification that touches it from
// 07-clarifications.md, and a pre-assigned case ID and target file.
//
// Step 1 of the /cover-gaps skill — injected into the skill's prompt so the
// model never has to read the business-rules doc itself.
//
// A rule is keyed by (gate, rule_reference), not by citation alone.
// ZC-2026.1 §2 is shared by the AIRCRAFT weight-band rule and the ZONE
// altitude rule, so a case asserting that citation only covers the rule whose
// gate it also names.
//
// Usage:
//   node scripts/uncovered-rules.mjs                    # every gap, every gate
//   node scripts/uncovered-rules.mjs 3 TIME_WINDOW      # at most 3 gaps in one gate
//   node scripts/uncovered-rules.mjs TIME_WINDOW 3      # argument order doesn't matter
//   node scripts/uncovered-rules.mjs 3 TIME_WINDOW --json
//
// Gates: PILOT, AIRCRAFT, ZONE, TIME_WINDOW, REGISTRATION (the OH-1 §3
// weight ceiling, which is checked at /aircraft, not by a gate).
//
// Exit: 0 report printed (including "no gaps" and bad-argument messages, so
// the skill's prompt injection always gets readable text) · 2 docs unreadable.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "..");
const DOCS = resolve(REPO, "../skypermit/docs");
const RULES_DOC = join(DOCS, "06-business-rules.md");
const CLARIFICATIONS_DOC = join(DOCS, "07-clarifications.md");
const CASES_DIR = join(REPO, "test-cases");
// Worked examples also consume IDs — "never reused" per the test-case template.
const ID_SOURCES = [CASES_DIR, join(REPO, ".claude/skills")];

const GATES = ["PILOT", "AIRCRAFT", "ZONE", "TIME_WINDOW", "REGISTRATION"];
// "OH-1 §2.1", "ZC-2026.1 §2", "A-7 §1", also "`OH-1` §2.3" as §1's tables write it.
const CITATION = /\b([A-Z]+-\d+(?:\.\d+)*)`?\s*§\s*(\d+(?:\.\d+)*)/g;

// --- Arguments ------------------------------------------------------------

const argv = process.argv.slice(2);
const json = argv.includes("--json");
let max = Infinity;
let gate = null;
for (const a of argv.filter((x) => !x.startsWith("--"))) {
  if (/^\d+$/.test(a)) max = Number(a);
  else gate = a.toUpperCase();
}
if (gate && !GATES.includes(gate)) {
  console.log(`ERROR: unknown gate "${gate}". Valid gates: ${GATES.join(", ")}.`);
  process.exit(0);
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    console.error(`uncovered-rules: cannot read ${path}`);
    process.exit(2);
  }
}

const clean = (s) =>
  s
    .replace(/\*\(.*?\)\*/g, "")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const citationsIn = (s) => new Set([...s.matchAll(CITATION)].map((m) => `${m[1]} §${m[2]}`));

function tableRows(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2 || /^[-:\s]+$/.test(cells.join(""))) continue;
    rows.push(cells);
  }
  return rows;
}

// Slice a markdown doc from a heading matching `re` up to the next heading of
// the same or higher level.
function section(doc, re) {
  const m = doc.match(re);
  if (!m) return "";
  const level = (m[0].match(/^#+/) ?? ["##"])[0].length;
  const rest = doc.slice(m.index + m[0].length);
  const end = rest.search(new RegExp(`^#{1,${level}}\\s`, "m"));
  return end === -1 ? rest : rest.slice(0, end);
}

// --- Rules: §6 table, enriched from §1 and 07 -----------------------------

const rulesDoc = read(RULES_DOC);
const clarDoc = read(CLARIFICATIONS_DOC);

const table6 = section(rulesDoc, /^##\s*6\..*rule_reference.*$/im);
if (!table6) {
  console.error("uncovered-rules: no '## 6. rule_reference values' section — has 06-business-rules.md been restructured?");
  process.exit(2);
}

const rules = [];
for (const cells of tableRows(table6)) {
  if (/^Gate$/i.test(cells[0]) || cells.length < 3) continue;
  // "*(n/a — registration, not a gate)*" — test before clean() strips the italics.
  rules.push({
    gate: /n\/a/i.test(cells[0]) ? "REGISTRATION" : clean(cells[0]),
    condition: clean(cells[1]),
    rule_reference: clean(cells[2]),
    unconfirmed: /not yet fully confirmed/i.test(cells[2]),
  });
}

// §1 has one subsection per gate (### 1.x `GATE`) with Condition | Rule | Source
// tables. REGISTRATION's row lives in the AIRCRAFT subsection's second table.
const gateSections = {};
for (const g of GATES.slice(0, 4)) {
  gateSections[g] = section(rulesDoc, new RegExp("^###\\s*1\\.\\d\\s*`" + g + "`.*$", "m"));
}
gateSections.REGISTRATION = gateSections.AIRCRAFT;

// Crude stemming ("overlaps" ~ "overlap") is enough for §1's short condition labels.
const words = (s) => new Set((s.toLowerCase().match(/[a-z]{4,}/g) ?? []).map((w) => w.slice(0, 6)));

function ruleText(rule) {
  // Skip header rows and the per-zone curfew table (first cell is a zone code).
  const rows = tableRows(gateSections[rule.gate] ?? "").filter(
    (r) => r.length >= 3 && !/^(Condition|What|Zone)$/i.test(r[0]) && !/^`[A-Z]{3}-/.test(r[0]),
  );
  // Prefer a row whose Source cites exactly this rule; fall back to word
  // overlap with the condition (curfew rows cite TSD-4 §4, while §6 splits
  // curfew failures by zone into A-7 §1 / ZC-2026.1 §3).
  let row = rows.find((r) => citationsIn(r[2]).has(rule.rule_reference) && (rule.gate !== "REGISTRATION" || /registration/i.test(r[0])));
  if (!row) {
    const want = words(rule.condition);
    row = rows
      .map((r) => [r, [...words(r[0])].filter((w) => want.has(w)).length])
      .sort((a, b) => b[1] - a[1])
      .find(([, n]) => n > 0)?.[0];
  }
  return row ? { text: clean(row[1]), source: clean(row[2]) } : { text: null, source: null };
}

// Curfew rules: list which zones (and hours) this citation governs.
function curfewZones(rule) {
  if (!/curfew/i.test(rule.condition)) return null;
  // The per-zone curfew table sits under a bold label, not a heading, inside §1.4.
  const zones = tableRows(gateSections.TIME_WINDOW)
    .filter((r) => r.length === 3 && /^`[A-Z]{3}-/.test(r[0]))
    .filter((r) => !/none/i.test(r[1]) && citationsIn(r[2]).has(rule.rule_reference))
    .map((r) => `${clean(r[0])} ${clean(r[1])}`);
  return zones.length ? zones : null;
}

// 07 items (## N. Title) that mention this rule's citation.
const clarItems = [...clarDoc.matchAll(/^##\s*(\d+)\.\s*(.+)$/gm)].map((m) => ({
  n: m[1],
  title: clean(m[2]),
  body: section(clarDoc, new RegExp(`^##\\s*${m[1]}\\..*$`, "m")),
}));

for (const r of rules) {
  Object.assign(r, ruleText(r));
  r.curfew_zones = curfewZones(r);
  r.clarifications = clarItems
    .filter((c) => citationsIn(c.body).has(r.rule_reference))
    .map((c) => `07 item ${c.n}: ${c.title}`);
}

// --- Test cases -----------------------------------------------------------

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (e.endsWith(".md")) out.push(p);
  }
  return out;
}

// A citation preceded by a negation in the same clause is being excluded,
// not asserted (E2E-OP-006: "A-7 §1 (not the unamended ZC-2026.1 §3 value)").
const NEGATION = /\b(?:not|never|rather than|instead of|no longer|as opposed to)\b[^.;]*$/i;
function assertedCitations(text) {
  const found = new Set();
  for (const m of text.matchAll(CITATION)) {
    const start = Math.max(
      text.lastIndexOf(".", m.index),
      text.lastIndexOf(";", m.index),
      text.lastIndexOf("(", m.index),
      text.lastIndexOf("\n-", m.index),
    );
    if (!NEGATION.test(text.slice(start + 1, m.index))) found.add(`${m[1]} §${m[2]}`);
  }
  return found;
}

const field = (part, name) =>
  (part.match(new RegExp(`\\*\\*${name}[^*]*\\*\\*:?([\\s\\S]*?)(?=\\n\\*\\*|$)`, "i"))?.[1] ?? "").trim();

const cases = [];
for (const file of walk(CASES_DIR).filter((f) => !/readme\.md$/i.test(f))) {
  for (const part of readFileSync(file, "utf8").split(/^###\s+/m).slice(1)) {
    const id = part.match(/^(E2E-[A-Z]+-\d+(?:\.\d+)?)\s*:/)?.[1];
    if (!id) continue;
    const expected = field(part, "Expected result");
    cases.push({
      id,
      file: relative(REPO, file),
      expected,
      asserted: assertedCitations(expected),
      referenced: citationsIn(field(part, "Doc ref")),
    });
  }
}

const sharedCitation = (cite) => rules.filter((r) => r.rule_reference === cite).length > 1;
const gateNamed = (text, g) => new RegExp(`\\b${g}\\b`).test(text);

for (const r of rules) {
  const asserts = (c) =>
    c.asserted.has(r.rule_reference) && (!sharedCitation(r.rule_reference) || gateNamed(c.expected, r.gate));
  r.covered_by = cases.filter(asserts).map((c) => c.id);
  r.referenced_by = cases.filter((c) => !asserts(c) && c.referenced.has(r.rule_reference)).map((c) => c.id);
}

// --- Select gaps and pre-assign IDs ---------------------------------------

const inScope = rules.filter((r) => !gate || r.gate === gate);
const gaps = inScope.filter((r) => r.covered_by.length === 0);
const selected = gaps.slice(0, max);

let lastOp = 0;
for (const dir of ID_SOURCES) {
  for (const f of walk(dir)) {
    for (const m of readFileSync(f, "utf8").matchAll(/\bE2E-OP-(\d{3})\b/g)) lastOp = Math.max(lastOp, Number(m[1]));
  }
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

selected.forEach((r, i) => {
  r.case_id = `E2E-OP-${String(lastOp + 1 + i).padStart(3, "0")}`;
  const module = r.gate === "REGISTRATION" ? "registry" : "flight-request";
  r.file = `test-cases/${module}/${r.case_id}-${slug(r.condition)}.md`;
});

// --- Report ---------------------------------------------------------------

const summary = {
  scope: { gate: gate ?? "ALL", max: Number.isFinite(max) ? max : null },
  rules_checked: inScope.length,
  gaps_found: gaps.length,
  selected: selected.length,
  gaps: selected.map(({ gate, condition, rule_reference, case_id, file, text, source, curfew_zones, clarifications, unconfirmed, referenced_by }) => ({
    rule_reference,
    gate,
    condition,
    case_id,
    file,
    rule: text,
    source,
    ...(curfew_zones && { curfew_zones }),
    ...(clarifications.length && { clarifications }),
    ...(unconfirmed && { unconfirmed_citation: true }),
    ...(referenced_by.length && { referenced_only_by: referenced_by }),
  })),
};

if (json) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const out = [];
out.push(`scope: gate=${summary.scope.gate}, max=${summary.scope.max ?? "all"}`);
out.push(`rules_checked: ${summary.rules_checked} · gaps_found: ${summary.gaps_found} · selected for this run: ${summary.selected}`);
if (!selected.length) {
  out.push("", "No uncovered rules in scope — nothing to generate.");
} else {
  for (const g of GATES) {
    const group = summary.gaps.filter((x) => x.gate === g);
    if (!group.length) continue;
    out.push("", `## ${g}`);
    for (const x of group) {
      out.push("", `### ${x.rule_reference} — ${x.condition}`);
      out.push(`- case_id: ${x.case_id}`);
      out.push(`- file: ${x.file}`);
      out.push(`- rule: ${x.rule ?? "(no §1 row found — read 06-business-rules.md for this one)"}`);
      if (x.source && x.source !== x.rule_reference) out.push(`- source as written in §1: ${x.source}`);
      if (x.curfew_zones) out.push(`- zones governed by this citation: ${x.curfew_zones.join("; ")}`);
      if (x.clarifications) out.push(`- clarifications: ${x.clarifications.join("; ")}`);
      if (x.unconfirmed_citation) out.push(`- ⚠ citation not yet confirmed (05-open-questions.md row 5) — also add to open_questions`);
      if (x.referenced_only_by) out.push(`- mentioned (not asserted) in Doc ref of: ${x.referenced_only_by.join(", ")}`);
    }
  }
}
console.log(out.join("\n"));
