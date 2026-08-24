/* Which printed tomes of a series you actually own.
 *
 * Stored as a RANGE STRING on the series: "1-7,9,12-14".
 *
 * Ported from rayon-app's core/volumes.js (its Phase 3b physical-volume-tracking feature),
 * which is the same problem this whole app exists to solve. Compact, diff-friendly, survives
 * a JSON export unchanged so a collection can be handed to someone else, and readable by hand.
 */

/* "1-7,9,12-14" -> [1,2,3,4,5,6,7,9,12,13,14]. Tolerant of junk: anything unparseable is
   dropped rather than throwing, because this value can come back from an imported file. */
export function parseTomes(str){
  if (!str || typeof str !== "string") return [];
  const out = new Set();
  for (const part of str.split(",")){
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m){
      let a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];              // "7-1" means the same as "1-7"
      if (b - a > 5000) continue;               // refuse an absurd range rather than hang
      for (let i = a; i <= b; i++) out.add(i);
      continue;
    }
    const n = parseInt(p, 10);
    if (Number.isFinite(n) && n > 0) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}

/* [1,2,3,5] -> "1-3,5". Always the shortest form, so the stored value is canonical and two
   equal collections compare equal as strings. */
export function formatTomes(list){
  const nums = [...new Set((list || []).filter(n => Number.isFinite(n) && n > 0))].sort((a,b)=>a-b);
  const parts = [];
  let start = null, prev = null;
  for (const n of nums){
    if (start === null){ start = prev = n; continue; }
    if (n === prev + 1){ prev = n; continue; }
    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = prev = n;
  }
  if (start !== null) parts.push(start === prev ? String(start) : `${start}-${prev}`);
  return parts.join(",");
}

export const ownsTome = (str, n) => parseTomes(str).includes(n);

export function toggleTome(str, n){
  const owned = parseTomes(str);
  const i = owned.indexOf(n);
  if (i === -1) owned.push(n); else owned.splice(i, 1);
  return formatTomes(owned);
}

/* Add a whole run at once — "we own 1 to 12" should be one gesture, not twelve taps. */
export function addRange(str, from, to){
  const owned = parseTomes(str);
  const [a, b] = from <= to ? [from, to] : [to, from];
  for (let i = a; i <= b; i++) owned.push(i);
  return formatTomes(owned);
}

export const countTomes = str => parseTomes(str).length;

/* The tomes between 1 and `total` that are not owned — the shopping list for one series.
   Returns [] when no total is known: we do not guess how many tomes exist. */
export function missingTomes(str, total){
  if (!total || total < 1) return [];
  const owned = new Set(parseTomes(str));
  const out = [];
  for (let i = 1; i <= total; i++) if (!owned.has(i)) out.push(i);
  return out;
}

/* A gap is a tome missing BELOW one already owned — the hole in the middle of the shelf,
   usually the one worth closing first. */
export function gapTomes(str){
  const owned = parseTomes(str);
  if (owned.length < 2) return [];
  const have = new Set(owned);
  const out = [];
  for (let i = owned[0]; i < owned[owned.length - 1]; i++) if (!have.has(i)) out.push(i);
  return out;
}

/* How many cells the tome grid offers.
 *
 * The grid always runs past the last tome owned, even with no known total — a series with an
 * empty collection must still offer something to tap. When a total IS known the grid never
 * stops short of it either: series get re-editioned or renumbered, and a tome owned with no
 * cell is a tome that cannot be un-ticked.
 */
export const GRID_SLACK = 6;    // cells offered beyond the collection when no total is known
export const GRID_MIN = 12;     // ... and never fewer than this, so there is always a target

export function gridSize(total, maxOwned){
  maxOwned = maxOwned > 0 ? maxOwned : 0;
  if (total > 0) return Math.max(total, maxOwned);
  return Math.max(maxOwned + GRID_SLACK, GRID_MIN);
}

/* The highest tome owned, 0 for an empty collection. */
export function lastOwned(str){
  const v = parseTomes(str);
  return v.length ? v[v.length - 1] : 0;
}

/* Complete means: a total is known, and nothing between 1 and it is missing. */
export const isComplete = (str, total) => !!total && missingTomes(str, total).length === 0;
