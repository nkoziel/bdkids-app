import './style.css';
import { $, toast } from './core/dom.js';
import { renderLibrary } from './ui/library.js';
import { openAdd } from './ui/add.js';
import { onLibraryChanged } from './ui/refresh.js';

$("addBtn").addEventListener("click", openAdd);
$("emptyAddBtn").addEventListener("click", openAdd);

onLibraryChanged(renderLibrary);
renderLibrary();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    /* updateViaCache: "none" so the browser's own HTTP cache (GitHub Pages sends
       Cache-Control: max-age=600) never masks a new sw.js — the update check must hit the
       network. Without this, an already-installed app could sit on a stale service worker,
       and therefore a stale cached shell, for up to 10 minutes after every deploy. Same lesson
       as rayon-app's sw.js comment: bump VERSION on every release, or an installed app never
       hears about the fix at all. */
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Nouvelle version disponible — recharge la page.');
          }
        });
      });
    }).catch(() => {});
  });
}
