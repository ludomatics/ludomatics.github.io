// Renders the list of interactive exams from exams/index.json.
const container = document.getElementById('examList');

function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

fetch('exams/index.json', { cache: 'no-cache' })
    .then(r => {
        if (!r.ok) throw new Error('index.json ' + r.status);
        return r.json();
    })
    .then(({ exams = [] }) => {
        if (!exams.length) {
            container.innerHTML = '<p class="muted">Todavía no hay exámenes interactivos.</p>';
            return;
        }
        // Group by category, keeping the order they appear in index.json.
        const groups = new Map();
        exams.forEach(e => {
            const cat = e.category || 'Exámenes';
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat).push(e);
        });
        container.innerHTML = [...groups].map(([category, list]) =>
            '<section class="category"><h2>' + esc(category) + '</h2><div class="exam-grid">' +
            list.map(e =>
                '<article class="exam-card">' +
                '<h3>' + esc(e.title) + '</h3>' +
                (e.description ? '<p>' + esc(e.description) + '</p>' : '') +
                (e.questionCount ? '<p class="stats">' + e.questionCount + ' preguntas</p>' : '') +
                '<a class="btn primary" href="exam.html?id=' + encodeURIComponent(e.id) + '">Comenzar examen</a>' +
                '</article>').join('') +
            '</div></section>').join('');
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = '<p class="error">No se pudo cargar la lista de exámenes. Recarga la página para intentar de nuevo.</p>';
    });
