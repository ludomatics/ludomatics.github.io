// Interactive exam: one question at a time, autosave, question map, results and review.
import { loadExamFile, unlockExam, normalizeExam, grade, ExamError } from './exam.js';
import { MODE, loadAttempt, saveAttempt, clearAttempt } from './storage.js';
import { LEVELS, levelOfCategory, levelLocked, getProfile, goalFor, addToHistory, getPassword, rememberPassword, forgetPassword } from './profile.js';

const app = document.getElementById('app');
let exam = null;
let state = null;
let storageOk = true;
let nameError = '';
let zoom = null; // { src, title } of a reference image shown in an overlay (not saved)
let confirmRestart = false; // second step of "Reiniciar examen" in the finish dialog
let runSince = null; // when the exam clock last started running in this page (it pauses while the page is closed)

// ---------------- boot ----------------
const examId = new URLSearchParams(location.search).get('id');
loadExamFile(examId)
    .then(async loaded => {
        // Personal mode only shows exams of the student's level (guests may open any level).
        const category = loaded.kind === 'plain' ? loaded.raw.category : (loaded.file.meta || {}).category;
        const examLevel = levelOfCategory(category);
        if (MODE === 'personal' && examLevel) {
            const profile = getProfile();
            if (!profile) {
                // Exam link opened before onboarding: set up the profile (level preset), then come back here.
                location.replace('./?nivel=' + examLevel + '&volver=' + encodeURIComponent(examId));
                return;
            }
            if (profile.level !== examLevel) return showWrongLevel(examLevel, profile.level, loaded);
        }
        if (loaded.kind === 'plain') return start(normalizeExam(loaded.raw, examId));
        // Protected exam: reuse the password typed earlier in this tab, otherwise ask for it.
        // Protected exam: personal devices remember the password; guests only for this tab.
        const remembered = getPassword(examId);
        if (remembered) {
            try { return start(await unlockExam(loaded.file, remembered)); }
            catch (e) { forgetPassword(examId); }
        }
        showLock(loaded.file);
    })
    .catch(err => {
        const message = err instanceof ExamError ? err.message : 'Ocurrió un error al abrir el examen.';
        if (!(err instanceof ExamError)) console.error(err);
        app.innerHTML =
            '<section class="panel">' +
            '<h1 class="page-title">Examen no disponible</h1>' +
            '<p class="pre">' + esc(message) + '</p>' +
            '<div class="btn-row"><a class="btn primary" href="../">Ver exámenes</a></div>' +
            '</section>';
    });

function start(loaded) {
    exam = loaded;
    document.title = exam.title + ' · Ludomatics';
    state = Object.assign(freshState(), loadAttempt(exam.id, exam.questions.length) || {}, { showMap: false, confirming: false });
    if (!state.name) state.name = profileName();
    render({ focus: '#studentName' });
}

// The name saved during onboarding (personal or guest), so students don't type it for every exam.
const profileName = () => (getProfile() || {}).name || '';

function showWrongLevel(examLevel, profileLevel, loaded) {
    const title = loaded.kind === 'plain' ? loaded.raw.title : (loaded.file.meta || {}).title;
    document.title = (title || 'Examen') + ' · Ludomatics';
    app.innerHTML =
        '<header class="topbar"><div class="topbar-main"><a class="back-link" href="' + catalogHrefFor() + '">← Exámenes</a>' +
        '<p class="exam-title">' + esc(title || 'Examen') + '</p></div></header>' +
        '<section class="panel"><h1 class="page-title">Este examen es de ' + LEVELS[examLevel].label.toLowerCase() + '</h1>' +
        '<p>Tu perfil es de <strong>' + LEVELS[profileLevel].label.toLowerCase() + '</strong>, así que este examen no está disponible para ti.</p>' +
        '<p class="muted">' + (levelLocked()
            ? 'Si necesitas otro nivel, usa «Empezar de nuevo» en «Editar perfil».'
            : 'Si elegiste el nivel equivocado, puedes cambiarlo en «Editar perfil».') + '</p>' +
        '<div class="btn-row"><a class="btn primary" href="' + catalogHrefFor() + '">Ir a mis exámenes</a></div></section>';
}

// ---------------- password screen ----------------

