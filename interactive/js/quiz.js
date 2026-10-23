// Interactive exam: one question at a time, autosave, question map, results and review.
import { fetchExam, grade, ExamError } from './exam.js';
import { loadAttempt, saveAttempt, clearAttempt } from './storage.js';

const app = document.getElementById('app');
let exam = null;
let state = null;
let storageOk = true;
let nameError = '';

// ---------------- boot ----------------
const examId = new URLSearchParams(location.search).get('id');
fetchExam(examId)
    .then(loaded => {
        exam = loaded;
        document.title = exam.title + ' · Ludomatics';
        state = Object.assign(freshState(), loadAttempt(exam.id, exam.questions.length) || {}, { showMap: false, confirming: false });
        render();
    })
    .catch(err => {
        const message = err instanceof ExamError ? err.message : 'Ocurrió un error al abrir el examen.';
        if (!(err instanceof ExamError)) console.error(err);
        app.innerHTML =
            '<section class="panel">' +
            '<h1 class="page-title">Examen no disponible</h1>' +
            '<p class="pre">' + esc(message) + '</p>' +
            '<div class="btn-row"><a class="btn primary" href="./">Ver exámenes</a></div>' +
            '</section>';
    });

// ---------------- state ----------------
function freshState() {
    return {
        view: 'start', // start | quiz | results | review
        name: '',
        answers: exam ? Array(exam.questions.length).fill(null) : [],
        current: 0,
        showMap: false,
        confirming: false,
        startedAt: null,
        finishedAt: null
    };
}

function persist() {
    const { showMap, confirming, ...saved } = state;
    storageOk = saveAttempt(exam.id, saved);
}

function set(patch, opts) {
    Object.assign(state, patch);
    persist();
    render(opts);
}

const answeredCount = () => state.answers.filter(a => a !== null).length;
const missingQuestions = () => state.answers.reduce((list, a, i) => (a === null ? list.concat(i) : list), []);
const sectionOf = i => exam.sections[exam.questions[i].sectionIndex];

function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------------- render ----------------
function render(opts = {}) {
    let html = topbar();
    if (state.view === 'start') html += startView();
    else if (state.view === 'quiz' || state.view === 'review') html += quizView();
    else html += resultsView();
    app.innerHTML = html;

    const overlayOpen = (state.showMap || state.confirming) && (state.view === 'quiz' || state.view === 'review');
    document.body.style.overflow = overlayOpen ? 'hidden' : '';

    typeset(app);
    if (opts.scrollTop) window.scrollTo({ top: 0 });
    if (opts.focus) {
        const el = app.querySelector(opts.focus);
        if (el) el.focus({ preventScroll: true });
    }
}

function topbar() {
    return '<header class="topbar">' +
        '<a class="back-link" href="./">← Exámenes</a>' +
        '<p class="exam-title">' + esc(exam.title) + '</p>' +
        (storageOk ? '' : '<p class="save-warning">Tu progreso no se guardará si recargas la página.</p>') +
        '</header>';
}

function startView() {
    const sections = exam.sections.map(s =>
        '<li><span>' + esc(s.title) + '</span><span class="count">' + s.count + '</span></li>').join('');
    let actions;
    if (state.finishedAt) {
        actions = '<p class="resume-note">Este examen ya fue calificado en este navegador.</p>' +
            '<div class="btn-row"><button class="btn primary" data-act="show-results">Ver resultados</button>' +
            '<button class="btn" data-act="restart">Nuevo intento</button></div>';
    } else if (answeredCount() > 0) {
        actions = '<p class="resume-note">Hay un intento guardado: <strong>' + answeredCount() + ' de ' + exam.questions.length + '</strong> preguntas respondidas.</p>' +
            '<div class="btn-row"><button class="btn primary" data-act="begin">Continuar</button>' +
            '<button class="btn" data-act="restart">Empezar de nuevo</button></div>';
    } else {
        actions = '<div class="btn-row"><button class="btn primary" data-act="begin">Comenzar examen</button></div>';
    }
    return '<section class="panel">' +
        '<h1 class="page-title">' + esc(exam.title) + '</h1>' +
        '<p class="muted">' + exam.questions.length + ' preguntas de opción múltiple · ' + exam.sections.length + ' secciones</p>' +
        '<ul class="section-list">' + sections + '</ul>' +
        '<div class="field"><label for="studentName">Tu nombre</label>' +
        '<input id="studentName" type="text" autocomplete="off" placeholder="Ingresa tu nombre" value="' + esc(state.name) + '">' +
        (nameError ? '<p class="error">' + esc(nameError) + '</p>' : '') + '</div>' +
        actions +
        '</section>';
}

