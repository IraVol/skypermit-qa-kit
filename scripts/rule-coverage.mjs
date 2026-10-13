#!/usr/bin/env node
// Cross-references the rule_reference table in skypermit's business rules doc
// against the test cases in test-cases/, and reports which rules have no case.
//
// Usage:
//   node scripts/rule-coverage.mjs              # table to stdout
//   node scripts/rule-coverage.mjs --markdown   # markdown, for pasting into a ticket
//   node scripts/rule-coverage.mjs --gaps       # only uncovered rules
//   node scripts/rule-coverage.mjs --rules <path> --cases <dir>
//
// Exit code is 1 when any rule is uncovered, so CI can gate on it.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const REPO = resolve(import.meta.dirname, "..");
const RULES_DOC = resolve(REPO, opt("rules", "../skypermit/docs/06-business-rules.md"));
const CASES_DIR = resolve(REPO, opt("cases", "test-cases"));

// A citation looks like "OH-1 §2.1", "ZC-2026.1 §2", "A-7 §1", "TSD-4 §3".
const CITATION = /\b([A-Z]+-[\d.]+(?:\.\d+)?)\s*§\s*([\d.]+)/g;

function fail(msg) {
  console.error(`rule-coverage: ${msg}`);
  process.exit(2);
}

// --- Parse the rule_reference table out of section 6 -----------------------

