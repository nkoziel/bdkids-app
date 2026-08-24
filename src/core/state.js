/* The library: one entry per BD series.
 *
 * Shape of an entry:
 *   { id, title, author, publisher, total, owned, cover, notes, updatedAt, catalogId, tomes }
 *
 * - id        : uid(), stable, never the title (titles collide and get retitled)
 * - total     : number of tomes published, or null when unknown — never guessed
 * - owned     : range string, see core/tomes.js
 * - cover     : data URL or remote URL, optional
 * - catalogId : id of the matching entry in data/catalog.js, when added from it — optional
 * - tomes     : [{num, title, isbn, publishedAt, cover}], from the catalog — optional, absent
 *               for manually-added series, which only ever have plain tome numbers
 *
 * No chapter/reading axis at all — see CLAUDE.md. This is a shelf, not a reader.
 */

import { store } from './store.js';
import { uid } from './dom.js';

const LIB_KEY = "bdkids:lib:v1";

export let LIB = store.get(LIB_KEY) || {};

export function saveLib(){ return store.set(LIB_KEY, LIB); }

export function addSeries({ title, author = "", publisher = "", total = null, cover = "", notes = "", catalogId = null, tomes = null }){
  const id = uid();
  LIB[id] = { id, title: title.trim(), author, publisher, total: total || null, owned: "", cover, notes, updatedAt: Date.now(), catalogId, tomes };
  saveLib();
  return LIB[id];
}

export function updateSeries(id, patch){
  if (!LIB[id]) return;
  Object.assign(LIB[id], patch, { updatedAt: Date.now() });
  saveLib();
}

export function removeSeries(id){
  delete LIB[id];
  saveLib();
}

export const allSeries = () => Object.values(LIB).sort((a, b) => a.title.localeCompare(b.title, "fr"));

/* Title normalisation for duplicate detection only — never a storage key. Accent-insensitive,
   punctuation-insensitive, so "Ariol (2e série)" and "ariol 2e serie" match. */
const normTitle = s => (s || "").toLowerCase().normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^\p{L}\p{N}]/gu, "");

/* Is this series already in the library? Catalog adds are matched by catalogId (exact, stable
   across a title rename in the source data); manual adds only ever have a title to go on. */
export function findExistingSeries({ catalogId, title }){
  const entries = Object.values(LIB);
  if (catalogId) {
    const hit = entries.find(s => s.catalogId === catalogId);
    if (hit) return hit;
  }
  const t = normTitle(title);
  return entries.find(s => normTitle(s.title) === t) || null;
}
