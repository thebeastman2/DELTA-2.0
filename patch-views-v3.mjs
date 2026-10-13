// Patch v3: make per-portfolio views real. The v2 wr override reads
// portfolio.views, but nothing ever wrote it. This patch:
//   E1 — passes portfolio+api into __ViewsEditor at its render site
//   E2 — editor reads EFFECTIVE views (portfolio's own when perPortfolio,
//        falling back to settings views) and writes through to the
//        portfolio record via api.update when perPortfolio is on
//   E3 — scope toggle persists the GLOBAL views (not the portfolio's)
// Anchored replacements; aborts without writing unless every anchor matches
// exactly once. Idempotent: guarded on the v3 marker. Transpile gate before write.
import fs from "node:fs";
import { Transpiler } from "bun";

const PATH = new URL("./assets/Dashboard-CTKqEs0Z.js", import.meta.url);
let s = fs.readFileSync(PATH, "utf8");
const before = s.length;

if (s.includes("portfolio:pf,api:ap")) { console.log("already patched v3 — nothing to do"); process.exit(0); }

const edits = [
  {
    name: "E1 render site",
    oldS: "e.jsx(__ViewsEditor,{settings:n,setSettings:a,analysis:i}),",
    newS: "e.jsx(__ViewsEditor,{settings:n,setSettings:a,analysis:i,portfolio:s,api:t}),",
  },
  {
    name: "E2 editor head",
    oldS: 'function __ViewsEditor({settings:n,setSettings:a,analysis:i}){const l=(i?.tickers??[]).map(s=>({v:s,l:s})),o=n.views??[],q2=(t,s2)=>{__storeViews(t,n.viewScope??"global"),a({...n,views:t,...(s2||{})})},',
    newS: 'function __ViewsEditor({settings:n,setSettings:a,analysis:i,portfolio:pf,api:ap}){const l=(i?.tickers??[]).map(s=>({v:s,l:s})),o=n.viewScope==="perPortfolio"?(Array.isArray(pf?.views)?pf.views:(n.views??[])):(n.views??[]),q2=(t,s2)=>{if(n.viewScope==="perPortfolio"&&pf&&ap){ap.update(pf.id,{views:t,updatedAt:Date.now()}),__storeViews(n.views??[],"perPortfolio")}else __storeViews(t,"global"),a({...n,views:t,...(s2||{})})},',
  },
  {
    name: "E3 scope toggle",
    oldS: 'checked:n.viewScope==="perPortfolio",onChange:t2=>{const s2=t2?"perPortfolio":"global";__storeViews(o,s2),a({...n,viewScope:s2})}',
    newS: 'checked:n.viewScope==="perPortfolio",onChange:t2=>{const s2=t2?"perPortfolio":"global";__storeViews(n.views??[],s2),a({...n,viewScope:s2})}',
  },
];

for (const ed of edits) {
  const count = s.split(ed.oldS).length - 1;
  if (count !== 1) { console.error(`ABORT: anchor "${ed.name}" matched ${count} times (expected 1). No write.`); process.exit(1); }
}
for (const ed of edits) s = s.replace(ed.oldS, ed.newS);

// transpile gate: the patched file must parse before it hits disk
try {
  new Transpiler().transformSync(s);
} catch (err) {
  console.error("ABORT: patched bundle fails transpile:", err.message);
  process.exit(1);
}

fs.writeFileSync(PATH, s);
console.log(`patched v3 OK: ${before} -> ${s.length} chars (+${s.length - before})`);
