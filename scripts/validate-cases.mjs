#!/usr/bin/env node
// Structural validation of test-case files: required fields, ID format and
// uniqueness, Doc ref path convention, and whether cited docs actually exist.
//
// This checks only what can be decided deterministically. Whether a case is
// logically sound — do the Steps reach the state the Preconditions promise,
// does the Expected result follow, does the cited section actually say what
// the case claims — needs judgment and the app's source; that is the
// case-reviewer agent's job, not this script's.
//
// Usage:
//   node scripts/validate-cases.mjs
//   node scripts/validate-cases.mjs --json
//   node scripts/validate-cases.mjs --cases <dir> --app <dir>
//
// Exit: 0 clean · 1 problems found · 2 could not run.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const REPO = resolve(import.meta.dirname, "..");
const CASES_DIR = resolve(REPO, opt("cases", "test-cases"));
// Doc refs are written repo-rooted as `skypermit/docs/...`, which resolves
// against the parent of this kit.
const APP_PARENT = resolve(REPO, opt("app", ".."));

const REQUIRED = ["Doc ref", "Role(s)", "Steps", "Expected result", "Rationale"];
const OPTIONAL = ["Preconditions"];
const ID_FORMAT = /^E2E-(OP|REV|X)-\d{3}$/;
const VALID_ROLES = /^(Operator|Reviewer|Operator\s*(?:→|->)\s*Reviewer|Reviewer\s*(?:→|->)\s*Operator)\b/i;

function fail(msg) {
  console.error(`validate-cases: ${msg}`);
  process.exit(2);
}

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    fail(`cannot read cases directory at ${dir}\n  Pass --cases <dir> if it lives elsewhere.`);
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (e.endsWith(".md") && e.toLowerCase() !== "readme.md") out.push(p);
  }
  return out;
}

// Pull field blocks, stopping at the next field or heading. Both
// "**Field:** value" (colon inside the asterisks) and "**Field**: value"
// occur in practice, so the colon is optional on either side.
function fieldsOf(body) {
  const found = {};
  const FIELD = String.raw`^\*\*\s*([^*\n]+?)\s*:?\s*\*\*\s*:?`;
  // The terminator must not include a bare `$`: under the `m` flag that
  // matches every line end, which truncates each field to its first line.
  // Only another field heading, a `###` heading, or the true end of input
  // ends a field — hence \Z, spelled here as a negative lookahead.
  const re = new RegExp(`${FIELD}([\\s\\S]*?)(?=${FIELD}|^###\\s|(?![\\s\\S]))`, "gm");
  for (const m of body.matchAll(re)) {
    found[m[1].trim()] = (m[2] ?? "").trim();
  }
  return found;
}

const files = walk(CASES_DIR);
if (files.length === 0) fail(`no case files found under ${relative(REPO, CASES_DIR)}`);

const cases = [];
const problems = [];
const seenIds = new Map();

