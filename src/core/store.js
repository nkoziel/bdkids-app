/* Two storage layers.

   localStorage  — the library itself (series + owned tomes). Synchronous, needed at boot,
                   small: a family's BD collection is a few dozen series, not hundreds — this
                   alone should never approach the ~5 MB per-origin quota.
   IndexedDB     — fetched metadata that can grow (descriptions, tome lists, cover images),
                   entirely regenerable from the source, so it is allowed to fail soft.

   Same split rationale as rayon-app (its REVIEW.md §1.2: a growing cache in localStorage can
   silently stop saving once the quota is hit) even though this project is unlikely to hit it
   at this scale — cheap to keep the discipline from the start. */

import { toast } from './dom.js';

let quotaWarned = false;

export const store = {
  get(k){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } },
  set(k, v){
    try{ localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch(e){
      if (!quotaWarned){
        quotaWarned = true;
        toast("Stockage plein — les derniers changements n'ont pas ete sauvegardes.");
      }
      console.error("[bdkids] localStorage write refused for", k, e);
      return false;
    }
  },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

/* ---------- IndexedDB (metadata cache) ---------- */

export const DB_NAME = "bdkids";
export const DB_VER = 1;

let dbp = null;

export function db(){
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("cache")) d.createObjectStore("cache", {keyPath:"k"});
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(new Error("indexeddb indisponible"));
    req.onblocked = () => rej(new Error("indexeddb bloquee par un autre onglet"));
  });
  return dbp;
}

export function forgetDb(){ dbp = null; }

function kv(mode, fn){
  return db().then(d => new Promise((res, rej) => {
    const tx = d.transaction("cache", mode);
    const s = tx.objectStore("cache");
    let out;
    try{ out = fn(s); }catch(e){ rej(e); return; }
    tx.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
    tx.onerror = () => rej(tx.error || new Error("erreur indexeddb"));
  }));
}

export async function kvGet(k){
  try{ const r = await kv("readonly", s => s.get(k)); return r ? r.v : null; }
  catch(e){ return null; }
}

export async function kvSet(k, v){
  try{ await kv("readwrite", s => s.put({k, v})); return true; }
  catch(e){ console.error("[bdkids] IndexedDB cache write failed for", k, e); return false; }
}

export async function kvDel(k){ try{ await kv("readwrite", s => s.delete(k)); }catch(e){} }
