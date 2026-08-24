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
| `src/data/` | `catalog.json` (static, baked BDovore data) + `catalog.js` (search/lookup) |
| `src/ui/` | `library` (grid), `sheet` (series detail + tome grid), `add` (catalog search + manual fallback), `refresh` (cycle-breaker) |
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

**Core library flow works end to end**, verified live in a browser: search the local catalog
when adding a series (autocomplete pre-fills title/cover/total/tome list from BDovore data),
manual entry still available for anything not in the catalog, tick tomes owned via a tap grid
or an "add range" gesture, missing/gap badge on the library grid, per-series notes. 45 tests on
`core/tomes.js` (ported from rayon-app's `core/volumes.js` / Phase 3b) pass; `npm run build`
produces a working single-file bundle (~40 KB); `git init` + commits done, **not pushed to
GitHub yet**.

`sw.js` still has a `__METADATA_SOURCE_HOSTNAME__` placeholder — harmless leftover now that
BDovore is fetched at dev time rather than at runtime (see below), can be deleted. Icons
referenced by `manifest.webmanifest`/`sw.js` still don't exist.

## Metadata: baked at dev time, not fetched live

BDovore's unofficial JSON API is the source (see `BD-Metadata-Sources.md` in the vault for the
full research). It has **no CORS header**, so it can't be called from the browser — but since
only a handful of series are tracked, there's no need to: `tools/fetch-bdovore.js` runs in
Node (no CORS restriction there) and writes `src/data/catalog.json`, committed to the repo.
`src/data/catalog.js` exposes `searchCatalog(term)` / `catalogTomes(id)` over that static file.
**Zero runtime network calls to BDovore** — only cover images are hotlinked
(`bdovore.com/images/couv/...`), which needs no CORS for a plain `<img>`.

To add a series or refresh tome counts: edit `tools/series.json`, run
`npm run fetch:bdovore`, commit the updated `catalog.json`. `id_serie` in `series.json`
disambiguates when a title search matches multiple BDovore series (common — e.g. "Ariol" has
two editions, "Tom-Tom et Nana" collides with unrelated "Nana" manga entries).

**Data-quality note**: BDovore's raw `Album` listing includes hors-série/coffret entries with
`NUM_TOME=0` mixed in with the real numbered tomes. `catalogTomes()` filters `num > 0`, which
matched each series' own tome count exactly on all six checked — but re-verify if a series
looks off after adding it.

## Data model

One entry per series, no chapter axis at all:

```
{ id, title, author, publisher, total, owned, cover, notes, updatedAt, catalogId, tomes }
```

`owned` is a **range string** (`"1-7,9,12-14"`), ported verbatim from rayon-app's
`core/volumes.js` (its Phase 3b: "tick off the volumes I own, see what's missing at the
bookshop" — literally this app's entire premise) into `core/tomes.js`. Compact,
diff-friendly, survives a JSON export unchanged, human-readable. `total` is `null` until
known — **never guessed**.

`catalogId` and `tomes` (`[{num, title, isbn, publishedAt, cover}]`) are set when a series was
added from the local catalog; both are `null`/absent for a manually-added series. `sheet.js`
uses `tomes` to label each grid cell with its title (hover `title` + `aria-label`, so the
number stays the accessible name — don't drop the `aria-label` in favor of bare `title`, a
screen reader would announce the book title instead of "Tome N").

## Architecture decisions carried over from rayon-app

- No account, no backend — everything in the browser, **confirmed workable**: the CORS gap on
  BDovore is worked around at dev time (see above), not with a runtime proxy.
- Single self-contained `index.html` built via `vite-plugin-singlefile`.
- No framework, no TypeScript, no backend for now.
- Public GitHub repo + GitHub Pages continuous deploy — **not created yet**, ask before
  `git push`/enabling Pages (global rule).
- Git identity: GitHub `noreply` address (repo is meant to be public, same as rayon-app).

## Reference documents

- Vault notes: `G:\Mon Drive\NKO\Projects\bdkids-app\` — project note, `BD-Metadata-Sources.md`
  (metadata API research), roadmap once written.
- Sibling project for architecture patterns: `C:\dev\rayon-app\CLAUDE.md`.
