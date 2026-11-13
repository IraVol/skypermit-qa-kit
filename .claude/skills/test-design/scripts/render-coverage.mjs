#!/usr/bin/env node
// Renders a <name>.design.json (test-design skill) as a self-contained coverage page.
// Usage (from the repo root):
//   node .claude/skills/test-design/scripts/render-coverage.mjs <file.design.json> [out.html]
// Default output: next to the design file, <name>.coverage.html.
//
// Sections:
//   1. Number lines — one per numeric parameter: boundaries, valid/invalid/unknown regions,
//      the BV test points (zoomed per boundary) and EP representatives.
//   2. State × action table — legal / illegal / unknown per cell, quote on hover.
//   3. Traceability — quote → design element → test, plus the unknowns.
// No dependencies, no external assets. Run check-design.mjs first; this script assumes a valid design.

import { readFileSync, writeFileSync } from 'node:fs';

const [, , designPath, outArg] = process.argv;
if (!designPath) {
  console.error('usage: render-coverage.mjs <file.design.json> [out.html]');
  process.exit(2);
}
const d = JSON.parse(readFileSync(designPath, 'utf8'));
const outPath = outArg ?? designPath.replace(/\.design\.json$/, '') + '.coverage.html';

// ---------- helpers ----------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>'); // inline code only
const bv = d.boundary_values ?? [];
const ec = d.equivalence_classes ?? [];
const st = d.state_transitions ?? {};
const unknowns = d.unknowns ?? [];
const unknownById = Object.fromEntries(unknowns.map((u) => [u.id, u]));
const short = (f) => String(f ?? '').split('/').pop();

// "−1 minute", "window_end = window_start (0 minutes)", "4.50 EUR", "1st renewal" → number
function num(v) {
  const s = String(v ?? '').replace(/−/g, '-');
  const paren = s.match(/\((-?\d+(?:[.,]\d+)?)[^)]*\)/);
  const m = paren ?? s.match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number((m[1] ?? m[0]).replace(',', '.')) : null;
}
const normParam = (p) => String(p ?? '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
const sameParam = (a, b) => { const x = normParam(a), y = normParam(b); return x && y && (x.startsWith(y) || y.startsWith(x)); };
const cls = (e) => (e === true || e === 'valid' ? 'valid' : e === false || e === 'invalid' ? 'invalid' : 'unknown');
const quoteTitle = (qs) => (qs ?? []).map((q) => `${short(q.file)}:${q.line} — ${q.text}`).join('\n');

// ---------- 1. number lines --------------------------------------------------
const lines = [];
for (const b of bv) {
  let line = lines.find((l) => sameParam(l.parameter, b.parameter));
  if (!line) { line = { parameter: b.parameter, bvs: [], eps: [] }; lines.push(line); }
  line.bvs.push(b);
}
const epsOnLines = new Set();
for (const e of ec) {
  const line = lines.find((l) => sameParam(l.parameter, e.parameter));
  if (line && num(e.representative) !== null) { line.eps.push(e); epsOnLines.add(e.id); }
}

function numberLineSVG(line) {
  const pts = line.bvs.flatMap((b) => b.values.map((v) => ({ x: num(v.value), exp: cls(v.expected), pos: v.position, bv: b.id, label: v.value })));
  if (pts.some((p) => p.x === null)) return null;
  const bounds = [...new Set(line.bvs.map((b) => num(b.values.find((v) => v.position === 'boundary')?.value)))].sort((a, b) => a - b);
  const reps = line.eps.map((e) => ({ x: num(e.representative), exp: cls(e.valid), id: e.id }));
  const xs = [...pts.map((p) => p.x), ...reps.map((r) => r.x)];
  let lo = Math.min(...xs), hi = Math.max(...xs);
  const pad = Math.max((hi - lo) * 0.08, 1);
  lo -= pad; hi += pad;
  const W = 760, L = 20, R = W - 20, Y = 46;
  const X = (v) => L + ((v - lo) / (hi - lo)) * (R - L);

  // region colour from the test points strictly inside it
  const edges = [-Infinity, ...bounds, Infinity];
  const regions = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const inside = pts.filter((p) => p.x > edges[i] && p.x < edges[i + 1]).map((p) => p.exp);
    const set = new Set(inside);
    const c = !inside.length ? 'none' : set.size === 1 ? inside[0] : 'unknown';
    regions.push({ a: Math.max(edges[i], lo), b: Math.min(edges[i + 1], hi), c });
  }
  let svg = `<svg viewBox="0 0 ${W} 92" role="img" aria-label="${esc(line.parameter)}">`;
  for (const r of regions) svg += `<rect class="reg ${r.c}" x="${X(r.a)}" y="${Y - 9}" width="${Math.max(X(r.b) - X(r.a), 0)}" height="18" rx="3"/>`;
  svg += `<line class="axis" x1="${L}" x2="${R}" y1="${Y}" y2="${Y}"/>`;
  for (const bnd of bounds) {
    const bp = pts.find((p) => p.x === bnd && p.pos === 'boundary');
    svg += `<line class="tick" x1="${X(bnd)}" x2="${X(bnd)}" y1="${Y - 20}" y2="${Y + 14}"/>`;
    svg += `<circle class="bdot ${bp?.exp ?? 'unknown'}" cx="${X(bnd)}" cy="${Y}" r="6"><title>${esc(bp?.label)} — ${esc(bp?.exp)}</title></circle>`;
    svg += `<text class="blabel" x="${X(bnd)}" y="${Y - 25}" text-anchor="middle">${esc(bnd)}</text>`;
  }
  for (const r of reps) {
    const x = X(r.x);
    svg += `<path class="rep ${r.exp}" d="M${x} ${Y + 18} l6 7 l-6 7 l-6 -7z"><title>${esc(r.id)} representative ${esc(r.x)}</title></path>`;
    svg += `<text class="rlabel" x="${x}" y="${Y + 44}" text-anchor="middle">${esc(r.id)}</text>`;
  }
  return svg + '</svg>';
}

