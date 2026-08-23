# DELTA 2.0 — Portfolio Optimization Platform

Static snapshot of **Delta Optima**, the deployed app at
[deltathebeastman2.freebuff.app](https://deltathebeastman2.freebuff.app/).

> ⚠️ This is the **compiled production bundle** (minified JS) mirrored from the
> live deployment — not the original TypeScript source. The source lives in the
> Freebuff Web project `quiet-poems-speak`.

## What's inside

| Path | Description |
| --- | --- |
| `index.html` | App shell (Vite entry) |
| `assets/` | All JS chunks + CSS (entry, route chunks, vendor bundles) |
| `logo.svg` / `logo.png` | Site logo |
| `manifest.webmanifest` | PWA manifest |
| `serve.ps1` | Local static server (PowerShell) for offline viewing |

## Run locally

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

then open <http://localhost:4173/>.

The app is a React SPA backed by a live Convex database, so it still needs
internet access for data (fonts load from Google CDN, data from Convex).
