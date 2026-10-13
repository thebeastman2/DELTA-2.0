import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

/* The mirrored tree is published twice from the same files: canonically at the
 * account root (thebeastman2.github.io) and, by this repo's own Pages build,
 * under /DELTA-2.0/. Everything the shell does is root-absolute, so the
 * project-site prefix has to hand over to the canonical root before any route
 * runs. These checks execute the shipped inline guard rather than a copy of it. */

const html = await fs.readFile(new URL('./index.html', import.meta.url), 'utf8');
const guard = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
assert.ok(guard, 'index.html ships an inline guard script');

let checks = 0;
function check(name, fn) { fn(); checks++; console.log('ok', name); }

function run({ pathname, search = '', hash = '', nav = 'navigate' }) {
  const replaced = [];
  const store = () => {
    const map = new Map();
    return {
      get length() { return map.size; },
      key: (i) => [...map.keys()][i],
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, v),
      removeItem: (k) => map.delete(k)
    };
  };
  const context = vm.createContext({
    location: {
      pathname, search, hash,
      origin: 'https://thebeastman2.github.io',
      replace: (url) => replaced.push(url)
    },
    performance: { getEntriesByType: () => [{ type: nav }] },
    localStorage: store(),
    sessionStorage: store(),
    document: {
      createElement: () => ({ textContent: '' }),
      head: { appendChild() {} },
      documentElement: { appendChild() {} }
    }
  });
  vm.runInContext(guard, context);
  return replaced;
}

check('the project-site root hands over to the canonical root', () => {
  assert.deepEqual(run({ pathname: '/DELTA-2.0/' }), ['https://thebeastman2.github.io/']);
});

check('the project-site root without a trailing slash hands over too', () => {
  assert.deepEqual(run({ pathname: '/DELTA-2.0' }), ['https://thebeastman2.github.io/']);
});

check('a deeper project-site path keeps its path, query and hash', () => {
  assert.deepEqual(run({ pathname: '/DELTA-2.0/dashboard', search: '?from=hero', hash: '#top' }),
    ['https://thebeastman2.github.io/dashboard?from=hero#top']);
});

check('a path that merely starts with the prefix is left alone', () => {
  assert.deepEqual(run({ pathname: '/DELTA-2.0x' }), []);
});

check('the canonical root is untouched, so one file serves both sites', () => {
  assert.deepEqual(run({ pathname: '/' }), []);
  assert.deepEqual(run({ pathname: '/index.html' }), []);
});

check('existing landing-first behaviour is preserved', () => {
  assert.deepEqual(run({ pathname: '/dashboard' }), ['/']);
  assert.deepEqual(run({ pathname: '/dashboard', nav: 'reload' }), []);
});

console.log(`Shell path checks passed: ${checks}/6 — the /DELTA-2.0/ project path hands over to the canonical root, and the root itself is unchanged.`);
