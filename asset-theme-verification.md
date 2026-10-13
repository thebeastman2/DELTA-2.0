# Asset coverage and theme logo verification

## Delivered catalogue

[asset-directory.json](assets/asset-directory.json) contains **7,485 unique instruments**:

| Class | Verified instruments |
| --- | ---: |
| Equities | 5,285 |
| ETFs | 2,031 |
| Commodity funds | 29 |
| Crypto USD pairs | 140 |

All retained instruments have a real positive recent Yahoo quote, at least **1,009 valid daily history observations**, and a confirmed provider identity and instrument type (EQUITY, ETF, or CRYPTOCURRENCY). No synthetic quotes or returns were generated. The reference ETF feed mixes mutual funds and other instrument types; these were excluded rather than counted as ETFs. Provider names replace stale reference names (for example, A is Agilent, not delisted AgileThought).

[asset-coverage-report.json](asset-coverage-report.json) accounts for all 22,743 eligible reference candidates, with **15,258 excluded** and **zero unresolved transport failures**. Each excluded symbol has a reason. Coverage is a point-in-time verification, not a promise that upstream data will always be available.

## Calculation theme and commodities follow-up

- [Calculation details](calc-details.js) now uses DELTA's existing accent, accent-light, accent-200, card, muted, foreground, and border tokens instead of hard-coded teal. Formula layout, inputs, and calculation logic are unchanged. Buttons, hover/focus, section labels, input values, formula panels, modal borders, and worked-calculation panels follow the selected theme without a reload.
- [Index](index.html) loads `calc-details.js?v=2` to avoid stale calculation styles.
- Commodities exposes 29 verified exchange-traded funds spanning gold, silver, platinum, palladium, copper, crude/Brent oil, natural gas, gasoline, agriculture, and broad baskets. These are investable fund exposures, not spot or futures contract prices. Twelve existing ETFs were reclassified and 17 newly verified funds added; symbols remain unique.
- Fixed Income was removed from the universe filter list. Bond funds remain in ETF and saved portfolios are preserved; no holdings were deleted or reweighted.
- The catalogue verifier preserves commodity classifications when resumed/refreshed, and validates their provider type as ETF.

### Follow-up verification

- Final [catalogue suite](test-asset-directory.mjs): **20 passed**. [Calculation theme suite](test-calculation-theme.mjs): passed. Existing minimum-weight and views-editor suites: **16 and 35 passed**, respectively. Edited JavaScript syntax checks passed.
- All 29 commodity funds returned real positive prices and at least 1,009 daily history points through DELTA's existing Convex refresh/query APIs (all batches succeeded).
- Rendered commodity category: **29 rows, all priced and classified Commodities**; no Fixed Income filter. Searching Copper returned CPER. CORN appeared and enabled Add in the portfolio picker; no saved holdings were changed.
- Default blue calculation modal was visually confirmed in a screenshot matching the supplied layout. All 22 visible ƒx buttons shared the theme colour. Entering #f97316 through Settings changed all 22 buttons, modal labels, formula, input values, and border to the orange ramp; Reset restored #4a6cf7 and cleared the temporary saved preference.
- Preview mouse coordinates/frame advancement were intermittent. Keyboard input and DOM-handler fallback were used for some navigation; ordinary text input, computed styles, rendered rows, and backend data were checked directly. No app navigation code was changed for that preview issue.
- The compiled mirror has no TypeScript typecheck. No commit or deployment was performed.

## Earlier application changes

- [Landing bundle](assets/Landing-C4mphqqp.js): removed the requested closing footer entirely; updated the headline asset count to reflect the smaller verified catalogue, retaining previous tagline and closing copy.
- [Dashboard bundle](assets/Dashboard-CTKqEs0Z.js): uses the shared verified catalogue for universe counts and portfolio selection, blocks unknown tickers through both Add and Enter, only renders priced asset rows, and provides Previous/Next pagination rather than truncating access at 300 assets.
- [Catalogue module](assets/asset-directory.js): validates history and provider identity, shares a single directory fetch, seeds actual recent provider quotes, and removes explicitly unavailable tickers from the in-session catalogue without deleting saved holdings.
- Quote refreshes use the existing Convex actions in batches of 20. Provider/network errors remain visible; mass outages do not erase the catalogue.
- [Logo bundle](assets/DeltaLogo3D-qcLWtha6.js): reads DELTA's existing `--accent` CSS variable; theme updates change the 3D material, emission, coloured lights, and glow. Its observer is disconnected on unmount; rotation is unchanged.
- [Architecture](architecture.js): market-data label now says VERIFIED ASSETS, avoiding the outdated 16K claim; animation and geometry are unchanged.

## Checks performed

