# BDkids — notes for Claude Code

Standalone PWA: physical bande dessinée library tracker for Nicolas's kids. For each series
(Ariol, Tom-Tom et Nana, Bergère Guerrière, Brume, Elfie, Les Légendaires, Astérix, etc.),
shows which tomes are already owned — the point is checking in a bookshop before buying a
duplicate.

**No manga. No reading progress, no chapters, no in-app reader.** The only state per tome is
**owned / not owned**. This is the key difference from the sibling project `rayon-app`
(`C:\dev\rayon-app`), whose architecture this repo otherwise borrows.

## Language policy

**All code, comments, documentation and commit messages are in English.** UI strings are French
(the target users are French-speaking children; no English UI need identified — revisit if that
changes).

## Layout — read this before editing anything

> **The root `index.html` is a BUILD ARTIFACT. Never edit it directly once the build exists.**
> `npm run build` overwrites it.

| Path | What it is |
|---|---|
| `src/core/` | `dom`, `store`, `state`, `tomes` — no UI, no app flow |
| `src/data/` | fetching and deriving from the chosen metadata source(s) (not yet populated — see below) |
| `src/ui/` | `library` (grid), `sheet` (series detail + tome grid), `add` (new series), `refresh` (cycle-breaker) |
| `src/main.js` | wiring and boot only |
| `src/style.css`, `src/index.html` | CSS and the page shell |
| `index.html` (root) | generated single file, committed, served by Pages |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA files, outside the bundle, edited directly |

```
npm run build      # src/ -> dist/index.html -> copied to the repo root
npm run verify      # tools/check-refs.js + vitest
npm run test        # Vitest
npm run dev         # Vite dev server on src/
node tools/check-refs.js   # free variables + import cycles
```

`ui/refresh.js` is the cycle-breaker: `library.js` opens a sheet, the sheet changes ownership,
that must redraw `library.js` — importing directly gives an import cycle (`check-refs.js`
catches these; it caught exactly this one when the modules first landed). `main.js` registers
`onLibraryChanged(renderLibrary)` once; `sheet.js`/`add.js` call `libraryChanged()` without
importing whatever owns rendering. Same pattern as rayon-app's own `ui/refresh.js`.

## Status — 2026-08-24

**Core library flow works end to end**, verified live in a browser: add a series manually,
tick tomes owned via a tap grid or an "add range" gesture (own 1 to N in one action),
missing/gap badge on the library grid, per-series notes. 45 tests on `core/tomes.js` (ported
from rayon-app's `core/volumes.js` / Phase 3b) pass; `npm run build` produces a working
single-file bundle; `git init` + first commit done.

**No metadata source is wired in yet.** `src/data/` does not exist. The vault reference note
`BD-Metadata-Sources.md` (in `G:\Mon Drive\NKO\Projects\bdkids-app\`) tracks the research on
which API(s) to use for series and tome listings — read it before adding `src/data/`.

Consequence: `sw.js` has a `__METADATA_SOURCE_HOSTNAME__` placeholder to fill in once that
decision lands, and the icons referenced by `manifest.webmanifest`/`sw.js` don't exist yet.

`core/store.js` already exposes an IndexedDB metadata cache (`kvGet`/`kvSet`), unused for now,
so wiring in a real source later is a data-layer-only change.

## Data model

One entry per series, no chapter axis at all:

```
{ id, title, author, publisher, total, owned, cover, notes, updatedAt }
```

`owned` is a **range string** (`"1-7,9,12-14"`), ported verbatim from rayon-app's
`core/volumes.js` (its Phase 3b: "tick off the volumes I own, see what's missing at the
bookshop" — literally this app's entire premise) into `core/tomes.js`. Compact,
diff-friendly, survives a JSON export unchanged, human-readable. `total` is `null` until
known — **never guessed**.

## Architecture decisions carried over from rayon-app (unless the metadata research says otherwise)

- No account, no backend — everything in the browser. **At risk**: if the chosen metadata
  source has no CORS support for browser fetch, this may force a tiny serverless proxy —
  check `BD-Metadata-Sources.md` before assuming this holds.
- Single self-contained `index.html` built via `vite-plugin-singlefile`.
- No framework, no TypeScript, no backend for now.
- Public GitHub repo + GitHub Pages continuous deploy — **not created yet**, ask before
  `git push`/enabling Pages (global rule).
- Git identity: GitHub `noreply` address (repo is meant to be public, same as rayon-app).

## Reference documents

- Vault notes: `G:\Mon Drive\NKO\Projects\bdkids-app\` — project note, `BD-Metadata-Sources.md`
  (metadata API research), roadmap once written.
- Sibling project for architecture patterns: `C:\dev\rayon-app\CLAUDE.md`.