function tripleChips(b) {
  return `<div class="triple"><span class="tid">${esc(b.id)}</span> <span class="muted">${md(b.boundary)} · step ${md(b.step ?? '—')}</span><div class="chips">${b.values
    .map((v) => `<span class="chip ${cls(v.expected)}" title="${esc(v.position)}${v.outcome ? ' — ' + esc(v.outcome) : ''}${v.unknown ? ' — ' + esc(v.unknown) : ''}"><b>${md(v.value)}</b><small>${esc(v.position)} · ${esc(v.expected)}${v.unknown ? ' · ' + esc(v.unknown) : ''}</small></span>`)
    .join('')}</div></div>`;
}

let sec1 = '';
for (const line of lines) {
  const svg = numberLineSVG(line);
  sec1 += `<article class="card"><h3>${md(line.parameter)}</h3>${svg ?? '<p class="muted">Values are not numeric — no line drawn.</p>'}
    ${line.bvs.map(tripleChips).join('')}
    ${line.eps.length ? `<ul class="eplist">${line.eps.map((e) => `<li><span class="dot ${cls(e.valid)}"></span><b>${esc(e.id)}</b> ${md(e.class)} — rep. ${md(e.representative)} · ${e.valid === 'unknown' ? 'unknown' : e.valid ? 'valid' : 'invalid'}</li>`).join('')}</ul>` : ''}
  </article>`;
}
const looseEps = ec.filter((e) => !epsOnLines.has(e.id));
if (looseEps.length) {
  sec1 += `<article class="card"><h3>Classes without a number line</h3><table class="t"><thead><tr><th>ID</th><th>Parameter</th><th>Class</th><th>Representative</th><th>Valid</th><th>Outcome</th></tr></thead><tbody>${looseEps
    .map((e) => `<tr><td><b>${esc(e.id)}</b></td><td>${md(e.parameter)}</td><td>${md(e.class)}</td><td>${md(e.representative)}</td><td><span class="pill ${cls(e.valid)}">${e.valid === 'unknown' ? 'unknown' : e.valid ? 'valid' : 'invalid'}</span></td><td>${md(e.outcome ?? '—')}${e.unknown ? ` <span class="uref">${esc(e.unknown)}</span>` : ''}</td></tr>`)
    .join('')}</tbody></table></article>`;
}
if (!sec1) sec1 = '<p class="muted">No boundary values or classes in this design.</p>';