function showLock(file, error) {
    const meta = file.meta || {};
    document.title = (meta.title || 'Examen') + ' · Ludomatics';
    app.innerHTML =
        '<header class="topbar"><div class="topbar-main"><a class="back-link" href="' + catalogHrefFor() + '">← Exámenes</a>' +
        '<p class="exam-title">' + esc(meta.title || 'Examen') + '</p></div></header>' +
        '<form class="panel" id="lockForm" autocomplete="off">' +
        '<h1 class="page-title">Examen protegido</h1>' +
        '<p class="muted">Escribe la contraseña que te dio tu profesor para abrir el examen.</p>' +
        '<div class="field"><label for="examPassword">Contraseña</label>' +
        '<input id="examPassword" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required>' +
        (error ? '<p class="error" role="alert">' + esc(error) + '</p>' : '') + '</div>' +
        '<div class="btn-row"><button class="btn primary" type="submit" id="unlockBtn">Abrir examen</button></div>' +
        '</form>';
    const form = document.getElementById('lockForm');
    const input = document.getElementById('examPassword');
    input.focus();
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const password = input.value;
        if (!password) return;
        const btn = document.getElementById('unlockBtn');
        btn.disabled = true;
        btn.textContent = 'Abriendo…';
        try {
            const unlocked = await unlockExam(file, password);
            rememberPassword(unlocked.id, password);
            start(unlocked);
        } catch (err) {
            if (!(err instanceof ExamError)) console.error(err);
            showLock(file, err instanceof ExamError ? err.message : 'No se pudo abrir el examen.');
        }
    });
}

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
        finishedAt: null,
        elapsedMs: 0,       // time spent answering; only counts while the exam page is open
        timerHidden: false,
        timeUp: false,
        score: null         // saved at grading so the catalog can show it
    };
}