function parseRules(path) {
  let doc;
  try {
    doc = readFileSync(path, "utf8");
  } catch {
    fail(`cannot read rules doc at ${path}\n  Pass --rules <path> if skypermit lives elsewhere.`);
  }

  // Narrow to the "## 6. `rule_reference` values" section so we don't pick up
  // the illustrative citations scattered through the rest of the document.
  const start = doc.search(/^##\s*6\..*rule_reference/im);
  if (start === -1) {
    fail(
      `no "## 6. rule_reference values" section in ${relative(REPO, path)}.\n` +
        `  The doc may have been restructured — check it and update this script.`,
    );
  }
  const rest = doc.slice(start);
  const end = rest.search(/^##\s(?!\s*6\.)/m);
  const section = end === -1 ? rest : rest.slice(0, end);

  const rules = [];
  for (const line of section.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) continue;
    if (/^-+$/.test(cells[0].replace(/[\s:]/g, ""))) continue; // separator row
    if (/^Gate$/i.test(cells[0])) continue; // header row

    const clean = (s) =>
      s
        .replace(/\*\(.*?\)\*/g, "") // trailing italic annotations
        .replace(/[`*]/g, "")
        .trim();

    const gate = clean(cells[0]);
    const condition = clean(cells[1]);
    const citation = clean(cells[2]);
    if (!citation) continue;

    rules.push({
      gate: /^\(n\/a/i.test(gate) ? "(not a gate)" : gate,
      condition,
      citation,
    });
  }

  if (rules.length === 0) fail("parsed the section but found no table rows");
  return rules;
}

// --- Parse test cases -----------------------------------------------------

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (entry.endsWith(".md") && entry.toLowerCase() !== "readme.md") out.push(p);
  }
  return out;
}

// A case often names a citation in order to say the code must NOT return it
// (E2E-OP-006 asserts A-7 §1 "(not the unamended ZC-2026.1 §3 value)"). Those
// mentions are the opposite of coverage, so drop any citation preceded by a
// negation within the same clause.
const NEGATION = /\b(?:not|never|rather than|instead of|no longer|as opposed to)\b[^.;]*$/i;

function citationsIn(text) {
  const found = new Set();
  for (const m of text.matchAll(CITATION)) {
    // Look back to the start of the clause; if a negation sits between the
    // clause boundary and this citation, the citation is being excluded.
    const clauseStart = Math.max(
      text.lastIndexOf(".", m.index),
      text.lastIndexOf(";", m.index),
      text.lastIndexOf("(", m.index),
      text.lastIndexOf("\n-", m.index),
    );
    const before = text.slice(clauseStart + 1, m.index);
    if (NEGATION.test(before)) continue;
    found.add(`${m[1]} §${m[2]}`);
  }
  return found;
}

function parseCases(dir) {
  const cases = [];
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    // Split on "### <ID>: <title>" headings.
    const parts = text.split(/^###\s+/m).slice(1);
    for (const part of parts) {
      const heading = part.slice(0, part.indexOf("\n"));
      const idMatch = heading.match(/^([A-Z0-9-]+)\s*:\s*(.*)$/);
      if (!idMatch) continue;

      // Citations actually ASSERTED live in Expected result. Citations merely
      // mentioned in Doc ref are weaker evidence — a case can cite a rule for
      // context while asserting a different one (see E2E-OP-006, which cites
      // TSD-4 §4 and ZC-2026.1 for background but asserts only A-7 §1).
      const section = (name) => {
        const re = new RegExp(`\\*\\*${name}[^*]*\\*\\*:?([\\s\\S]*?)(?=\\n\\*\\*|$)`, "i");
        return (part.match(re)?.[1] ?? "").trim();
      };

      cases.push({
        id: idMatch[1],
        title: idMatch[2].trim(),
        file: relative(REPO, file),
        asserted: citationsIn(section("Expected result")),
        referenced: citationsIn(section("Doc ref")),
      });
    }
  }
  return cases;
}

// --- Correlate ------------------------------------------------------------

const rules = parseRules(RULES_DOC);
const cases = parseCases(CASES_DIR);

const rows = rules.map((rule) => {
  const asserting = cases.filter((c) => c.asserted.has(rule.citation));
  const referencing = cases.filter(
    (c) => !c.asserted.has(rule.citation) && c.referenced.has(rule.citation),
  );
  return {
    ...rule,
    asserting,
    referencing,
    status: asserting.length ? "covered" : referencing.length ? "referenced" : "GAP",
  };
});

// Citations asserted by a case but absent from the doc — a stale case, or a
// citation the doc dropped.
const known = new Set(rules.map((r) => r.citation));
const orphans = [];
for (const c of cases) {
  for (const cite of c.asserted) {
    if (!known.has(cite)) orphans.push({ id: c.id, file: c.file, citation: cite });
  }
}

// --- Report ---------------------------------------------------------------

const gaps = rows.filter((r) => r.status === "GAP");
const covered = rows.filter((r) => r.status === "covered");
const referenced = rows.filter((r) => r.status === "referenced");
const shown = flag("gaps") ? gaps : rows;

if (flag("markdown")) {
  console.log(`# rule_reference coverage\n`);
  console.log(
    `${covered.length}/${rows.length} asserted · ${referenced.length} referenced only · ${gaps.length} uncovered\n`,
  );
  console.log(`| Status | Gate | Condition | rule_reference | Cases |`);
  console.log(`|---|---|---|---|---|`);
  for (const r of shown) {
    const mark = r.status === "covered" ? "covered" : r.status === "referenced" ? "ref only" : "**GAP**";
    const ids = [...r.asserting.map((c) => c.id), ...r.referencing.map((c) => `(${c.id})`)].join(", ");
    console.log(`| ${mark} | \`${r.gate}\` | ${r.condition} | \`${r.citation}\` | ${ids || "—"} |`);
  }
} else {
  const pad = (s, n) => String(s).padEnd(n);
  const w = Math.max(16, ...shown.map((r) => r.citation.length + 2));
  console.log();
  for (const r of shown) {
    const mark = r.status === "covered" ? " ok " : r.status === "referenced" ? "ref?" : "GAP!";
    const ids = [...r.asserting.map((c) => c.id), ...r.referencing.map((c) => `(${c.id})`)].join(", ");
    console.log(`  ${mark}  ${pad(r.citation, w)}${pad(r.gate, 14)}${r.condition}${ids ? `  → ${ids}` : ""}`);
  }
  console.log(
    `\n  ${covered.length}/${rows.length} asserted · ${referenced.length} referenced only · ${gaps.length} uncovered`,
  );
  if (referenced.length) {
    console.log(
      `\n  "ref?" = a case mentions the citation in its Doc ref but doesn't assert it\n` +
        `  in Expected result. Treat as uncovered until a case actually asserts it.`,
    );
  }
}

if (orphans.length) {
  console.log(`\n  Asserted but not in the doc's table (stale case, or dropped citation):`);
  for (const o of orphans) console.log(`    ${o.citation}  ${o.id}  ${o.file}`);
}

console.log();
process.exit(gaps.length > 0 ? 1 : 0);
