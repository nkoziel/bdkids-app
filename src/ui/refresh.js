/* The cycle-breaker: library.js opens a sheet -> the sheet changes ownership -> that must
 * redraw library.js. Importing directly gives library -> sheet -> library, an import cycle
 * (caught by tools/check-refs.js). Same pattern as rayon-app's ui/refresh.js: exactly one
 * named notification, registered once by main.js, called by anything that needs "the library
 * changed, redraw" without importing whatever owns rendering.
 */
let cb = null;
export function onLibraryChanged(fn){ cb = fn; }
export function libraryChanged(){ if (cb) cb(); }