- Final catalogue/unit integration suite: **18 checks passed**.
- Existing minimum-weight suite: **16 checks passed**, including 500 random feasible cases.
- Existing views-editor/Black–Litterman suite: **35 passed, 0 failed**.
- Edited JavaScript syntax checks: passed.
- Architecture chapter regression on the rendered desktop page: **40 passed, 0 failed** after the label change.
- Real DELTA backend: 18 representative instruments, six per asset class, returned both daily history and live quotes through the existing refresh/query interface. No sample failed.
- Rendered desktop universe: final identity-validated catalogue loaded with 7,468 assets (2,043 ETFs); 300 priced rows on each of two ETF pages, Next changed the first ticker and page number; 140 crypto rows had no missing prices.
- Portfolio picker: nonexistent DELTANODATA was rejected via Enter and its Add button was disabled; ADA-USD was suggested and enabled.
- Temporary ADA-USD/SMH portfolio added through the UI: optimization and out-of-sample backtest returned finite results. The temporary portfolio was deleted afterward; all four original portfolios and their constituents were retained.
- Appearance Settings: entering #f97316 and, on the final page, #8b5cf6 updated `--accent`, the logo's recorded applied material colour, glow, and stored preference. Reset restored #4a6cf7.
- One initial test inferred ETF class from its name and failed after corrected provider names omitted the word ETF. It now asserts the actual confirmed provider instrument type instead; the full final 18-check suite passed.
- Rendered landing page: requested footer absent; prior tagline and closing copy retained.
- Local preview responds HTTP 200 at http://127.0.0.1:4173/.

## Repeat / refresh

Run from the workspace root with an available Node executable:

```bash
node mirror/test-asset-directory.mjs
node mirror/test-minweight.mjs
node mirror/test-views-editor.mjs
node mirror/tools/verify-asset-directory.mjs --refresh
```

The verifier uses bounded concurrency, retries transient transport errors, and saves resumable checkpoints in `.freebuff/asset-coverage-checkpoint.json`. Without `--refresh`, it resumes existing checks; `--refresh` rechecks all candidates and regenerates the catalogue/report. This static checkout has no scheduled backend job to regenerate reference membership. Quotes still refresh through the existing app backend every two hours when viewed.

## Optimization button loader

The trefoil spinner supplied with the request was measured first: it is a mirror-symmetric 3-lobe glyph with 3 crossings at 0.391–0.507 of its outer radius. Its 5-fold sibling is therefore a woven 5-point star.

- [Dashboard bundle](assets/Dashboard-CTKqEs0Z.js): `__DeltaLoader` renders that pentafoil as two paths (faint track + travelling car) on a `0 0 40 40` viewBox with `stroke-width` 4, the same geometry and motion signature as the reference loader.
- Both optimization buttons swap their label for the spinner: **Optimize this portfolio** sets a busy flag and switches view after 450 ms, **Run Optimization** shows it for a full two-second window (next section). Idle labels, icons and the `disabled` behaviour are otherwise unchanged.
- [index.html](index.html): the loader stylesheet draws in `currentColor`, so it inherits whatever the button's text colour is (including a custom Settings accent) with no hard-coded colours; `prefers-reduced-motion` slows the travel instead of stopping the feedback.
- [Generator](tools/pentafoil-path.mjs): `{5/2}` star polygon → Chaikin corner cutting → radial power 2.2 → uniform arc-length resample into the viewBox. The committed constant is byte-identical to the generator's output.
- Geometry measured against the reference glyph: **5 crossings**, crossing radius 0.43 (reference 0.391–0.507), 10th-percentile strand gap 1.25 of 40 (reference 1.26), C5 rotation error 0.000.

Checks performed:

- [Loader suite](test-loader.mjs): **19 checks passed** — an ES-module parse of the bundle, both button states, the run gate below, accessible `role="status"`/`aria-busy`, theme tokens, motion signature, and the geometry invariants above.
- Running app (local preview, guest session): clicking **Optimize this portfolio** replaced the label with the spinner, set `aria-busy="true"`, disabled the button, reported computed `stroke: currentColor` (matching the button colour), ran one 1.4s `delta-loader-travel` animation whose `stroke-dashoffset` advanced, then switched to the Optimize view. **Run Optimization** behaved the same at 16px and returned to the sparkle icon plus label afterwards.
- The artifact was rendered at 120/48/20/16 px and on primary, custom-accent and ghost surfaces from the real path and stylesheet: 5-lobe weave, travelling dash, colour inherited from each surface.
- Existing suites re-run: calculation theme and views-editor passed. `test-asset-directory.mjs` still fails its snapshot quote check because the committed quotes are older than the bundle's 2-hour TTL (SPY quote 3.42 h old when last run here; the whole snapshot aged out together); that check reads `assets/asset-directory.js` and the JSON snapshot only, whose last write predates the changes recorded here.

## Optimize run gate

Changing **Method** used to swap every figure in the results panel at once, because the bundle derived the whole panel from the live dropdown value; the run itself was a 450 ms flag the user could easily miss, and the panel could also show results for a method the target portfolio had never been optimized with. The selection is now split into the pending choice (the dropdown) and the applied method (what is on screen).

