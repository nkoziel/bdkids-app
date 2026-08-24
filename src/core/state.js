/* The library: one entry per BD series.
 *
 * Shape of an entry:
 *   { id, title, author, publisher, total, owned, cover, notes, updatedAt }
 *
 * - id       : uid(), stable, never the title (titles collide and get retitled)
 * - total    : number of tomes published, or null when unknown — never guessed
 * - owned    : range string, see core/tomes.js
 * - cover    : data URL or remote URL, optional
 *
 * No chapter/reading axis at all — see CLAUDE.md. This is a shelf, not a reader.
 */

import { store } from './store.js';
import { uid } from './dom.js';

const LIB_KEY = "bdkids:lib:v1";

export let LIB = store.get(LIB_KEY) || {};

export function saveLib(){ return store.set(LIB_KEY, LIB); }

export function addSeries({ title, author = "", publisher = "", total = null, cover = "", notes = "" }){
  const id = uid();
  LIB[id] = { id, title: title.trim(), author, publisher, total: total || null, owned: "", cover, notes, updatedAt: Date.now() };
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