// ---------- 2. state × action ------------------------------------------------
let sec2;
if (typeof st.not_applicable === 'string') {
  sec2 = `<p class="muted">Not applicable — ${md(st.not_applicable)}</p>`;
} else {
  const states = st.states ?? [], actions = st.actions ?? [];
  const cell = Object.fromEntries((st.matrix ?? []).map((c) => [`${c.from}\u0000${c.action}`, c]));
  const counts = { legal: 0, illegal: 0, unknown: 0 };
  (st.matrix ?? []).forEach((c) => counts[c.result]++);
  sec2 = `<p class="muted">${states.length} states × ${actions.length} actions = ${(st.matrix ?? []).length} cells · <span class="pill valid">${counts.legal} legal</span> <span class="pill invalid">${counts.illegal} illegal</span> <span class="pill unknown">${counts.unknown} unknown</span></p>
  <div class="scroll"><table class="t matrix"><thead><tr><th>from \\ action</th>${actions.map((a) => `<th title="${esc(quoteTitle(a.quotes))}">${esc(a.name)}${a.kind === 'event' ? '<small>event</small>' : ''}</th>`).join('')}</tr></thead><tbody>${states
    .map((s) => `<tr><th title="${esc(quoteTitle(s.quotes))}">${esc(s.name)}</th>${actions
      .map((a) => {
        const c = cell[`${s.name}\u0000${a.name}`];
        if (!c) return '<td class="cell missing">—</td>';
        const to = Array.isArray(c.to) ? c.to.join(' | ') : c.to;
        const body = c.result === 'legal' ? `→ ${esc(to)}${c.guard ? ' <span class="guard" title="' + esc(c.guard) + '">⚑</span>' : ''}` : c.result === 'illegal' ? esc(c.outcome ?? '✕') : `? ${esc(c.unknown ?? '')}`;
        const cl = c.result === 'legal' ? 'valid' : c.result === 'illegal' ? 'invalid' : 'unknown';
        return `<td class="cell ${cl}" title="${esc(c.id)}${c.guard ? '\nguard: ' + esc(c.guard) : ''}\n${esc(quoteTitle(c.quotes))}">${body}</td>`;
      })
      .join('')}</tr>`)
    .join('')}</tbody></table></div><p class="muted small">Hover a cell for its ID and quote. ⚑ = the transition has a guard.</p>`;
}

// ---------- 3. traceability --------------------------------------------------
const rows = new Map(); // quote key → {q, items:[{el, test, cls}]}
function trace(qs, el, test, c) {
  for (const q of qs ?? []) {
    const k = `${q.file}\u0000${q.line}\u0000${q.text}`;
    if (!rows.has(k)) rows.set(k, { q, items: [] });
    rows.get(k).items.push({ el, test, c });
  }
}
for (const b of bv) {
  const tests = b.values.map((v) => `${v.value} → ${v.expected}${v.outcome ? ' (' + v.outcome + ')' : ''}`).join('; ');
  trace(b.quotes, `${b.id} · BV ${b.boundary}`, tests, 'valid');
  b.values.forEach((v, i) => v.quotes?.length && trace(v.quotes, `${b.id}.${i + 1} · ${v.position}`, `${v.value} → ${v.expected}`, cls(v.expected)));
}
for (const e of ec) trace(e.quotes, `${e.id} · EP ${e.class}`, `${e.representative} → ${e.valid === 'unknown' ? 'unknown' : e.valid ? 'valid' : 'invalid'}${e.outcome ? ' (' + e.outcome + ')' : ''}`, cls(e.valid));
for (const s of st.states ?? []) trace(s.quotes, `state ${s.name}`, '—', 'none');
for (const a of st.actions ?? []) trace(a.quotes, `action ${a.name}`, '—', 'none');
for (const c of st.matrix ?? []) {
  const to = Array.isArray(c.to) ? c.to.join(' | ') : c.to;
  trace(c.quotes, `${c.id} · ${c.from} × ${c.action}`, c.result === 'legal' ? `→ ${to}${c.guard ? ' [guard]' : ''}` : c.result === 'illegal' ? `illegal${c.outcome ? ' → ' + c.outcome : ''}` : 'unknown', c.result === 'legal' ? 'valid' : c.result === 'illegal' ? 'invalid' : 'unknown');
}
const LIMIT = 12;
const itemsHtml = (items) => {
  const li = (it) => `<li><span class="dot ${it.c}"></span><b>${md(it.el)}</b><span class="test">${md(it.test)}</span></li>`;
  const head = items.slice(0, LIMIT).map(li).join('');
  const rest = items.slice(LIMIT);
  return `<ul class="items">${head}</ul>${rest.length ? `<details><summary>${rest.length} more</summary><ul class="items">${rest.map(li).join('')}</ul></details>` : ''}`;
};
const sortedRows = [...rows.values()].sort((a, b) => (a.q.file === b.q.file ? a.q.line - b.q.line : a.q.file.localeCompare(b.q.file)));
const sec3 = `<div class="scroll"><table class="t trace"><thead><tr><th>Quote</th><th>Element → test</th></tr></thead><tbody>${sortedRows
  .map((r) => `<tr><td class="q"><span class="src">${esc(short(r.q.file))}:${esc(r.q.line)}</span><blockquote>${md(r.q.text)}</blockquote></td><td>${itemsHtml(r.items)}</td></tr>`)
  .join('')}</tbody></table></div>`;

