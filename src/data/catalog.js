/* Local, static BD catalog — see tools/fetch-bdovore.js and the vault note
 * BD-Metadata-Sources.md for where this data comes from and why it's baked in rather than
 * fetched live (BDovore's API has no CORS header).
 *
 * Raw entries with num=0 are hors-serie/spin-off/coffret editions, not part of the main
 * numbered run — dropped here rather than in the fetch script, so the raw data stays available
 * if a future need appears for them.
 */
import catalog from './catalog.json';

export function searchCatalog(term){
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return catalog.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
}

export function catalogSeries(id){
  return catalog.find(s => s.id === id) || null;
}

export function catalogTomes(id){
  const s = catalogSeries(id);
  if (!s) return [];
  return s.tomes.filter(t => t.num > 0).sort((a, b) => a.num - b.num);
}