function ticks() {
    return state.answers.map((a, i) => {
        const gap = i > 0 && exam.questions[i].sectionIndex !== exam.questions[i - 1].sectionIndex ? '<span class="tick gap"></span>' : '';
        const cls = i === state.current ? ' current' : (a !== null ? ' answered' : '');
        return gap + '<span class="tick' + cls + '"></span>';
    }).join('');
}

function quizView() {
    const i = state.current;
    const q = exam.questions[i];
    const review = state.view === 'review';
    const chosen = state.answers[i];
    const total = exam.questions.length;

    const progress = '<div class="progress">' +
        '<div class="progress-meta"><span>Pregunta ' + q.number + ' de ' + total + '</span>' +
        '<span>' + (review ? 'Revisión' : answeredCount() + ' respondidas') + '</span></div>' +
        '<div class="ticks" aria-hidden="true">' + ticks() + '</div></div>';

    const reviewBar = review
        ? '<div class="review-bar"><button class="btn" data-act="show-results">← Volver a resultados</button>' +
          '<p class="muted small">Modo revisión: solo lectura</p></div>'
        : '';

    const options = exam.letters.map((L, k) => {
        let cls = 'opt';
        if (review) {
            if (L === q.answer) cls += ' is-correct';
            else if (L === chosen) cls += ' is-wrong';
        }
        return '<li><button class="' + cls + '" role="radio" aria-checked="' + (chosen === L) + '" data-opt="' + L + '"' +
            (review ? ' disabled' : '') + '><span class="bubble">' + L + '</span><span class="opt-text">' + q.options[k] + '</span></button></li>';
    }).join('');

    let verdict = '';
    if (review) {
        verdict = chosen === q.answer
            ? '<p class="verdict ok">Correcta</p>'
            : '<p class="verdict bad">' + (chosen ? 'Respondiste ' + chosen + '. ' : 'Sin respuesta. ') + 'La respuesta correcta es ' + q.answer + '.</p>';
    }

    const figure = q.image
        ? '<figure class="figure"><img src="' + esc(q.image) + '" alt="Figura de la pregunta ' + q.number + '"></figure>'
        : '';

    const card = '<article class="qcard">' +
        '<div class="qhead"><span class="qnum">' + q.number + '.</span><span class="chip">' + esc(sectionOf(i).title) + '</span></div>' +
        '<div class="qtext" id="qtext">' + q.text + '</div>' + figure +
        '<ul class="options" role="radiogroup" aria-labelledby="qtext">' + options + '</ul>' + verdict +
        '</article>';

    const isLast = i === total - 1;
    let next;
    if (!isLast) next = '<button class="btn primary" data-act="next">Siguiente →</button>';
    else if (review) next = '<button class="btn primary" data-act="show-results">Resultados</button>';
    else next = '<button class="btn primary" data-act="finish">Terminar</button>';

    const nav = '<nav class="navbar">' +
        '<div><button class="btn" data-act="prev"' + (i === 0 ? ' disabled' : '') + '>← Anterior</button></div>' +
        '<button class="btn ghost" data-act="map" aria-haspopup="dialog">Mapa</button>' +
        '<div>' + next + '</div></nav>';

    const map = state.showMap ? '<div class="overlay" data-overlay>' + mapPanel(review, true) + '</div>' : '';
    const confirm = state.confirming ? confirmDialog() : '';

    return progress + reviewBar + card + nav + map + confirm;
}

