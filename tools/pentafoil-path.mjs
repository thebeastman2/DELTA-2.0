/* Generates the pentafoil spinner geometry embedded as __DELTA_PENTAFOIL in
 * assets/Dashboard-CTKqEs0Z.js.
 *
 * The loader shown while an optimization runs has to be the 5-fold sibling of the
 * trefoil spinner supplied with the request, so it is built the same way: a closed
 * woven star whose strand crosses itself (3 crossings for the trefoil, 5 here).
 *
 *  1. take a {5/2} star polygon  -> 5 petals, 5 crossings, exact C5 symmetry
 *  2. Chaikin corner cutting     -> the rounded strand of the reference glyph
 *  3. radial power curve         -> deepens the inner weave to the reference ratios
 *  4. uniform arc-length resample -> even dash speed along the whole loop
 *
 * Measured against the reference trefoil glyph (crossings at 0.391-0.507 of the outer
 * radius, 10th-percentile strand gap 1.26 of 40): this shape gives 5 crossings at
 * ~0.43, a 10th-percentile gap of ~1.25 and 0 C5 rotation error.
 *
 * Usage:  node mirror/tools/pentafoil-path.mjs [--write]
 * Without --write it only prints the path, so it can be diffed against the bundle.
 */
import fs from 'node:fs';

const STEPS = 5;      // five-fold: what 5 is to the reference trefoil's three
const ORDER = 2;      // {n/2} star traversal, the weave that makes the crossings
const CHAIKIN = 3;    // corner rounding
const POWER = 2.2;    // weave depth
const POINTS = 240;   // resampled vertices
const RADIUS = 19.2;  // outer radius inside the 0 0 40 40 viewBox
const ROUND = 100;    // 2 decimal places

function star(radius) {
  const seq = [];
  let k = 0;
  for (let i = 0; i < STEPS; i++) { seq.push(k); k = (k + ORDER) % STEPS; }
  return seq.map(k => {
    const a = (-90 + (360 / STEPS) * k) * (Math.PI / 180);
    return [radius * Math.cos(a), radius * Math.sin(a)];
  });
}
function chaikin(points, iterations) {
  let current = points.slice();
  for (let it = 0; it < iterations; it++) {
    const next = [];
    for (let i = 0; i < current.length; i++) {
      const [ax, ay] = current[i];
      const [bx, by] = current[(i + 1) % current.length];
      next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    current = next;
  }
  return current;
}
function resample(points, count) {
  const segments = [];
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    const length = Math.hypot(bx - ax, by - ay);
    segments.push({ ax, ay, bx, by, length });
    total += length;
  }
  const out = [];
  let index = 0;
  let travelled = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total;
    while (index < segments.length - 1 && travelled + segments[index].length < target) {
      travelled += segments[index].length;
      index++;
    }
    const t = segments[index].length ? (target - travelled) / segments[index].length : 0;
    out.push([
      segments[index].ax + (segments[index].bx - segments[index].ax) * t,
      segments[index].ay + (segments[index].by - segments[index].ay) * t,
    ]);
  }
  return out;
}
export function pentafoilPath() {
  let shape = chaikin(star(1), CHAIKIN);
  let outer = 0;
  for (const [x, y] of shape) outer = Math.max(outer, Math.hypot(x, y));
  shape = shape.map(([x, y]) => {
    const radius = Math.hypot(x, y) / outer;
    const angle = Math.atan2(y, x);
    const scaled = Math.pow(radius, POWER);
    return [scaled * Math.cos(angle), scaled * Math.sin(angle)];
  });
  return resample(shape, POINTS)
    .map(([x, y], i) => (i ? 'L' : 'M') + Math.round((x * RADIUS + 20) * ROUND) / ROUND +
      ' ' + Math.round((y * RADIUS + 20) * ROUND) / ROUND)
    .join('') + 'Z';
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (!invokedDirectly) {
  // imported for its generator only
} else {
const path = pentafoilPath();
if (process.argv.includes('--write')) {
  const url = new URL('../assets/Dashboard-CTKqEs0Z.js', import.meta.url);
  const bundle = fs.readFileSync(url, 'utf8');
  const matches = [...bundle.matchAll(/__DELTA_PENTAFOIL="([^"]*)"/g)];
  if (matches.length !== 1) throw new Error(`expected one __DELTA_PENTAFOIL, found ${matches.length}`);
  fs.writeFileSync(url, bundle.replace(/__DELTA_PENTAFOIL="[^"]*"/, `__DELTA_PENTAFOIL="${path}"`));
  console.log(`wrote ${path.length} characters into assets/Dashboard-CTKqEs0Z.js`);
} else {
  console.log(path);
}
}