- [Dashboard bundle](assets/Dashboard-CTKqEs0Z.js): the results panel keys off `__optApplied` while the dropdown only moves the pending choice. Clicking **Run Optimization** snapshots the method into the existing run ref, arms a 2000 ms window, and only then commits the new method and writes the run back to the portfolio. The tab also adopts the portfolio's own stored optimization when it opens (once per target portfolio, so a pending choice is never clobbered).
- The busy state spans that whole window instead of the parent's 450 ms `running` flag: the button is `disabled` with `aria-busy="true"` and no label, and the results header swaps "Optimization complete" for the same spinner plus "Optimizing".
- A muted line above the button reads "Method changed. Click Run Optimization to apply it." while the dropdown differs from the applied method, so an inert dropdown never reads as broken; it hides while a run is in flight.
- [Patch script](patch-optimize-gate.mjs) does the rewrite with before/after anchor assertions, a module-parse gate before writing, and a backup at `assets/Dashboard-CTKqEs0Z.js.pre-optimize-gate`.

Checks performed:

- Running app (local preview, guest session, real mouse clicks): selecting **Hierarchical Risk Parity**, **Black-Litterman**, **Minimum Variance** and **Maximum Return** each left the panel untouched (header still the previous method, first four figures unchanged at 28.15 / 23.84 / 0.992 / 2.770 for the Max-Sharpe run), showed the hint, and wrote nothing (`localStorage` still held the previous `optimization.method`).
- A `setTimeout` spy recorded exactly one long timer per Run click: `2000 ms`. During the window the button reported `disabled` and `aria-busy="true"` with an empty label in the same 239×36 box, two spinners rendered at 16 px and 14 px with `animation: delta-loader-travel 1.4s`, `stroke-dasharray: 15px, 85px`, a 0.2-opacity track and the dash stroke equal to the button's text colour, the header read "Optimizing", and the old figures were still on screen. On commit the header, figures and sidebar agreement all moved to the new method, the spinners disappeared, and the selected portfolio's stored run changed to that method (`mptMinVar`).
- Leaving the tab and reopening it showed the portfolio's own stored run (**Minimum Variance**) rather than the old hard-coded default; before this change the same panel opened on Maximum Sharpe Ratio while the portfolio's stored run was Maximum Sortino, and a Run click from that state silently rewrote the portfolio from `mptMaxSortino` to `mptMaxSharpe`.
- A control run of an ordinary `setTimeout(2000)` in the same preview fired at 2361 ms and 2987 ms, so the 2.2–3.4 s commit latencies measured here are the webview's timer throttling, not the app.
- Regression suites on the final artifact: loader **19/19**, architecture, architecture bundle, calculation theme, minweight and views-editor all pass.
- The suite's syntax gate was upgraded from `node --check` to a real `vm.SourceTextModule` parse: `--check` parses this chunk as a script and passed a bundle that the browser rejected with `SyntaxError: Missing initializer in const declaration`. The stricter gate reproduced that failure, and the module-parse gate now also runs inside the patch script before anything is written.

## Limitations

- Screenshot capture is intermittent. The current calculation modal and orange ƒx workspace were visually confirmed; commodity rows and the custom-colour modal were verified through rendered DOM/computed styles and real provider responses.
- Full daily-history/identity coverage was checked directly against Yahoo; the existing Convex backend was exercised with representative stock/ETF/crypto samples plus all 29 commodity funds, not all 7,485 assets.
- Market-data providers can rate-limit or withdraw coverage. Confirmed missing quotes are hidden; transport errors are not treated as proof an asset no longer exists.
- Browser logs contained the existing THREE.Clock deprecation and some Convex query latency messages (over 20 seconds); no new application error or failed local dependency request was observed. No performance claim is made.
- Existing saved portfolios are preserved, including any legacy holdings no longer eligible for new selection. They are not silently reweighted or deleted.
- No TypeScript source/typecheck exists for this compiled mirror; syntax and runtime/regression tests were used. The unrelated `app/` project was not modified.
- No commit, push, or deployment was performed; changes are local only.
- The two-second Run window is presentation only: no result is produced until it elapses, but it does not lengthen any computation, and the loader duration is a fixed delay rather than real progress. **Optimize this portfolio** keeps its existing 450 ms window.
- Code-level, not reproduced: the commit and the write-back both live in the Optimize view's own timer and effect, so unmounting that view inside the two-second window should drop them and leave the portfolio on its previous run. The preview could not be driven to change views quickly enough to observe this (its rendering lags by seconds under throttling), so it is inferred from the wiring rather than measured.
- Run Optimization persists the method shown in the dropdown, and the tab only adopts a stored method that its own option list still offers; a legacy method key would leave the tab on its default.
- `index.html` keeps its filename, so a previously cached copy on a deployed host may need a reload to pick up the loader stylesheet; the app bundle itself is still reachable at its existing hashed path.
- Preview screenshots and timers are unreliable while the preview webview is not composited, so the in-app loader window was captured through DOM/computed-style sampling plus a rendered artifact screenshot rather than a live in-button screenshot.
