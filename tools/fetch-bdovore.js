#!/usr/bin/env node
/*
 * Fetch series + tome data from BDovore's unofficial JSON API and bake it into a static
 * src/data/catalog.json, committed to the repo.
 *
 * Node has no CORS restriction — that's the whole point. BDovore's API sends no
 * Access-Control-Allow-Origin header, so the browser can't call it directly (see
 * BD-Metadata-Sources.md in the vault). Running the fetch here instead means the shipped app
 * has ZERO runtime network dependency on BDovore's API — only cover images are hotlinked at
 * render time, which needs no CORS for a plain <img>.
 *
 * Run again whenever tools/series.json changes, or to refresh a series after a new tome comes
 * out. This is a manual, on-demand step — not a live search, and there's no proxy to run or
 * maintain.
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.bdovore.com/getjson';
const SERIES_LIST = require('./series.json');
const OUT = path.join(__dirname, '..', 'src', 'data', 'catalog.json');

async function getJSON(params) {
  const url = `${BASE}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'bdkids-app (personal project, fetch script, contact via github.com/nkoziel)' },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/* At small scale (a handful of series) an ambiguous match was worth stopping and asking about.
 * At ~100 series that doesn't scale, so this auto-resolves — but BDovore's server-side search
 * turned out to be a loose OR-of-words match, not a phrase match: searching "Boule et Bill"
 * returned dozens of unrelated series that merely contain the word "Bill" (Buffalo Bill, Bill
 * Baroud, Chick Bill...), and an earlier version of this heuristic that preferred the "Jeunesse"
 * genre as a tie-breaker picked one of those strays, because the real "Boule et Bill" editions
 * are tagged "Humour", not "Jeunesse". Fixed by tightening relevance FIRST: only candidates
 * whose own name actually contains the full query phrase are considered at all. Only then does
 * it prefer an exact title match, then whichever edition the most BDovore users have in their
 * own collection (NBR_USER_ID_SERIE) — a real popularity signal, used to pick the canonical
 * edition among several (original vs. reissue vs. anniversary box set etc.). Every auto-pick is
 * logged so the result stays spot-checkable, and it bails out (returns null) rather than
 * guessing blindly when nothing separates the top two candidates, or when nothing contains the
 * query phrase at all. */
async function findSeries(name, wantedId) {
  const results = await getJSON({ data: 'Serie', term: name, mode: 2 });
  if (wantedId) {
    const hit = results.find(s => String(s.ID_SERIE) === String(wantedId));
    if (!hit) console.error(`"${name}": id_serie ${wantedId} not found in results`);
    return hit || null;
  }
  if (results.length === 0) {
    console.error(`"${name}": no match, skipped`);
    return null;
  }

  const target = normalize(name);
  let candidates = results.filter(s => normalize(s.NOM_SERIE).includes(target));
  if (candidates.length === 0) {
    console.error(`"${name}": ${results.length} loose match(es) from the server, but none actually contains the query phrase — skipped rather than guessed`);
    return null;
  }

  const clean = candidates.filter(s => s.ORIGINE === 'BD' && !/\((en |v\.o\.|artbooks?)/i.test(s.NOM_SERIE));
  if (clean.length > 0) candidates = clean;
  if (candidates.length === 1) return candidates[0];

  const exact = candidates.filter(s => normalize(s.NOM_SERIE) === target);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) candidates = exact;

  candidates = [...candidates].sort((a, b) => (Number(b.NBR_USER_ID_SERIE) || 0) - (Number(a.NBR_USER_ID_SERIE) || 0));
  const top = Number(candidates[0]?.NBR_USER_ID_SERIE) || 0;
  const runnerUp = Number(candidates[1]?.NBR_USER_ID_SERIE) || 0;
  if (candidates.length > 1 && top > 2 * Math.max(runnerUp, 1)) {
    console.error(`"${name}": ambiguous, auto-picked id_serie=${candidates[0].ID_SERIE} "${candidates[0].NOM_SERIE}" (${top} users) over "${candidates[1].NOM_SERIE}" (${runnerUp} users)`);
    return candidates[0];
  }

  console.error(`"${name}": still ambiguous, pick one and add "id_serie" to tools/series.json:`);
  candidates.slice(0, 6).forEach(s => console.error(`  id_serie=${s.ID_SERIE}  ${s.NOM_SERIE}  (${s.NB_TOME} tomes, genre=${s.NOM_GENRE}, users=${s.NBR_USER_ID_SERIE})`));
  return null;
}

async function main() {
  const catalog = [];
  for (const entry of SERIES_LIST) {
    const serie = await findSeries(entry.name, entry.id_serie);
    if (!serie) continue;

    const albums = await getJSON({ data: 'Album', id_serie: serie.ID_SERIE, mode: 1 });
    const tomes = albums
      .map(a => ({
        num: Number(a.NUM_TOME),
        title: a.TITRE_TOME,
        isbn: a.EAN_EDITION || a.ISBN_EDITION || null,
        publishedAt: a.DTE_PARUTION || null,
        publisher: a.NOM_EDITEUR || null,
        cover: a.IMG_COUV ? `https://www.bdovore.com/images/couv/${a.IMG_COUV}` : null,
      }))
      .filter(t => Number.isFinite(t.num))
      .sort((a, b) => a.num - b.num);

    catalog.push({
      id: `bdovore:${serie.ID_SERIE}`,
      name: serie.NOM_SERIE,
      genre: serie.NOM_GENRE || null,
      total: Number(serie.NB_TOME) || tomes.length || null,
      ongoing: serie.FLG_FINI_SERIE === '1',
      description: serie.HISTOIRE_SERIE || null,
      cover: serie.IMG_COUV_SERIE ? `https://www.bdovore.com/images/couv/${serie.IMG_COUV_SERIE}` : null,
      tomes,
    });
    console.log(`${serie.NOM_SERIE}: ${tomes.length} tomes`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${catalog.length} series to ${path.relative(process.cwd(), OUT)}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