function mapPanel(review, inOverlay) {
    const results = review ? grade(exam, state.answers).results : null;
    const groups = exam.sections.map(s => {
        let cells = '';
        for (let i = s.start; i <= s.end; i++) {
            let cls = 'cell';
            if (review) cls += results[i] ? ' ok' : ' bad';
            else if (state.answers[i] !== null) cls += ' answered';
            if (inOverlay && i === state.current) cls += ' current';
            cells += '<button class="' + cls + '" data-go="' + i + '" aria-label="Pregunta ' + (i + 1) + '">' + (i + 1) + '</button>';
        }
        return '<div><h3>' + esc(s.title) + '</h3><div class="cells">' + cells + '</div></div>';
    }).join('');
    const legend = review
        ? '<div class="legend"><span><i class="sw ok"></i>Correcta</span><span><i class="sw bad"></i>Incorrecta</span></div>'
        : '<div class="legend"><span><i class="sw answered"></i>Respondida</span><span><i class="sw"></i>Sin responder</span></div>';

    if (!inOverlay) return '<section class="qmap" aria-label="Mapa de preguntas">' + legend + groups + '</section>';
    return '<section class="qmap dialog" role="dialog" aria-modal="true" aria-labelledby="mapTitle">' +
        '<div class="dialog-head"><h2 id="mapTitle">Mapa de preguntas</h2>' +
        '<button class="btn ghost close-btn" data-act="close-map" aria-label="Cerrar mapa">×</button></div>' +
        legend + groups + '</section>';
}

function confirmDialog() {
    const missing = missingQuestions();
    const total = exam.questions.length;
    let title, body, actions;
    if (missing.length) {
        const cells = '<div class="cells">' + missing.map(i =>
            '<button class="cell" data-go="' + i + '" aria-label="Ir a la pregunta ' + (i + 1) + '">' + (i + 1) + '</button>').join('') + '</div>';
        title = 'Faltan preguntas por responder';
        body = '<p>Para calificar necesitas responder todas las preguntas. Te faltan <strong>' + missing.length + '</strong> de ' + total + ':</p>' +
            cells + '<p class="muted small">Toca un número para ir a esa pregunta.</p>';
        actions = '<button class="btn primary" data-go="' + missing[0] + '">Ir a la pregunta ' + (missing[0] + 1) + '</button>' +
            '<button class="btn" data-act="cancel-finish">Cerrar</button>';
    } else {
        title = '¿Listo para calificar?';
        body = '<p>Respondiste las ' + total + ' preguntas. Al calificar ya no podrás cambiar tus respuestas.</p>';
        actions = '<button class="btn primary" data-act="grade">Terminar y calificar</button>' +
            '<button class="btn" data-act="cancel-finish">Seguir respondiendo</button>';
    }
    return '<div class="overlay" data-overlay><section class="panel dialog" id="confirmDialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle" tabindex="-1">' +
        '<div class="dialog-head"><h2 id="confirmTitle">' + title + '</h2>' +
        '<button class="btn ghost close-btn" data-act="cancel-finish" aria-label="Cerrar">×</button></div>' +
        body + '<div class="btn-row">' + actions + '</div></section></div>';
}

function resultsView() {
    const { correctCount, bySection } = grade(exam, state.answers);
    const total = exam.questions.length;
    const pct = Math.round((correctCount / total) * 100);
    const rows = bySection.map(s => {
        const p = s.total ? Math.round((s.correct / s.total) * 100) : 0;
        return '<tr><td>' + esc(s.title) + '</td><td class="num">' + s.correct + ' / ' + s.total + '</td>' +
            '<td class="bar-cell"><div class="bar"><span style="width:' + p + '%"></span></div></td><td class="num">' + p + '%</td></tr>';
    }).join('');
    const heading = state.name ? esc(state.name) + ', este es tu resultado' : 'Tu resultado';
    return '<section class="panel">' +
        '<h1 class="page-title">' + heading + '</h1>' +
        '<div class="score-wrap"><span class="score">' + correctCount + '<small> / ' + total + '</small></span>' +
        '<span class="pct">' + pct + '% de aciertos</span></div>' +
        '<div class="table-wrap"><table class="breakdown"><thead><tr><th>Sección</th><th>Aciertos</th><th></th><th>%</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
        '<div class="btn-row"><button class="btn primary" data-act="review">Revisar respuestas</button>' +
        '<button class="btn" data-act="restart">Nuevo intento</button></div>' +
        '</section>' + mapPanel(true, false);
}

