import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

/* The mirrored tree is published twice from the same files: canonically at the
 * account root (thebeastman2.github.io) and, by this repo's own Pages build,
 * under /DELTA-2.0/. Everything the shell does is root-absolute, so the
 * project-site prefix has to hand over to the canonical root before any route
 * runs. Both Pages shells carry that guard - `index.html` for the site entry
 * and `404.html` for deeper paths - so both are exercised here, by running the
 * shipped scripts rather than a copy of them. */

const shells = ['index.html', '404.html'];
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('ok', name); }

function run(guard, { pathname, search = '', hash = '', nav = 'navigate' }) {
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

for (const shell of shells) {
  const html = await fs.readFile(new URL('./' + shell, import.meta.url), 'utf8');
  const guard = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
  assert.ok(guard, `${shell} ships an inline guard script`);

  check(`${shell}: the project-site root hands over to the canonical root`, () => {
    assert.deepEqual(run(guard, { pathname: '/DELTA-2.0/' }), ['https://thebeastman2.github.io/']);
  });

  check(`${shell}: the project-site root without a trailing slash hands over too`, () => {
    assert.deepEqual(run(guard, { pathname: '/DELTA-2.0' }), ['https://thebeastman2.github.io/']);
  });

  check(`${shell}: a deeper project-site path keeps its path, query and hash`, () => {
    assert.deepEqual(run(guard, { pathname: '/DELTA-2.0/dashboard', search: '?from=hero', hash: '#top' }),
      ['https://thebeastman2.github.io/dashboard?from=hero#top']);
  });

  check(`${shell}: a path that merely starts with the prefix is left alone`, () => {
    assert.deepEqual(run(guard, { pathname: '/DELTA-2.0x' }), []);
  });

  check(`${shell}: the canonical root is untouched, so one file serves both sites`, () => {
    assert.deepEqual(run(guard, { pathname: '/' }), []);
    assert.deepEqual(run(guard, { pathname: '/index.html' }), []);
    assert.deepEqual(run(guard, { pathname: '/dashboard' }), ['/']);
  });

  check(`${shell}: existing landing-first behaviour is preserved`, () => {
    assert.deepEqual(run(guard, { pathname: '/dashboard', nav: 'reload' }), []);
    assert.deepEqual(run(guard, { pathname: '/auth' }), ['/']);
  });
}

console.log(`Shell path checks passed: ${checks}/12 across ${shells.join(' and ')} — the /DELTA-2.0/ project path hands over to the canonical root, and the root itself is unchanged.`);
