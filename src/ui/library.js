import { $, esc } from '../core/dom.js';
import { allSeries } from '../core/state.js';
import { countTomes, missingTomes, gapTomes } from '../core/tomes.js';
import { openSheet } from './sheet.js';

export function renderLibrary(){
  const grid = $("libraryGrid");
  const series = allSeries();

  $("emptyState").style.display = series.length ? "none" : "block";

  grid.innerHTML = series.map(s => {
    const owned = countTomes(s.owned);
    const missing = missingTomes(s.owned, s.total);
    const gaps = gapTomes(s.owned);
    const totalLabel = s.total ? `${owned}/${s.total}` : `${owned} tome${owned > 1 ? "s" : ""}`;
    const badge = s.total && missing.length === 0 && owned > 0
      ? `<span class="badge complete">complete</span>`
      : gaps.length
        ? `<span class="badge gap">${gaps.length} trou${gaps.length > 1 ? "s" : ""}</span>`
        : "";
    return `
      <button class="card" data-id="${esc(s.id)}">
        <div class="cover" style="${s.cover ? `background-image:url('${esc(s.cover)}')` : ""}">
          ${s.cover ? "" : `<span class="cover-fallback">${esc(s.title.slice(0, 2).toUpperCase())}</span>`}
        </div>
        <div class="card-body">
          <div class="card-title">${esc(s.title)}</div>
          <div class="card-meta">${esc(totalLabel)} ${badge}</div>
        </div>
      </button>`;
  }).join("");

  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openSheet(card.dataset.id));
  });
}
