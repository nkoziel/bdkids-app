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
| `src/core/` | dom/store/state helpers — no UI, no app flow (not yet populated) |
| `src/data/` | fetching and deriving from the chosen metadata source(s) (not yet populated — see below) |
| `src/ui/` | screens/components (not yet populated) |
| `src/main.js` | wiring and boot only |
| `src/style.css`, `src/index.html` | CSS and the page shell |
| `index.html` (root) | generated single file, committed, served by Pages |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA files, outside the bundle, edited directly |

```
npm run build      # src/ -> dist/index.html -> copied to the repo root
npm run verify      # zero-dependency checks, mirrors rayon-app
npm run dev         # Vite dev server on src/
node tools/check-refs.js   # free variables + import cycles
```

## Status — 2026-08-24, project just started

Only the build scaffolding and a placeholder shell exist. **No metadata source is wired in
yet.** The vault reference note `BD-Metadata-Sources.md` (in
`G:\Mon Drive\NKO\Projects\bdkids-app\`) tracks the research on which API(s) to use for series
and tome listings — read it before adding `src/data/`.

Consequence: `sw.js` has a `__METADATA_SOURCE_HOSTNAME__` placeholder to fill in once that
decision lands, and the icons referenced by `manifest.webmanifest`/`sw.js` don't exist yet.

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
