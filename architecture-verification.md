# DELTA architecture — local verification

## Saved implementation

The landing-page enhancement is in [architecture.js](architecture.js), loaded by
[index.html](index.html) with local GSAP 3.13.0 and ScrollTrigger bundles.
It adapts the existing compiled React mirror without replacing application or
portfolio-calculation bundles; this is not a new TypeScript/React source tree.

- One pinned ScrollTrigger; one normalized 100-unit master timeline.
- Thirteen explicitly scheduled child timelines and synchronized narrative panels.
- Five core slabs and six separately placed, function-specific expansions.
- 1,759 stable construction identifiers, including 97 cubes and 81 prisms.
- Separately timed base, sidewalls, top outline, and detail for every cube/prism.
- 1,500 measured SVG geometry lengths cached during setup.
- Six non-overlapping dashboard frames; illustrative financial values are labeled.
- Scroll travel: desktop 12, tablet 10, mobile 7 viewport heights.
- Reduced motion: complete geometry, no pinned trigger, all narrative panels accessible,
  and diagram ordered before narrative content.

Final repairs preserve mathematical case, give dashboard annotations and footers
separate vertical space, and register node rings/icons for measured path drawing.

## Starfield continuity (2026-10-09)

The site's fixed full-viewport starfield canvas (`position: fixed; z-index: 0`)
remains visible for the whole scroll. The architecture flow and stage layers are
now `background: transparent`; only a light text scrim remains over the copy
column (30% → 0 by 66% width on desktop; a soft top-to-bottom fade on mobile and
in reduced motion) so narrative copy stays legible without painting over the
space background. Nothing in the hero was changed.

Added a regression check, "Starfield stays visible: stage layers transparent,
scrim only softens copy area", which asserts the flow/stage backgrounds are
transparent, the scrim contains no opaque stop, and a fixed-position canvas is
present. The test suite now calls `ScrollTrigger.refresh()` before measuring so
post-resize runs observe the settled responsive travel (GSAP refreshes on a
debounce; asserting before it lands tested timing, not behavior).

## Checks run against the actual local page

The preview server responds at <http://127.0.0.1:4173/> (owned PID 19024 at verification).

| Check | Result |
| --- | --- |
| Mobile, 390 × 844 | 69 browser assertions passed |
| Desktop, 1440 × 1000 | Chapter suite: 39 passed; card suite: 37 passed; motion suite: 18 passed (shared setup assertions repeat) |
| Tablet, 900 × 900 | 68 browser assertions passed |
| Simulated reduced-motion preference, 900 × 900 | 16 assertions passed |
| Starfield-visible guard + chapters/cards/motion suites, 900 × 900 | 40 + 38 + 19 assertions passed |
| Motion suite after resize to desktop, 1440 × 900 | 19 passed (responsive travel 12 viewport heights) |
| Motion suite at mobile, 375 × 780 | 19 passed (responsive travel 7 viewport heights) |
| Visual: construction chapter 07 and final chapter at 1440 × 1000 | Stars visible behind the entire scene; no dark-blue sheet
| Native `location.reload()` at 50% | Progress 0.5 restored, chapter `intel`, panel 05 active, one scene, 1,759 unique identifiers |
| Completed-card pointer/click highlighting | Card, expansion, node and built connector chain highlighted; construction values and progress unchanged |
| Escape | Highlight cleared |
| Reduced-motion Launch DELTA click | Navigated to `/auth?from=hero`; existing sign-in/guest entry gate rendered |
| JavaScript syntax and entry dependencies | Passed |
| Browser-test module bundling | Passed |
| Existing minimum-weight regression suite | All checks passed |
| Existing views-editor regression suite | 35 passed, 0 failed |

The browser suite verifies construction state at each chapter midpoint in both
directions; card/extension synchronization at 25%, 50%, 75%, and completion;
rapid end/start jumps; proportional response to small scroll increments; unique
IDs; phase boundaries; cached path lengths; inactive-card focus/pointer gating;
non-overlapping card frames; and horizontal overflow.

Exact completion checks move one CSS pixel beyond the chapter boundary because
browser scroll offsets are quantized to physical pixels. They do not loosen the
construction-state comparison.

## Repeat the browser checks

Open the local landing page, then run in its browser console:

```js
await import('/test-architecture.mjs').then(m => m.runArchitectureChecks())
```

For a constrained browser automation timeout, run sections individually:

```js
await import('/test-architecture.mjs').then(m =>
  m.runArchitectureChecks({ section: 'chapters', delay: 0 }))
await import('/test-architecture.mjs').then(m =>
  m.runArchitectureChecks({ section: 'cards', delay: 0 }))
await import('/test-architecture.mjs').then(m =>
  m.runArchitectureChecks({ section: 'motion', delay: 0 }))
```

The default delayed suite additionally checks stability after scroll stops.
Sectioned zero-delay runs verify immediate scrubbed state, not elapsed-frame behavior.
The suite restores the original page scroll position when done.

## Limitations / remaining review

- Desktop screenshots of the construction sequence now capture reliably and
  confirm starfield continuity; a dedicated mobile screenshot is still pending,
  so tiny dashboard text on phones remains unverified by eye.
- Reduced motion was tested by simulating the media-query preference and rebuilding
  the scene. A real operating-system preference change and live preference toggle
  were not tested.
- Refresh restored the correct state, but absence of a first-paint flash was not
  established with frame-by-frame recording.
- No 60 FPS claim: animation frame pacing was not measured on representative hardware.
- No original reference image was available for a reliable comparative-density review.
- The existing application emits a `THREE.Clock` deprecation warning. No architecture
  runtime error or failed architecture dependency request was observed in final logs.
- This static mirror has no landing-page TypeScript typecheck; syntax, browser checks,
  and existing calculation regression suites were used instead.
- No commit, push, or deployment was performed. Published Pages behavior was not verified.
