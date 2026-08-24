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
  if (results.length > 1) {
    console.error(`"${name}": multiple matches, pick one and add "id_serie" to tools/series.json:`);
    results.forEach(s => console.error(`  id_serie=${s.ID_SERIE}  ${s.NOM_SERIE}  (${s.NB_TOME} tomes)`));
    return null;
  }
  return results[0];
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