function persist() {
    foldClock();
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

// ---------------- timer ----------------
const limitMs = () => exam.durationMinutes * 60000;
const elapsedMs = () => state.elapsedMs + (runSince ? Date.now() - runSince : 0);

// Move the running time into state.elapsedMs (called before every save).
function foldClock() {
    if (!runSince) return;
    const now = Date.now();
    state.elapsedMs += now - runSince;
    runSince = now;
}

// The clock runs only while answering (not on the start screen, results or review).
function syncClockToView() {
    if (state.view === 'quiz' && !runSince) runSince = Date.now();
    if (state.view !== 'quiz' && runSince) { foldClock(); runSince = null; }
}

function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sec = total % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function timerHtml() {
    const left = limitMs() - elapsedMs();
    const over = left <= 0;
    if (state.timerHidden) {
        return '<div class="timer"><button class="btn ghost small-btn" data-act="toggle-timer">Mostrar tiempo</button></div>';
    }
    return '<div class="timer' + (over ? ' over' : '') + '" role="timer">' +
        '<span class="timer-label">' + (over ? 'Tiempo agotado' : 'Tiempo restante') + '</span>' +
        '<span class="timer-value" id="timerValue">' + (over ? '+' + formatDuration(-left) : formatDuration(left)) + '</span>' +
        '<button class="btn ghost small-btn" data-act="toggle-timer">Ocultar</button></div>';
}

let tickCount = 0;
setInterval(() => {
    if (!exam || state.view !== 'quiz') return;
    const left = limitMs() - elapsedMs();
    if (left <= 0 && !state.timeUp) {
        // Time is up: show the clock (even if hidden) and keep letting them answer.
        set({ timeUp: true, timerHidden: false });
        return;
    }
    const el = document.getElementById('timerValue');
    if (el) el.textContent = left > 0 ? formatDuration(left) : '+' + formatDuration(-left);
    if (++tickCount % 10 === 0) persist();
}, 1000);

// Save the clock when the page goes away, so closing it pauses the timer at the right second.
addEventListener('pagehide', () => { if (exam) persist(); });
document.addEventListener('visibilitychange', () => { if (exam && document.visibilityState === 'hidden') persist(); });

// ---------------- render ----------------
function render(opts = {}) {
    syncClockToView();
    let html = topbar();
    if (state.view === 'start') html += startView();
    else if (state.view === 'quiz' || state.view === 'review') html += quizView();
    else html += resultsView();
    app.innerHTML = html;

    const overlayOpen = (state.showMap || state.confirming || zoom) && (state.view === 'quiz' || state.view === 'review');
    document.body.style.overflow = overlayOpen ? 'hidden' : '';

    typeset(app);
    if (opts.scrollTop) window.scrollTo({ top: 0 });
    if (opts.focus) {
        const el = app.querySelector(opts.focus);
        if (el) el.focus({ preventScroll: true });
    }
}

function catalogHrefFor() {
    // Back to the student's home: /interactive/ (personal) or /invitado/ (guest).
    // Relative to /interactive/: the guest exam page loads the engine through <base href="../interactive/">.
    return MODE === 'guest' ? '../invitado/' : './';
}
const catalogHref = () => catalogHrefFor();

function topbar() {
    return '<header class="topbar"><div class="topbar-main">' +
        // No way out to the catalog while answering: keeps students focused.
        (state.view === 'start' || state.view === 'results' ? '<a class="back-link" href="' + catalogHref() + '">← Exámenes</a>' : '') +
        '<p class="exam-title">' + esc(exam.title) + '</p>' +
        (storageOk ? '' : '<p class="save-warning">Tu progreso no se guardará si recargas la página.</p>') +
        '</div>' + (state.view === 'quiz' ? timerHtml() : '') +
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
    } else if (answeredCount() > 0 || state.startedAt) {
        const left = limitMs() - state.elapsedMs;
        actions = '<p class="resume-note">Hay un intento guardado: <strong>' + answeredCount() + ' de ' + exam.questions.length + '</strong> preguntas respondidas · ' +
            (left > 0 ? 'quedan <strong>' + formatDuration(left) + '</strong>' : 'tiempo agotado') + '.</p>' +
            '<div class="btn-row"><button class="btn primary" data-act="begin">Continuar</button>' +
            '<button class="btn" data-act="restart">Empezar de nuevo</button></div>';
    } else {
        actions = '<div class="btn-row"><button class="btn primary" data-act="begin">Comenzar examen</button></div>';
    }
    return '<section class="panel">' +
        '<h1 class="page-title">' + esc(exam.title) + '</h1>' +
        '<p class="muted">' + exam.questions.length + ' preguntas de opción múltiple · ' + exam.sections.length + ' secciones · ' + durationText() + '</p>' +
        '<ul class="section-list">' + sections + '</ul>' +
        '<div class="field"><label for="studentName">Tu nombre</label>' +
        '<input id="studentName" type="text" autocomplete="off" placeholder="Ingresa tu nombre" value="' + esc(state.name) + '">' +
        (nameError ? '<p class="error">' + esc(nameError) + '</p>' : '') + '</div>' +
        actions +
        '<p class="muted small">El tiempo empieza a correr al comenzar y se pausa si cierras la página.</p>' +
        '</section>';
}