for (const file of files) {
  const rel = relative(REPO, file);
  const text = readFileSync(file, "utf8");
  const chunks = text.split(/^###\s+/m).slice(1);

  if (chunks.length === 0) {
    problems.push({ file: rel, id: null, kind: "no-cases", msg: "no `### <ID>: <Title>` headings found" });
    continue;
  }

  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    const heading = (nl === -1 ? chunk : chunk.slice(0, nl)).trim();
    const body = nl === -1 ? "" : chunk.slice(nl);

    const hm = heading.match(/^(\S+?)\s*:\s*(.+)$/);
    if (!hm) {
      problems.push({
        file: rel,
        id: null,
        kind: "bad-heading",
        msg: `heading is not "<ID>: <Title>" — got "${heading}"`,
      });
      continue;
    }
    const [, id, title] = [hm[0], hm[1], hm[2].trim()];
    const c = { id, title, file: rel };
    cases.push(c);

    const add = (kind, msg) => problems.push({ file: rel, id, kind, msg });

    // --- ID ---
    if (!ID_FORMAT.test(id)) {
      add("id-format", `ID "${id}" does not match E2E-<OP|REV|X>-<3 digits>`);
    }
    if (seenIds.has(id)) {
      add("id-duplicate", `ID reused — also defined in ${seenIds.get(id)}`);
    } else {
      seenIds.set(id, rel);
    }

    // --- Title ---
    if (!title) add("title-missing", "heading has no title after the ID");
    else if (title.length > 90) add("title-long", `title is ${title.length} chars; keep it to one line`);

    // --- Fields ---
    const fields = fieldsOf(body);
    const names = Object.keys(fields);

    for (const req of REQUIRED) {
      const match = names.find((n) => n.toLowerCase() === req.toLowerCase());
      if (!match) add("field-missing", `missing required field **${req}**`);
      else if (!fields[match]) add("field-empty", `**${req}** is present but empty`);
    }

    for (const name of names) {
      const known = [...REQUIRED, ...OPTIONAL].some((k) => k.toLowerCase() === name.toLowerCase());
      if (!known) add("field-unknown", `unrecognized field **${name}** — check spelling against templates.md`);
    }

    const pre = names.find((n) => n.toLowerCase() === "preconditions");
    if (pre && /^\W*(none|n\/a|nothing)\W*$/i.test(fields[pre])) {
      add("preconditions-none", `**Preconditions** says "${fields[pre]}" — omit the field entirely instead`);
    }

    // --- Doc ref ---
    const docKey = names.find((n) => n.toLowerCase() === "doc ref");
    if (docKey && fields[docKey]) {
      const ref = fields[docKey];
      if (/\.\.\/skypermit/.test(ref)) {
        add("docref-relative", "Doc ref uses `../skypermit/...` — use repo-rooted `skypermit/docs/...`");
      }
      // Only entries with a directory separator are path claims. A bare
      // filename (`06-business-rules.md` used again later in the sentence as
      // shorthand) is prose referring back to the path already given, not a
      // second location to resolve.
      const paths = [...ref.matchAll(/`([\w./-]+\.md)`/g)]
        .map((m) => m[1])
        .filter((p) => p.includes("/"));
      if (paths.length === 0) {
        add("docref-no-path", "Doc ref names no `<dir>/<file>.md` path");
      }
      for (const p of paths) {
        if (p.startsWith("../")) continue; // already reported above
        const abs = resolve(APP_PARENT, p);
        if (!existsSync(abs)) {
          add("docref-dead", `Doc ref points at ${p}, which does not exist`);
        }
      }
      const hasAnchor = /§\s*[\d.]+/.test(ref) || /\(["“][^"”]+["”]\)/.test(ref) || /\([^)]*\)/.test(ref);
      if (!hasAnchor) {
        add("docref-no-anchor", "Doc ref names a file but no §section or quoted heading");
      }
    }

    // --- Role(s) ---
    const roleKey = names.find((n) => n.toLowerCase() === "role(s)");
    if (roleKey && fields[roleKey] && !VALID_ROLES.test(fields[roleKey])) {
      add("role-unrecognized", `Role(s) "${fields[roleKey].split("\n")[0]}" is not Operator / Reviewer / Operator → Reviewer`);
    }

    // --- Steps ---
    const stepKey = names.find((n) => n.toLowerCase() === "steps");
    if (stepKey && fields[stepKey]) {
      const steps = fields[stepKey].split("\n").filter((l) => /^\s*\d+\./.test(l));
      if (steps.length === 0) {
        add("steps-unnumbered", "**Steps** has no numbered steps");
      }
      if (!/`[a-z0-9-]+`/.test(fields[stepKey])) {
        add("steps-no-selector", "**Steps** names no `data-testid` in backticks");
      }
    }

    // --- Expected result ---
    const expKey = names.find((n) => n.toLowerCase() === "expected result");
    if (expKey && fields[expKey]) {
      const exp = fields[expKey];
      if (/\b(shows?|displays?|returns?) an error\b/i.test(exp) && !/§|\b40\d\b|\b409\b|\b422\b/.test(exp)) {
        add("expected-vague", 'says "shows an error" without naming the specific error (rule_reference or status code)');
      }
    }
  }
}

// --- Report ---------------------------------------------------------------

if (flag("json")) {
  console.log(JSON.stringify({ cases: cases.length, files: files.length, problems }, null, 2));
  process.exit(problems.length ? 1 : 0);
}

const byFile = new Map();
for (const p of problems) {
  if (!byFile.has(p.file)) byFile.set(p.file, []);
  byFile.get(p.file).push(p);
}

console.log();
if (problems.length === 0) {
  console.log(`  All ${cases.length} case(s) in ${files.length} file(s) are structurally valid.`);
} else {
  for (const [file, list] of byFile) {
    console.log(`  ${file}`);
    for (const p of list) {
      console.log(`    ${p.id ? `${p.id}  ` : ""}${p.kind}`);
      console.log(`      ${p.msg}`);
    }
    console.log();
  }
  console.log(`  ${problems.length} problem(s) across ${cases.length} case(s) in ${files.length} file(s).`);
}
console.log(
  `\n  Structural checks only. Whether each case is logically sound and matches\n` +
    `  the app's real behavior is the case-reviewer agent's job.`,
);
console.log();

process.exit(problems.length ? 1 : 0);