const affectsIdx = {};
for (const b of bv) b.values.forEach((v) => v.unknown && (affectsIdx[v.unknown] ??= new Set()).add(b.id));
for (const e of ec) e.unknown && (affectsIdx[e.unknown] ??= new Set()).add(e.id);
for (const c of st.matrix ?? []) c.unknown && (affectsIdx[c.unknown] ??= new Set()).add(c.id);
const sec4 = unknowns.length
  ? `<table class="t"><thead><tr><th>ID</th><th>Kind</th><th>Question</th><th>Affects</th></tr></thead><tbody>${unknowns
      .map((u) => {
        const aff = new Set([...(u.affects ?? []), ...(affectsIdx[u.id] ?? [])]);
        return `<tr><td><b>${esc(u.id)}</b></td><td><span class="pill ${u.kind === 'conflict' ? 'invalid' : 'unknown'}">${esc(u.kind ?? 'gap')}</span></td><td>${md(u.question)}${u.why_it_matters ? `<div class="muted small">${md(u.why_it_matters)}</div>` : ''}${(u.quotes ?? []).map((q) => `<blockquote class="small"><span class="src">${esc(short(q.file))}:${esc(q.line)}</span> ${md(q.text)}</blockquote>`).join('')}</td><td>${[...aff].map((a) => `<span class="uref">${esc(a)}</span>`).join(' ') || '—'}</td></tr>`;
      })
      .join('')}</tbody></table>`
  : '<p class="muted">None — the spec answered everything the design needed.</p>';