// ---------------- math ----------------
function typeset(el) {
    const mj = window.MathJax;
    if (!mj || !mj.typesetPromise) return;
    mj.startup.promise.then(() => mj.typesetPromise([el])).catch(() => {});
}
window.addEventListener('load', () => { if (exam) typeset(app); });

// ---------------- actions ----------------
function go(i) {
    if (i < 0 || i >= exam.questions.length) return;
    set({ current: i, showMap: false, confirming: false }, { scrollTop: true });
}

function choose(letter) {
    if (state.view !== 'quiz') return;
    const answers = state.answers.slice();
    answers[state.current] = letter;
    set({ answers }, { focus: '[data-opt="' + letter + '"]' });
}

function begin() {
    const input = document.getElementById('studentName');
    const name = input ? input.value.trim() : state.name;
    if (!name) {
        nameError = 'Escribe tu nombre para comenzar.';
        render({ focus: '#studentName' });
        return;
    }
    nameError = '';
    set({ name, view: 'quiz', startedAt: state.startedAt || Date.now() }, { scrollTop: true });
}

function closeMap() { set({ showMap: false }, { focus: '[data-act="map"]' }); }
function closeConfirm() { set({ confirming: false }, { focus: '[data-act="finish"]' }); }
function closeOverlays() { if (state.confirming) closeConfirm(); else closeMap(); }

app.addEventListener('click', e => {
    if (!exam) return;
    if (e.target.matches('[data-overlay]')) { closeOverlays(); return; }

    const opt = e.target.closest('[data-opt]');
    if (opt && !opt.disabled) { choose(opt.dataset.opt); return; }

    const cell = e.target.closest('[data-go]');
    if (cell) {
        const i = +cell.dataset.go;
        if (state.view === 'results') set({ view: 'review', current: i }, { scrollTop: true });
        else go(i);
        return;
    }

    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    switch (btn.dataset.act) {
        case 'begin': begin(); break;
        case 'restart':
            // Shared devices: a new attempt is a new person, so the name is cleared too.
            clearAttempt(exam.id);
            state = freshState();
            nameError = '';
            persist();
            render({ focus: '#studentName', scrollTop: true });
            break;
        case 'prev': go(state.current - 1); break;
        case 'next': go(state.current + 1); break;
        case 'map': set({ showMap: true }, { focus: '[data-act="close-map"]' }); break;
        case 'close-map': closeMap(); break;
        case 'finish': set({ confirming: true, showMap: false }, { focus: '#confirmDialog' }); break;
        case 'cancel-finish': closeConfirm(); break;
        case 'grade':
            if (missingQuestions().length) { set({ confirming: true }); break; }
            set({ view: 'results', confirming: false, finishedAt: Date.now() }, { scrollTop: true });
            break;
        case 'show-results': set({ view: 'results', showMap: false }, { scrollTop: true }); break;
        case 'review': set({ view: 'review', current: 0, showMap: false }, { scrollTop: true }); break;
    }
});

app.addEventListener('keydown', e => {
    if (e.target.id === 'studentName' && e.key === 'Enter') begin();
});

// Keyboard shortcuts (not advertised): A–D or 1–4 to answer, arrows to move, Esc closes overlays.
document.addEventListener('keydown', e => {
    if (!exam || (state.view !== 'quiz' && state.view !== 'review')) return;
    if (e.target.matches && e.target.matches('input, textarea')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (state.showMap || state.confirming) {
        if (e.key === 'Escape') closeOverlays();
        return;
    }
    if (e.key === 'ArrowRight') { go(state.current + 1); e.preventDefault(); return; }
    if (e.key === 'ArrowLeft') { go(state.current - 1); e.preventDefault(); return; }
    if (state.view !== 'quiz') return;
    const key = e.key.toUpperCase();
    if (exam.letters.includes(key)) { choose(key); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= exam.letters.length) choose(exam.letters[n - 1]);
});
