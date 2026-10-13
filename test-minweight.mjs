/* Unit checks for the applyMinW waterline projection inside the patched
 * Dashboard bundle. Run with:  bun test-minweight.mjs
 * Extracts the real Es/applyMinW source from the bundle and asserts behavior. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "assets", "Dashboard-CTKqEs0Z.js"), "utf8");

const start = src.indexOf("function Es(t){");
const end = src.indexOf("function be(t,s,n,a){");
if (start === -1 || end === -1 || end <= start) {
  console.error("Could not locate Es/applyMinW in bundle");
  process.exit(1);
}
const seg = src.slice(start, end);
const { applyMinW } = new Function(seg + "\nreturn {Es,applyMinW}")();

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log("  ok  " + name);
  else {
    failures++;
    console.error("  FAIL " + name + (detail ? "  -> " + JSON.stringify(detail) : ""));
  }
}
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const sum1 = (w) => close(w.reduce((x, y) => x + y, 0), 1, 1e-9);
const allGe = (w, f, eps = 1e-9) => w.every((v) => v >= f - eps);

// 1 — constraint off: untouched
const off = [0.9, 0.05, 0.05];
check("off (null) returns input unchanged", applyMinW(off, null) === off);
check("off (0) returns input unchanged", applyMinW(off, 0) === off);

// 2 — floor respected, sum 1
const r2 = applyMinW([0.9, 0.05, 0.05], 0.1);
check("floor 10%: all >= floor", allGe(r2, 0.1), r2);
check("floor 10%: sums to 1", sum1(r2), r2);
check("floor 10%: largest name absorbed the shrink", close(r2[0], 0.8), r2);

// 3 — zeros are floored too (every asset gets at least the floor)
const r3 = applyMinW([1, 0, 0], 0.1);
check("zeros floored", allGe(r3, 0.1), r3);
check("zeros floored: sums to 1", sum1(r3), r3);

// 4 — uniform portfolio untouched when already above floor
const u = [0.2, 0.2, 0.2, 0.2, 0.2];
const r4 = applyMinW(u, 0.1);
check("uniform unchanged", r4.every((v, i) => close(v, u[i])), r4);

// 5 — infeasible floor ( > 1/N ) clamps to 1/N via equal weight
const r5 = applyMinW([0.9, 0.1], 0.6);
check("infeasible floor -> equal weight", r5.every((v) => close(v, 0.5)), r5);

// 6 — requested floor above the max cap: floor clamps to the cap, and the
// projection only ever shrinks free names so the cap itself is preserved
const r6 = applyMinW([0.3, 0.3, 0.2, 0.1, 0.1], 0.4, 0.3);
check("cap clamps floor to 20% (1/N)", allGe(r6, 0.2), r6);
check("cap preserved (nothing above maxWeight)", r6.every((v) => v <= 0.3 + 1e-9), r6);
check("cap clamp: sums to 1", sum1(r6), r6);

// 7 — randomized: always sum 1 and honor floor when feasible
let randOk = true;
let s = 42;
const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let t = 0; t < 500; t++) {
  const n = 2 + Math.floor(rnd() * 8);
  const w = Array.from({ length: n }, () => rnd());
  const f = rnd() / n; // always feasible
  const r = applyMinW(w, f);
  if (!sum1(r) || !allGe(r, f)) {
    randOk = false;
    console.error("   random fail:", { w, f, r });
    break;
  }
}
check("500 random feasible cases: sum 1 and >= floor", randOk);

// 8 — interior convergence: mixed free/pinned
const r8 = applyMinW([0.5, 0.3, 0.12, 0.05, 0.03], 0.1);
check("mixed case: all >= floor", allGe(r8, 0.1), r8);
check("mixed case: sums to 1", sum1(r8), r8);
check(
  "mixed case: names above floor keep relative proportions",
  close(r8[1] / r8[0], 0.3 / 0.5, 1e-6),
  r8,
);

console.log(failures ? `\n${failures} FAILURES` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
