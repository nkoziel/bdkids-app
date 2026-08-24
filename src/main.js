import './style.css';
import { $ } from './core/dom.js';
import { renderLibrary } from './ui/library.js';
import { openAdd } from './ui/add.js';
import { onLibraryChanged } from './ui/refresh.js';

$("addBtn").addEventListener("click", openAdd);
$("emptyAddBtn").addEventListener("click", openAdd);

onLibraryChanged(renderLibrary);
renderLibrary();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