function durationText() {
    const m = exam.durationMinutes;
    if (m % 60 === 0) return m / 60 + (m === 60 ? ' hora' : ' horas');
    return m + ' minutos';
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

    // Shared reading passage (e.g. one text for questions 74–78), collapsible so it doesn't bury the question.
    const p = q.passage ? exam.passages[q.passage] : null;
    const passage = p
        ? '<details class="passage-box" open><summary>' + esc(p.intro || 'Lectura') + '</summary>' +
          '<div class="passage-body">' + (p.title ? '<h3>' + esc(p.title) + '</h3>' : '') + p.html + '</div></details>'
        : '';

    const card = '<article class="qcard">' +
        '<div class="qhead"><span class="qnum">' + q.number + '.</span><span class="chip">' + esc(sectionOf(i).title) + '</span></div>' +
        passage +
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

    const zoomed = zoom
        ? '<div class="overlay" data-overlay><section class="panel dialog image-dialog" role="dialog" aria-modal="true" aria-labelledby="zoomTitle">' +
          '<div class="dialog-head"><h2 id="zoomTitle">' + esc(zoom.title) + '</h2>' +
          '<button class="btn ghost close-btn" data-act="close-zoom" aria-label="Cerrar">×</button></div>' +
          '<div class="image-scroll"><img src="' + esc(zoom.src) + '" alt="' + esc(zoom.title) + '"></div></section></div>'
        : '';

    return progress + reviewBar + card + nav + map + confirm + zoomed;
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
    let title, body, actions, foot = '';
    if (confirmRestart) {
        // Second confirmation: say exactly what will be lost.
        const answered = answeredCount();
        title = '¿Reiniciar el examen?';
        body = '<p>Se borrarán tus <strong>' + answered + ' ' + (answered === 1 ? 'respuesta' : 'respuestas') + '</strong> y el tiempo transcurrido. ' +
            'Esta acción no se puede deshacer.</p>';
        actions = '<button class="btn danger" data-act="confirm-restart">Sí, borrar y reiniciar</button>' +
            '<button class="btn" data-act="cancel-restart">No, volver</button>';
    } else if (missing.length) {
        const cells = '<div class="cells cells-scroll">' + missing.map(i =>
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
    if (!confirmRestart) {
        foot = '<div class="dialog-foot"><button class="btn danger-ghost small-btn" data-act="ask-restart">Reiniciar examen</button></div>';
    }
    return '<div class="overlay" data-overlay><section class="panel dialog" id="confirmDialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle" tabindex="-1">' +
        '<div class="dialog-head"><h2 id="confirmTitle">' + title + '</h2>' +
        '<button class="btn ghost close-btn" data-act="cancel-finish" aria-label="Cerrar">×</button></div>' +
        body + '<div class="btn-row">' + actions + '</div>' + foot + '</section></div>';
}

function goalLine(correct, total) {
    const g = goalText(correct, total);
    if (!g) return '';
    return '<p class="goal-result ' + (g.hit ? 'hit' : 'miss') + '">' + (g.hit
        ? '✓ Alcanzaste tu meta de ' + g.goal + ' aciertos.'
        : 'Tu meta: ' + g.goal + ' aciertos. Te faltaron ' + g.missing + '.') + '</p>';
}

function resultsView() {
    const { correctCount, bySection } = grade(exam, state.answers);
    // Keep the saved score in line with the current answer key (e.g. after a corrected answer is published),
    // so the catalog's "Calificado" label matches this page.
    if (state.finishedAt && state.score !== correctCount) { state.score = correctCount; persist(); }
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
        goalLine(correctCount, total) +
        '<p class="muted">Tiempo utilizado: ' + formatDuration(state.elapsedMs) +
        (state.elapsedMs > limitMs() ? ' (' + formatDuration(state.elapsedMs - limitMs()) + ' después del límite)' : '') + '</p>' +
        '<div class="table-wrap"><table class="breakdown"><thead><tr><th>Sección</th><th>Aciertos</th><th></th><th>%</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
        '<div class="btn-row"><button class="btn primary" data-act="review">Revisar respuestas</button>' +
        '<button class="btn" data-act="download-card" id="cardBtn">Descargar resultado</button>' +
        '<button class="btn" data-act="restart">Nuevo intento</button></div>' +
        '<p class="muted small" id="cardNote" aria-live="polite"></p>' +
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
    zoom = null;
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

// One history record per graded attempt (personal mode only): the data behind the progress dashboard.
function recordHistory(result, finishedAt) {
    addToHistory({
        examId: exam.id,
        examTitle: exam.title,
        category: exam.category,
        finishedAt,
        correct: result.correctCount,
        total: exam.questions.length,
        elapsedMs: state.elapsedMs,
        goal: goalFor(exam.questions.length),
        answers: state.answers.map(a => a || '-').join(''),
        sections: exam.sections.map((s, i) => ({ title: s.title, subject: s.subject || null, correct: result.bySection[i].correct, total: s.count }))
    });
}

// "Meta: 96 · ✓ Alcanzada" / "te faltaron 9" for this exam's length; empty without a goal.
function goalText(correct, total) {
    const goal = goalFor(total);
    if (goal === null) return null;
    return { goal, hit: correct >= goal, missing: Math.max(0, goal - correct) };
}

// Results image: drawn in the browser, shared (phones) or downloaded (computers).
async function downloadCard(btn) {
    const note = document.getElementById('cardNote');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generando imagen…';
    try {
        const { drawScoreCard, saveScoreCard } = await import('./scorecard.js');
        const { correctCount, bySection } = grade(exam, state.answers);
        const over = state.elapsedMs - limitMs();
        const canvas = drawScoreCard({
            examTitle: exam.title,
            name: state.name,
            correct: correctCount,
            total: exam.questions.length,
            bySection,
            elapsed: formatDuration(state.elapsedMs),
            overtime: over > 0 ? formatDuration(over) : '',
            goal: goalText(correctCount, exam.questions.length),
            date: new Date(state.finishedAt || Date.now()).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        const slug = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const filename = ['resultado', exam.id, slug(state.name)].filter(Boolean).join('-') + '.png';
        const outcome = await saveScoreCard(canvas, filename, 'Resultado · ' + exam.title);
        if (note) note.textContent = outcome === 'downloaded' ? 'Se descargó la imagen ' + filename + '.' : outcome === 'shared' ? 'Imagen lista para compartir.' : '';
    } catch (err) {
        console.error(err);
        if (note) note.textContent = 'No se pudo crear la imagen. Intenta de nuevo.';
    } finally {
        btn.disabled = false;
        btn.textContent = label;
    }
}

function closeMap() { set({ showMap: false }, { focus: '[data-act="map"]' }); }
function closeConfirm() { confirmRestart = false; set({ confirming: false }, { focus: '[data-act="finish"]' }); }
function closeZoom() { zoom = null; render(); }
function closeOverlays() { if (zoom) closeZoom(); else if (state.confirming) closeConfirm(); else closeMap(); }

app.addEventListener('click', e => {
    if (!exam) return;
    if (e.target.matches('[data-overlay]')) { closeOverlays(); return; }

    // Links to reference images (e.g. the periodic table) open in an overlay so the exam stays on screen.
    const ref = e.target.closest('.qtext a[href], .passage-body a[href]');
    if (ref && /^data:image\/|\.(png|jpe?g|gif|svg|webp)$/i.test(ref.getAttribute('href'))) {
        e.preventDefault();
        zoom = { src: ref.getAttribute('href'), title: ref.dataset.title || ref.textContent.replace(/^Ver\s+/i, '') };
        render({ focus: '[data-act="close-zoom"]' });
        return;
    }

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
            // New attempt by the same student: start from the profile's name (or empty without a profile).
            clearAttempt(exam.id);
            runSince = null;
            state = Object.assign(freshState(), { name: profileName() });
            nameError = '';
            persist();
            render({ focus: '#studentName', scrollTop: true });
            break;
        case 'prev': go(state.current - 1); break;
        case 'next': go(state.current + 1); break;
        case 'map': set({ showMap: true }, { focus: '[data-act="close-map"]' }); break;
        case 'close-map': closeMap(); break;
        case 'close-zoom': closeZoom(); break;
        case 'toggle-timer': set({ timerHidden: !state.timerHidden }, { focus: '[data-act="toggle-timer"]' }); break;
        case 'finish': set({ confirming: true, showMap: false }, { focus: '#confirmDialog' }); break;
        case 'cancel-finish': closeConfirm(); break;
        case 'ask-restart': confirmRestart = true; render({ focus: '#confirmDialog' }); break;
        case 'cancel-restart': confirmRestart = false; render({ focus: '[data-act="ask-restart"]' }); break;
        case 'confirm-restart': {
            // Same student starting over: keep the name, wipe answers and time.
            const name = state.name;
            clearAttempt(exam.id);
            runSince = null;
            confirmRestart = false;
            state = Object.assign(freshState(), { name });
            persist();
            render({ focus: '#studentName', scrollTop: true });
            break;
        }
        case 'grade':
            if (missingQuestions().length) { set({ confirming: true }); break; }
            {
                const finishedAt = Date.now();
                const result = grade(exam, state.answers);
                set({ view: 'results', confirming: false, finishedAt, score: result.correctCount }, { scrollTop: true });
                recordHistory(result, finishedAt);
            }
            break;
        case 'show-results': set({ view: 'results', showMap: false }, { scrollTop: true }); break;
        case 'review': set({ view: 'review', current: 0, showMap: false }, { scrollTop: true }); break;
        case 'download-card': downloadCard(btn); break;
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
    if (state.showMap || state.confirming || zoom) {
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
