/* Run from the local landing page console:
 * await import('/test-architecture.mjs').then(m => m.runArchitectureChecks())
 * The suite scrolls the page, checks rendered SVG state, and restores position.
 * Set reduced motion in the browser/OS before running to check that branch.
 */
export async function runArchitectureChecks({ section = 'all', delay = 25 } = {}) {
  const api = window.__deltaArchitecture;
  if (!api) throw new Error('Load the DELTA landing page before running checks.');
  const results = [];
  const check = (name, passed, detail) => {
    results.push({ name, passed: Boolean(passed), ...(detail === undefined ? {} : { detail }) });
  };
  const value = item => parseFloat(getComputedStyle(item.element).getPropertyValue('--k'));
  const near = (a, b, tolerance = 0.0005) => Math.abs(a - b) <= tolerance;
  const items = api.registry;
  const panels = [...document.querySelectorAll('.da-panel')];
  const flow = document.querySelector('#dg-architecture-flow');
  const cards = [...document.querySelectorAll('[data-card]')];
  const expectedChapters = [
    ['init', 0, .04], ['market', .04, .13], ['stats', .13, .22],
    ['opt', .22, .35], ['risk', .35, .45], ['intel', .45, .54],
    ['portfolio', .54, .61], ['frontier', .61, .68], ['corr', .68, .75],
    ['riskc', .75, .82], ['mc', .82, .89], ['bt', .89, .96], ['fin', .96, 1]
  ];
  check('13 exact chapter boundaries', expectedChapters.every(([id, start, end]) =>
    api.chapters[id][0] === start && api.chapters[id][1] === end));
  check('Unique deterministic construction identifiers', new Set(items.map(i => i.id)).size === items.length);
  check('Every construction window stays inside its chapter', items.every(i => {
    const [start, end] = api.chapters[i.chapter];
    return i.start >= start - 1e-6 && i.end <= end + 1e-6 && i.end > i.start;
  }));
  check('Hundreds of independently built pieces', items.length > 1000, items.length);
  check('Six unique structural expansions', document.querySelectorAll('[data-expansion]').length === 6);
  check('Cubes and prisms have separately timed construction parts',
    [...document.querySelectorAll('.cube,.prism')].every(el =>
      ['base', 'side-left', 'side-right', 'top-outline', 'detail'].every(part =>
        el.querySelector(`[data-part="${part}"][data-build-id]`))));
  check('All stroked node paths have cached measured lengths',
    [...document.querySelectorAll('.node .ring,.node .icon')].every(el =>
      el.dataset.buildId && Number(el.style.getPropertyValue('--length')) > 0 && !el.hasAttribute('pathLength')));
  const notes = panels.map(p => p.querySelector('.da-note'));
  check('Mathematical notation preserves case', notes.every(el => getComputedStyle(el).textTransform === 'none'));
  const frames = cards.map(c => c.querySelector('.card-frame').getBoundingClientRect());
  check('Dashboard frames do not overlap', frames.every((a, i) => frames.every((b, j) =>
    j <= i || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)));
  check('No horizontal page overflow', document.documentElement.scrollWidth <= innerWidth);
  check('Launch CTA points to the existing entry gate', document.querySelector('.da-cta').getAttribute('href') === '/auth?from=hero');
  const stageEl = document.querySelector('#dg-architecture-stage');
  const stageCS = getComputedStyle(stageEl);
  const scrim = getComputedStyle(stageEl, '::before').backgroundImage;
  check('Starfield stays visible: stage layers transparent, scrim only softens copy area',
    getComputedStyle(flow).backgroundColor === 'rgba(0, 0, 0, 0)' &&
    stageCS.backgroundColor === 'rgba(0, 0, 0, 0)' &&
    stageCS.backgroundImage === 'none' &&
    scrim !== 'none' && !/rgba\(6, 11, 19, 1\)/.test(scrim) &&
    Array.from(document.querySelectorAll('canvas')).some(function (c) {
      return getComputedStyle(c).position === 'fixed';
    }));

  if (flow.classList.contains('reduced')) {
    check('Reduced motion has no pinned architecture trigger', api.master === null &&
      !ScrollTrigger.getAll().some(t => t.vars.id === 'delta-architecture'));
    check('Reduced motion shows complete geometry immediately', items.every(i => near(value(i), 1)));
    check('Reduced motion exposes all narrative panels', panels.every(p => !p.inert && p.getAttribute('aria-hidden') === 'false'));
    check('Reduced motion places the diagram before the narrative',
      Number(getComputedStyle(document.querySelector('.da-art')).order) < Number(getComputedStyle(document.querySelector('.da-copy')).order));
    check('Reduced motion CTA is visible', getComputedStyle(document.querySelector('.da-cta')).visibility === 'visible');
  } else {
    const master = api.master;
    const trigger = master.scrollTrigger;
    // ScrollTrigger recomputes responsive travel on its debounced resize
    // refresh; sync it first so post-resize runs measure the settled state.
    ScrollTrigger.refresh();
    const originalScroll = scrollY;
    const pause = () => delay > 0 ? new Promise(resolve => setTimeout(resolve, delay)) : Promise.resolve();
    const scroll = async progress => {
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: 'instant' });
      ScrollTrigger.update();
      await pause();
      return api.progress;
    };
    const geometryMatches = p => items.every(item => near(value(item),
      Math.max(0, Math.min(1, (p - item.start) / (item.end - item.start)))));
    check('One architecture ScrollTrigger and a 100-unit timeline',
      ScrollTrigger.getAll().filter(t => t.vars.id === 'delta-architecture').length === 1 && near(master.duration(), 100));
    check('Scroll travel matches the responsive specification',
      near((trigger.end - trigger.start) / innerHeight, innerWidth <= 700 ? 7 : innerWidth <= 1100 ? 10 : 12));
    try {
      if (section === 'all' || section === 'chapters') for (const direction of ['forward', 'reverse']) {
        const chapters = direction === 'forward' ? expectedChapters : [...expectedChapters].reverse();
        for (const [id, start, end] of chapters) {
          const p = await scroll((start + end) / 2);
          check(`${direction}: ${id} geometry and copy`, geometryMatches(p) &&
            flow.dataset.chapter === id && panels.filter(el => !el.inert && el.getAttribute('aria-hidden') === 'false').length === 1);
        }
      }
      if (section === 'all' || section === 'cards') for (let n = 0; n < 6; n++) {
        const [id, start, end] = expectedChapters[n + 6];
        const card = cards[n];
        const expansion = document.querySelector(`[data-expansion="${card.dataset.card}"]`);
        for (const phase of [.25, .5, .75, 1]) {
          // Scroll offsets are quantized to physical pixels. Step one CSS pixel
          // past an exact completion boundary before requiring the final hold.
          const p = await scroll(start + (end - start) * phase +
            (phase === 1 ? 1 / (trigger.end - trigger.start) : 0));
          const shell = card.querySelector('.card-shell');
          const shellValue = parseFloat(getComputedStyle(shell).getPropertyValue('--k'));
          const expansionItems = items.filter(i => expansion.contains(i.element));
          const link = expansionItems.find(i => i.type === 'link');
          check(`${id}: synchronized at ${phase * 100}%`, geometryMatches(p) &&
            expansionItems.some(i => value(i) > 0) &&
            (phase === .25 ? shellValue > 0 && shellValue < 1 : near(shellValue, 1)) &&
            (phase === .75 ? value(link) > 0 && value(link) < 1 : true) &&
            (phase === 1 ? expansionItems.every(i => near(value(i), 1)) : true));
        }
      }
      if (section === 'all' || section === 'motion') {
      await scroll(0);
      const initial = items.map(value);
      await scroll(1);
      const complete = items.map(value);
      check('Rapid end jump resolves the complete scene', complete.every(v => near(v, 1)));
      await pause();
      if (delay > 0) check('No delayed independent construction after scroll stops', items.every((i, n) => near(value(i), complete[n])));
      await scroll(0);
      check('Reverse jump restores initial state exactly', items.every((i, n) => near(value(i), initial[n])));
      const a = await scroll(.565);
      const before = items.map(value);
      const b = await scroll(.5652);
      check('Small scroll steps produce proportional construction changes',
        b > a && items.every((item, n) => Math.abs(value(item) - before[n]) <=
          Math.abs(b - a) / (item.end - item.start) + .001));
      await scroll(.575);
      check('Incomplete cards cannot receive pointer or keyboard input',
        !cards[0].classList.contains('ready') && cards[0].getAttribute('tabindex') === '-1' &&
        getComputedStyle(cards[0]).pointerEvents === 'none');
      const panel = document.querySelector('.da-panel.active');
      const bounds = panel.getBoundingClientRect();
      check('Responsive active narrative fits in the pinned viewport', bounds.top >= -1 && bounds.bottom <= innerHeight + 1);
      }
    } finally {
      window.scrollTo({ top: originalScroll, behavior: 'instant' });
      ScrollTrigger.update();
    }
  }
  const failures = results.filter(r => !r.passed);
  const report = { passed: results.length - failures.length, failed: failures.length, viewport: [innerWidth, innerHeight], mode: flow.classList.contains('reduced') ? 'reduced' : 'motion', pieces: items.length, results };
  console.table(results);
  if (failures.length) throw new Error(`Architecture checks failed: ${JSON.stringify(failures)}`);
  return report;
}
