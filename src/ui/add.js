import { $, closeModal, toast } from '../core/dom.js';
import { addSeries } from '../core/state.js';
import { libraryChanged } from './refresh.js';

export function openAdd(){
  const host = $("modalHost");
  host.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <button class="close" aria-label="Fermer">&times;</button>
        <h2>Nouvelle serie</h2>
        <label class="field">
          Titre
          <input type="text" id="addTitle" placeholder="Ariol" autofocus />
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
          <button id="addConfirm">Ajouter</button>
        </div>
      </div>
    </div>`;

  host.querySelector(".close").addEventListener("click", closeModal);
  host.querySelector(".modal-backdrop").addEventListener("click", e => { if (e.target.classList.contains("modal-backdrop")) closeModal(); });

  $("addConfirm").addEventListener("click", () => {
    const title = $("addTitle").value.trim();
    if (!title) { toast("Le titre est obligatoire."); return; }
    const total = parseInt($("addTotal").value, 10);
    addSeries({
      title,
      author: $("addAuthor").value.trim(),
      publisher: $("addPublisher").value.trim(),
      total: Number.isFinite(total) && total > 0 ? total : null,
    });
    closeModal();
    libraryChanged();
    toast(`"${title}" ajoute.`);
  });
}
