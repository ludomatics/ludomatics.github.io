// Renders a catalog of interactive exams from exams/index.json.
// Used by /bachillerato/ and /universidad/, which set data-category on #examList to show only their exams.
import { loadAttempt } from './storage.js';

const container = document.getElementById('examList');
const onlyCategory = (container.dataset.category || '').trim();

// Paths are resolved from this script, so the same code works from any catalog folder.
const engine = new URL('../', import.meta.url);

function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const same = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }) === 0;

// What this browser has saved for the exam: nothing, in progress, or graded.
function statusOf(e) {
    const attempt = e.questionCount ? loadAttempt(e.id, e.questionCount) : null;
    if (!attempt) return null;
    const who = attempt.name ? ' · ' + esc(attempt.name) : '';
    if (attempt.finishedAt) {
        const score = typeof attempt.score === 'number' ? ': ' + attempt.score + ' / ' + e.questionCount + ' aciertos' : '';
        return { kind: 'done', label: 'Calificado' + score + who, action: 'Ver resultados' };
    }
    const answered = attempt.answers.filter(a => a !== null).length;
    if (!answered && !attempt.startedAt) return null;
    return { kind: 'progress', label: 'En progreso: ' + answered + ' / ' + e.questionCount + ' respondidas' + who, action: 'Continuar' };
}

function card(e) {
    const status = statusOf(e);
    // Each catalog folder has its own examen.html, so links stay under /universidad/ or /bachillerato/.
    const href = 'examen.html?id=' + encodeURIComponent(e.id);
    return '<article class="exam-card">' +
        '<h3>' + esc(e.title) + '</h3>' +
        (e.description ? '<p>' + esc(e.description) + '</p>' : '') +
        (e.questionCount ? '<p class="stats">' + e.questionCount + ' preguntas' + (e.protected ? ' · 🔒 Con contraseña' : '') + '</p>' : '') +
        (status ? '<p class="status ' + status.kind + '">' + status.label + '</p>' : '') +
        '<a class="btn primary" href="' + href + '">' + (status ? status.action : 'Comenzar examen') + '</a>' +
        '</article>';
}

fetch(new URL('exams/index.json', engine), { cache: 'no-cache' })
    .then(r => {
        if (!r.ok) throw new Error('index.json ' + r.status);
        return r.json();
    })
    .then(({ exams = [] }) => {
        // "hidden": true keeps an exam out of the catalogs; it still opens with its direct link.
        const visible = exams.filter(e => !e.hidden);
        const list = onlyCategory ? visible.filter(e => same(e.category || '', onlyCategory)) : visible;
        if (!list.length) {
            container.innerHTML = '<p class="muted">Todavía no hay exámenes interactivos' +
                (onlyCategory ? ' de ' + esc(onlyCategory.toLowerCase()) : '') + '.</p>';
            return;
        }
        if (onlyCategory) {
            container.innerHTML = '<div class="exam-grid">' + list.map(card).join('') + '</div>';
            return;
        }
        // Full list: group by category, keeping the order they appear in index.json.
        const groups = new Map();
        list.forEach(e => {
            const cat = e.category || 'Exámenes';
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat).push(e);
        });
        container.innerHTML = [...groups].map(([category, items]) =>
            '<section class="category"><h2>' + esc(category) + '</h2><div class="exam-grid">' +
            items.map(card).join('') + '</div></section>').join('');
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = '<p class="error">No se pudo cargar la lista de exámenes. Recarga la página para intentar de nuevo.</p>';
    });

// Coming back with the browser's back button can show a cached page: refresh the statuses.
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