// ---------- page -------------------------------------------------------------
const title = `${(d.spec ?? []).map(short).join(', ')}${d.focus ? ' · ' + d.focus : ''}`;
const stCells = (st.matrix ?? []).length;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test design coverage</title>
<style>
:root{--bg:#f7f7f5;--card:#fff;--fg:#1d1d1f;--muted:#6b6b70;--line:#d9d9de;--valid:#1f9d55;--valid-bg:#e3f5ea;--invalid:#d0392b;--invalid-bg:#fbe5e2;--unknown:#c48a00;--unknown-bg:#fdf1d3;--none:#b8b8be;--none-bg:#efeff1;--code:#f0f0f2}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141416;--card:#1d1d20;--fg:#ececef;--muted:#9a9aa2;--line:#34343a;--valid:#4cc985;--valid-bg:#183a28;--invalid:#ff7a6b;--invalid-bg:#43201c;--unknown:#f0b93a;--unknown-bg:#3d3114;--none:#6b6b72;--none-bg:#28282c;--code:#2a2a2f}}
:root[data-theme="dark"]{--bg:#141416;--card:#1d1d20;--fg:#ececef;--muted:#9a9aa2;--line:#34343a;--valid:#4cc985;--valid-bg:#183a28;--invalid:#ff7a6b;--invalid-bg:#43201c;--unknown:#f0b93a;--unknown-bg:#3d3114;--none:#6b6b72;--none-bg:#28282c;--code:#2a2a2f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;margin:36px 0 12px}h3{font-size:15px;margin:0 0 8px}
.muted{color:var(--muted)}.small{font-size:13px}code{background:var(--code);padding:0 4px;border-radius:4px;font-size:.92em}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.stat{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:6px 12px}.stat b{font-size:18px;margin-right:4px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin:12px 0}
svg{width:100%;height:auto;display:block;margin:4px 0 8px}.axis{stroke:var(--muted);stroke-width:1.5}.tick{stroke:var(--fg);stroke-width:1}
.reg.valid{fill:var(--valid-bg)}.reg.invalid{fill:var(--invalid-bg)}.reg.unknown{fill:var(--unknown-bg)}.reg.none{fill:var(--none-bg)}
.bdot{stroke:var(--card);stroke-width:2}.bdot.valid,.rep.valid{fill:var(--valid)}.bdot.invalid,.rep.invalid{fill:var(--invalid)}.bdot.unknown,.rep.unknown{fill:var(--unknown)}
.blabel{font-size:12px;font-weight:600;fill:var(--fg)}.rlabel{font-size:10px;fill:var(--muted)}
.triple{margin:8px 0}.tid{font-weight:700}.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.chip{display:flex;flex-direction:column;border-radius:8px;padding:4px 10px;border:1px solid}.chip small{font-size:11px;opacity:.85}
.chip.valid,.pill.valid{background:var(--valid-bg);border-color:var(--valid);color:var(--valid)}.chip.invalid,.pill.invalid{background:var(--invalid-bg);border-color:var(--invalid);color:var(--invalid)}.chip.unknown,.pill.unknown{background:var(--unknown-bg);border-color:var(--unknown);color:var(--unknown)}
.pill{display:inline-block;border:1px solid;border-radius:999px;padding:0 8px;font-size:12px;white-space:nowrap}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;background:var(--none)}.dot.valid{background:var(--valid)}.dot.invalid{background:var(--invalid)}.dot.unknown{background:var(--unknown)}
.eplist,.items{list-style:none;padding:0;margin:6px 0}.eplist li,.items li{padding:2px 0}.items .test{display:block;margin-left:15px;color:var(--muted);font-size:13px}
.scroll{overflow-x:auto}.t{border-collapse:collapse;width:100%;background:var(--card);font-size:14px}.t th,.t td{border:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}.t thead th{background:var(--none-bg)}
.matrix th small{display:block;font-weight:400;color:var(--muted);font-size:11px}.matrix td.cell{text-align:center;white-space:nowrap;font-size:13px}
.cell.valid{background:var(--valid-bg);color:var(--valid)}.cell.invalid{background:var(--invalid-bg);color:var(--invalid)}.cell.unknown{background:var(--unknown-bg);color:var(--unknown)}.cell.missing{color:var(--muted)}
.guard{cursor:help}.trace td.q{width:42%}blockquote{margin:4px 0 0;padding-left:10px;border-left:3px solid var(--line)}.src{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--muted)}
.uref{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:var(--unknown-bg);color:var(--unknown);border-radius:4px;padding:0 4px}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--muted)}summary{cursor:pointer;color:var(--muted);font-size:13px}
</style></head><body><main>
<h1>Test design coverage</h1>
<div class="muted">${esc(title)} · ${esc(designPath.split('/').pop())}</div>
<div class="stats"><span class="stat"><b>${bv.length}</b>boundaries (${bv.length * 3} values)</span><span class="stat"><b>${ec.length}</b>classes</span><span class="stat"><b>${stCells || '—'}</b>state × action cells</span><span class="stat"><b>${unknowns.length}</b>unknowns</span><span class="stat"><b>${rows.size}</b>distinct quotes</span></div>
<div class="legend"><span><span class="dot valid"></span>valid / legal</span><span><span class="dot invalid"></span>invalid / illegal</span><span><span class="dot unknown"></span>unknown — the spec doesn't say</span><span><span class="dot"></span>no test in this region</span></div>
<h2>1. Classes and boundaries</h2>${sec1}
<h2>2. State × action</h2>${sec2}
<h2>3. Quote → element → test</h2>${sec3}
<h2>4. Unknowns</h2>${sec4}
</main></body></html>
`;
writeFileSync(outPath, html);
console.log(`wrote ${outPath}`);
