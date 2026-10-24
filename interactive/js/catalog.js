// Exam list (exams/index.json) and the exam cards shown on the home pages.
import { loadAttempt } from './storage.js';

// Paths resolve from this script, so pages in any folder can use it.
const engine = new URL('../', import.meta.url);

export function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Visible exams only: "hidden": true keeps an exam out of every list (it still opens by direct link).
export async function fetchExamIndex() {
    const r = await fetch(new URL('exams/index.json', engine), { cache: 'no-cache' });
    if (!r.ok) throw new Error('index.json ' + r.status);
    const { exams = [] } = await r.json();
    return exams.filter(e => !e.hidden);
}

export const inCategory = (exams, category) =>
    exams.filter(e => String(e.category || '').toLowerCase() === String(category || '').toLowerCase());

// What this browser has saved for the exam: nothing, in progress, or graded.
export function statusOf(e) {
    const attempt = e.questionCount ? loadAttempt(e.id, e.questionCount) : null;
    if (!attempt) return null;
    if (attempt.finishedAt) {
        const score = typeof attempt.score === 'number' ? ': ' + attempt.score + ' / ' + e.questionCount + ' aciertos' : '';
        return { kind: 'done', label: 'Calificado' + score, action: 'Ver resultados', attempt };
    }
    const answered = attempt.answers.filter(a => a !== null).length;
    if (!answered && !attempt.startedAt) return null;
    return { kind: 'progress', label: 'En progreso: ' + answered + ' / ' + e.questionCount + ' respondidas', action: 'Continuar', attempt, answered };
}

// Exam pages live next to the home page (examen.html), in /interactive/ and in /invitado/.
export const examHref = id => 'examen.html?id=' + encodeURIComponent(id);

export function examCard(e) {
    const status = statusOf(e);
    return '<article class="exam-card">' +
        '<h3>' + esc(e.title) + '</h3>' +
        (e.description ? '<p>' + esc(e.description) + '</p>' : '') +
        (e.questionCount ? '<p class="stats">' + e.questionCount + ' preguntas' + (e.protected ? ' · 🔒 Con contraseña' : '') + '</p>' : '') +
        (status ? '<p class="status ' + status.kind + '">' + status.label + '</p>' : '') +
        '<a class="btn primary" href="' + examHref(e.id) + '">' + (status ? status.action : 'Comenzar examen') + '</a>' +
        '</article>';
}
