// Safety net for a page that can't start: a regular script (not a module), so it runs even when the modules don't.
//
// Right after a new version is published, a browser may combine new files with old ones from its cache
// (e.g. a new home.js importing something an old storage.js doesn't have). The modules then fail before
// drawing anything and the page stays on "Cargando…". Instead, this offers a "Recargar" button that
// fetches the site's files fresh and reloads. Saved progress is never touched.
//
// It only reacts while the page is still loading (#app still has [data-loading]) and only to the site's
// own scripts: an outside script failing (e.g. MathJax from the CDN) is ignored.
(function () {
    var base = (document.currentScript && document.currentScript.src || '').replace(/boot-guard\.js.*$/, '');
    // Every module of the engine, refreshed in the browser cache before reloading.
    var FILES = ['home', 'quiz', 'exam', 'catalog', 'storage', 'profile', 'stats', 'dashboard',
        'goal-ui', 'backup', 'scorecard'];

    function stillLoading() { return !!document.querySelector('#app [data-loading]'); }

    function ours(e) {
        var t = e.target;
        // A module (or one it imports) could not be downloaded: reported on the <script type="module">.
        if (t && t.tagName === 'SCRIPT') return t.type === 'module';
        // A module downloaded but failed to start (e.g. a missing export): reported with its URL.
        return !!(e.filename && base && e.filename.indexOf(base) === 0);
    }

    function showRecovery() {
        if (!stillLoading() || document.getElementById('bootError')) return;
        var offline = navigator.onLine === false;
        document.getElementById('app').innerHTML =
            '<section class="panel" id="bootError" role="alert">' +
            '<h1 class="page-title">' + (offline ? 'No hay conexión' : 'Hay una versión nueva de Ludomatics') + '</h1>' +
            '<p>' + (offline
                ? 'Revisa tu conexión a internet y vuelve a intentarlo.'
                : 'Tu navegador mezcló archivos de la versión anterior. Recarga para usar la nueva.') +
            ' Tu progreso está guardado.</p>' +
            '<div class="btn-row"><button class="btn primary" type="button" id="bootReload">Recargar</button></div></section>';
        document.getElementById('bootReload').addEventListener('click', function () {
            this.disabled = true;
            this.textContent = 'Recargando…';
            var fresh = FILES.map(function (f) {
                return fetch(base + f + '.js', { cache: 'reload' }).catch(function () {});
            });
            Promise.all(fresh).then(function () { location.reload(); });
        });
    }

    // Capture phase: a <script> that fails to download doesn't bubble its error, but it can be caught here.
    window.addEventListener('error', function (e) {
        if (ours(e)) setTimeout(showRecovery, 0);
    }, true);
})();
