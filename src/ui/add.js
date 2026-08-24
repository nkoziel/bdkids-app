import { $, esc, closeModal, toast } from '../core/dom.js';
import { addSeries, findExistingSeries } from '../core/state.js';
import { searchCatalog, catalogTomes } from '../data/catalog.js';
import { libraryChanged } from './refresh.js';
import { openSheet } from './sheet.js';
import { openLayer, closeLayer } from './layers.js';

export function openAdd(){
  const host = $("modalHost");
  host.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <button class="close" aria-label="Fermer">&times;</button>
        <h2>Nouvelle serie</h2>
        <label class="field">
          Chercher dans le catalogue
          <input type="text" id="catalogSearch" placeholder="Ariol, Brume..." autofocus />
        </label>
        <div id="catalogResults"></div>
        <details id="manualDetails">
          <summary>Ajouter manuellement (serie absente du catalogue)</summary>
          <label class="field">
            Titre
            <input type="text" id="addTitle" />
          </label>
          <label class="field">
            Auteur (optionnel)
            <input type="text" id="addAuthor" />
          </label>
          <label class="field">
            Editeur (optionnel)
            <input type="text" id="addPublisher" />
          </label>
          <label class="field">
            Nombre de tomes publies (si connu)
            <input type="number" min="0" id="addTotal" placeholder="?" />
          </label>
          <div class="sheet-actions">
            <button class="btn primary" id="addConfirm">Ajouter</button>
          </div>
        </details>
      </div>
    </div>`;

  const dismiss = () => { if (!closeLayer()) closeModal(); };
  host.querySelector(".close").addEventListener("click", dismiss);
  host.querySelector(".modal-backdrop").addEventListener("click", e => { if (e.target.classList.contains("modal-backdrop")) dismiss(); });

  const confirmAdd = (payload) => {
    const existing = findExistingSeries(payload);
    if (existing) {
      toast(`"${existing.title}" est deja dans ta bibliotheque.`);
      openSheet(existing.id);
      return;
    }
    addSeries(payload);
    closeModal();
    libraryChanged();
    toast(`"${payload.title}" ajoute.`);
  };

  $("catalogSearch").addEventListener("input", e => {
    const results = searchCatalog(e.target.value);
    $("catalogResults").innerHTML = results.map(s => `
      <button class="card catalog-hit" data-id="${esc(s.id)}">
        <div class="cover" style="${s.cover ? `background-image:url('${esc(s.cover)}')` : ""}">
          ${s.cover ? "" : `<span class="cover-fallback">${esc(s.name.slice(0, 2).toUpperCase())}</span>`}
        </div>
        <div class="card-body">
          <div class="card-title">${esc(s.name)}</div>
          <div class="card-meta">${s.total ? `${s.total} tomes` : "?"}</div>
        </div>
      </button>`).join("");

    $("catalogResults").querySelectorAll(".catalog-hit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const hit = results.find(r => r.id === id);
        confirmAdd({
          title: hit.name,
          publisher: "",
          total: hit.total || null,
          cover: hit.cover || "",
          catalogId: hit.id,
          tomes: catalogTomes(hit.id),
        });
      });
    });
  });

  $("addConfirm").addEventListener("click", () => {
    const title = $("addTitle").value.trim();
    if (!title) { toast("Le titre est obligatoire."); return; }
    const total = parseInt($("addTotal").value, 10);
    confirmAdd({
      title,
      author: $("addAuthor").value.trim(),
      publisher: $("addPublisher").value.trim(),
      total: Number.isFinite(total) && total > 0 ? total : null,
    });
  });

  /* Last, so a throw while rendering/wiring above cannot leave a history entry with nothing
     behind it to pop — see layers.js. */
  openLayer(closeModal);
}
