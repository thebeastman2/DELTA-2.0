import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('./calc-details.js', import.meta.url), 'utf8');
const start = source.indexOf('var styleEl = null;');
const end = source.indexOf('var modal = null;', start);
assert.ok(start >= 0 && end > start);
const styles = [];
const context = vm.createContext({ document: {
  createElement(tag) { assert.equal(tag, 'style'); return { textContent: '' }; },
  head: { appendChild(style) { styles.push(style); } }
} });
vm.runInContext(source.slice(start, end) + '\nensureStyles();ensureStyles();', context);
assert.equal(styles.length, 1, 'stylesheet is inserted exactly once');
const css = styles[0].textContent;
assert.ok(!/#(?:5eead4|a5f3fc|0a1120)|rgba\((?:45,212,191|94,234,212)/.test(css), 'no old hard-coded teal colours');
for (const selector of ['.calc-btn', '.calc-btn:hover', '#calc-modal', '#calc-modal .calc-label', '#calc-modal .calc-formula', '#calc-modal .calc-input .calc-iv']) {
  const rules = css.slice(css.indexOf(selector + '{')).split('}')[0];
  assert.ok(rules.includes('var(--accent'), `${selector} follows the app accent`);
}
assert.ok(css.includes('background:var(--card)'), 'popup uses the app card surface');
assert.ok(css.includes('background:var(--muted)'), 'worked calculation uses the app muted surface');
assert.ok(css.includes('var(--foreground)') && css.includes('var(--muted-foreground)'), 'text follows app tokens');
assert.ok(css.includes(':focus-visible{outline:2px solid var(--accent)'), 'keyboard focus uses selected accent');
assert.ok(source.includes('SR = (R<sub>p</sub> &minus; R<sub>f</sub>) / &sigma;<sub>p</sub>'), 'Sharpe equation retained');
assert.ok(source.includes('metric.worked(ctx)') && source.includes('metric.inputs(ctx)'), 'existing calculation interface retained');
const html = await fs.readFile(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(html.includes('calc-details.js?v=2'), 'calculation stylesheet update cache-busted');
console.log('Calculation theme checks passed: buttons, hover/focus, popup, labels, formula and inputs all follow DELTA theme tokens.');
