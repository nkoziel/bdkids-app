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
| `src/ui/` | `library` (grid), `sheet` (series detail + tome grid), `add` (catalog search + manual fallback), `refresh` (cycle-breaker), `layers` (Android back closes an overlay, not the app) |
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

`ui/layers.js` (ported from rayon-app's own `ui/layers.js`) makes the Android back gesture close
the open sheet/modal instead of exiting the installed app: every overlay pushes one history
entry via `openLayer(teardown)` when it opens, and `popstate` (back, or `closeLayer()` from a
control inside the app) pops it and runs the teardown. `openSheet()` opened from inside the
add-series modal (duplicate found — see below) calls `replaceLayer` instead, so it takes over
that modal's entry rather than stacking a second one.

## Status — 2026-08-24

**Tome grid shows real covers, not just numbers.** `catalog.json` already carried a `cover` per
tome (BDovore returns one per album); `sheet.js`'s tome-grid cells now use it as a background
image with a small corner number badge, dimmed (grayscale) when not owned and a green check
badge when owned — the numeric-only button is still the fallback for manually-added series with
no `tomes` data. Verified live for Ariol and Brume: covers loaded, owned state clearly readable
at a glance. Catalog also grew to 84 series (`Anatole Latuile`, 19 tomes, clean single BDovore
match).

**Two bugs fixed, both reported after the redesign below**: adding a series already in the
library created a duplicate card instead of opening the existing one (`core/state.js` gained
`findExistingSeries()`, matched by `catalogId` when the add came from the catalog, else by an
accent/punctuation-insensitive title match; `add.js`'s `confirmAdd` now opens the existing
sheet with a toast instead of calling `addSeries`); and the Android back gesture closed the
whole installed app instead of just the open sheet/modal, because nothing pushed a history
entry — fixed by porting `ui/layers.js` from rayon-app (see below). Both verified live in a
browser: searched an already-added series from the catalog, got the existing sheet and a toast
instead of a 4th duplicate card; browser back closed the sheet and landed back on the library
grid rather than leaving the page.

**UI restyled for a kid audience**: `src/style.css` moved from rayon-app's dark charcoal theme to
a bright light theme (cream/sky gradient background, rainbow-accented cards cycling through 7
colors via `nth-child`, Baloo 2 for headings, Nunito for body, pill-shaped "pop" buttons with an
offset shadow). `manifest.webmanifest` and the `theme-color` meta updated to match. Buttons in
`sheet.js`/`add.js` that were missing the `.btn` class (`removeBtn`, `rangeAddBtn`, `addConfirm`)
now have it, for consistent styling.

**Catalog expanded from 70 to 83 series** (`tools/series.json` + regenerated
`src/data/catalog.json`): added series similar in spirit to the original 6 (Ariol, Tom-Tom et
Nana, Bergères guerrières, Brume, Elfie, Les Légendaires) — school/family humor (Le Petit Nicolas,
Pico Bogue, Quatre sœurs, Les Vermeilles) and heroic-fantasy/magic adventure with young heroines
(Sorceline, Hilda, Mélusine, Les Chevaliers d'Émeraude, Amulet, Bone, La Balade de Yaya, Le
Château des étoiles, Les Dragouilles). Deliberately skipped Wakfu/Dofus — BDovore tags both
`genre=Mangas`, against this project's no-manga rule. `npm run fetch:bdovore` output was
spot-checked against BDovore's raw search results for near-misses (e.g. "Amulette" auto-matched
a wrong 2-tome series; the real one is titled "Amulet" in French too, `id_serie=16258`).

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
