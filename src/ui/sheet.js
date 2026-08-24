import { $, esc, closeModal, toast } from '../core/dom.js';
import { LIB, updateSeries, removeSeries } from '../core/state.js';
import { toggleTome, addRange, gridSize, parseTomes } from '../core/tomes.js';
import { libraryChanged } from './refresh.js';

export function openSheet(id){
  const s = LIB[id];
  if (!s) return;
  render(id);
}

function render(id){
  const s = LIB[id];
  const host = $("modalHost");
  const owned = new Set(parseTomes(s.owned));
  const size = gridSize(s.total, owned.size ? Math.max(...owned) : 0);

  const tomeTitle = n => s.tomes && s.tomes.find(t => t.num === n)?.title;
  const cells = Array.from({ length: size }, (_, i) => i + 1).map(n => {
    const label = tomeTitle(n);
    const aria = `Tome ${n}${label ? ` — ${label}` : ""}`;
    return `<button class="tome ${owned.has(n) ? "owned" : ""}" data-n="${n}" aria-label="${esc(aria)}" ${label ? `title="${esc(label)}"` : ""}>${n}</button>`;
  }).join("");

  host.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal sheet">
        <button class="close" aria-label="Fermer">&times;</button>
        <h2>${esc(s.title)}</h2>
        <div class="sheet-meta">
          ${s.author ? `<span>${esc(s.author)}</span>` : ""}
          ${s.publisher ? `<span>${esc(s.publisher)}</span>` : ""}
        </div>
        <label class="field">
          Nombre de tomes publies (si connu)
          <input type="number" min="0" id="totalInput" value="${s.total || ""}" placeholder="?" />
        </label>
        <div class="range-add">
          <input type="number" min="1" id="rangeFrom" placeholder="de" />
          <input type="number" min="1" id="rangeTo" placeholder="a" />
          <button class="btn" id="rangeAddBtn">Ajouter la plage</button>
        </div>
        <div class="tome-grid">${cells}</div>
        <label class="field">
          Notes
          <textarea id="notesInput" rows="2">${esc(s.notes || "")}</textarea>
        </label>
        <div class="sheet-actions">
          <button class="btn danger" id="removeBtn">Supprimer la serie</button>
        </div>
      </div>
    </div>`;

  host.querySelector(".close").addEventListener("click", closeModal);
  host.querySelector(".modal-backdrop").addEventListener("click", e => { if (e.target.classList.contains("modal-backdrop")) closeModal(); });

  host.querySelectorAll(".tome").forEach(btn => {
    btn.addEventListener("click", () => {
      updateSeries(id, { owned: toggleTome(s.owned, Number(btn.dataset.n)) });
      render(id);
      libraryChanged();
    });
  });

  $("totalInput").addEventListener("change", e => {
    const v = parseInt(e.target.value, 10);
    updateSeries(id, { total: Number.isFinite(v) && v > 0 ? v : null });
    render(id);
    libraryChanged();
  });

  $("notesInput").addEventListener("change", e => {
    updateSeries(id, { notes: e.target.value });
  });

  $("rangeAddBtn").addEventListener("click", () => {
    const from = parseInt($("rangeFrom").value, 10);
    const to = parseInt($("rangeTo").value, 10);
    if (!Number.isFinite(from) || !Number.isFinite(to)) { toast("Indique un debut et une fin."); return; }
    updateSeries(id, { owned: addRange(s.owned, from, to) });
    render(id);
    libraryChanged();
  });

  $("removeBtn").addEventListener("click", () => {
    if (!confirm(`Supprimer "${s.title}" de la bibliotheque ?`)) return;
    removeSeries(id);
    closeModal();
    libraryChanged();
  });
}
