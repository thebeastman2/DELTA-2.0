// patch-remove-aa.mjs — remove the Asset Analysis tab (nav entry + view case).
// Anchored, assert-exactly-once, transpile-gated, idempotent. Aborts without writing on mismatch.
import { readFileSync, writeFileSync, copyFileSync } from "fs";

const FILE = "assets/Dashboard-CTKqEs0Z.js";
const NAV = ',{id:"macro",label:"Asset Analysis",icon:Wa}';
const CASE = 'case"macro":return e.jsx(Lr,{...v});';

let s = readFileSync(FILE, "utf8");
const before = s.length;

if (!s.includes(NAV) && !s.includes(CASE)) {
  console.log("already patched — nothing to do");
  process.exit(0);
}

function cut(str, needle, tag) {
  const n = str.split(needle).length - 1;
  if (n !== 1) throw new Error(`[${tag}] expected exactly 1 match, found ${n} — aborting (no write)`);
  return str.split(needle).join("");
}

s = cut(s, NAV, "nav-entry");
s = cut(s, CASE, "switch-case");

new Bun.Transpiler({ loader: "jsx" }).transformSync(s); // parse gate — throws on syntax error

copyFileSync(FILE, FILE + ".pre-aa-remove");
writeFileSync(FILE, s);
console.log(`OK: ${before} -> ${s.length} chars (-${before - s.length})`);
