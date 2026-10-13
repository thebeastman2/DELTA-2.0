// Fix: the BL diagnostics IIFE inside __ViewsEditor lost its call parens in an
// earlier splice — the array element is `(function(){...})` (uncalled), so React
// receives a function child and renders nothing. Insert the missing `()`.
// Assert-once anchor + transpile gate; idempotent.
import fs from "node:fs";
import { Transpiler } from "bun";

const PATH = new URL("./assets/Dashboard-CTKqEs0Z.js", import.meta.url);
let s = fs.readFileSync(PATH, "utf8");
const before = s.length;

if (s.includes("[line,piT,omT]})]})})()]")) { console.log("already fixed — nothing to do"); process.exit(0); }

const oldS = "[line,piT,omT]})]})})]";
const newS = "[line,piT,omT]})]})})()]";
const count = s.split(oldS).length - 1;
if (count !== 1) { console.error(`ABORT: anchor matched ${count} times (expected 1). No write.`); process.exit(1); }
s = s.replace(oldS, newS);

try {
  new Transpiler().transformSync(s);
} catch (err) {
  console.error("ABORT: patched bundle fails transpile:", err.message);
  process.exit(1);
}

fs.writeFileSync(PATH, s);
console.log(`fixed IIFE call: ${before} -> ${s.length} chars`);
