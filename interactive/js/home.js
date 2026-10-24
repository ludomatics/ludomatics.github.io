// Student home: onboarding (level, name, goal), then three sections: pending exams, history and progress.
// The same page runs guest mode (/invitado/): nothing outlives the tab, no goal step, and only the exam list.
import { MODE, clearAll } from './storage.js';
import { LEVELS, getProfile, saveProfile, updateProfile, getHistory, levelLocked, startOver, LEVEL_LOCK_ANSWERS } from './profile.js';
import { esc, fetchExamIndex, inCategory, statusOf, examCard, examHref } from './catalog.js';
import { goalFields, bindGoalSync, readGoal } from './goal-ui.js';
import { progressSection, historySection, chartOnly, goalDialog } from './dashboard.js';

const app = document.getElementById('app');
const GUEST = MODE === 'guest';
let exams = [];
let confirmStartOver = false; // second step of "Empezar de nuevo"
let draft = null;           // onboarding answers so far: { step, level, name, goal }
let editingGoal = false;    // goal overlay from "Tu progreso"
let historyAll = false;     // "Ver todo" in Historial

// A link like /interactive/?nivel=universidad (what /universidad/ redirects to) presets the level.
const params = new URLSearchParams(location.search);
const presetLevel = LEVELS[params.get('nivel')] ? params.get('nivel') : null;
// ?volver=<exam-id>: an exam link opened before onboarding; go back to it once the profile exists.
const returnTo = /^[a-z0-9-]+$/.test(params.get('volver') || '') ? params.get('volver') : null;
let editing = false;        // profile editor overlay
if (params.has('nivel') || params.has('volver')) history.replaceState(null, '', location.pathname);

fetchExamIndex()
    .then(list => { exams = list; render(); })
    .catch(err => {
        console.error(err);
        app.innerHTML = '<p class="error">No se pudo cargar la lista de exámenes. Recarga la página para intentar de nuevo.</p>';
    });

// Coming back with the back button can show a cached page: refresh statuses.
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

// Redraw the progress chart at the new width when the screen rotates or the window is resized.
let resizeTimer;
addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const card = document.getElementById('chartCard'), p = getProfile();
        if (card && p) card.outerHTML = chartOnly(getHistory(), p, app.clientWidth);
    }, 150);
});

function render(focus) {
    const profile = getProfile();
    if (!profile || draft) {
        if (!draft) draft = { step: presetLevel ? 2 : 1, level: presetLevel, name: '', goal: null };
        app.innerHTML = onboardingView();
    } else {
        app.innerHTML = homeView(profile) + (editing ? editDialog(profile) : editingGoal ? goalDialog(profile) : '');
    }
    document.body.style.overflow = editing || editingGoal ? 'hidden' : '';
    const el = focus && app.querySelector(focus);
    if (el) el.focus();
}

// ---------------- onboarding ----------------
const totalSteps = () => (GUEST ? 2 : 3);

function stepHeader(title, subtitle) {
    return '<p class="eyebrow">' + (GUEST ? 'Modo invitado · ' : '') + 'Paso ' + draft.step + ' de ' + totalSteps() + '</p>' +
        '<div class="steps" aria-hidden="true">' +
        Array.from({ length: totalSteps() }, (_, i) => '<span class="' + (i < draft.step ? 'on' : '') + '"></span>').join('') + '</div>' +
        '<h1 class="page-title">' + title + '</h1>' + (subtitle ? '<p class="muted">' + subtitle + '</p>' : '');
}

function onboardingView() {
    let body;
    if (draft.step === 1) {
        body = stepHeader('¿Para qué examen te preparas?', 'Te mostraremos solo los exámenes que te sirven. Puedes cambiarlo después.') +
            '<div class="level-options">' + Object.entries(LEVELS).map(([key, l]) =>
                '<button class="level-opt' + (draft.level === key ? ' selected' : '') + '" data-level="' + key + '">' +
                '<strong>' + l.label + '</strong><span>' + l.blurb + '</span></button>').join('') + '</div>';
    } else if (draft.step === 2) {
        body = stepHeader('¿Cómo te llamas?', 'Aparecerá en tus resultados.' + (GUEST ? ' En modo invitado se olvida al cerrar la pestaña.' : '')) +
            '<form class="onb-form" id="nameForm"><div class="field"><label for="obName">Tu nombre</label>' +
            '<input id="obName" type="text" autocomplete="given-name" placeholder="Ingresa tu nombre" value="' + esc(draft.name) + '" required></div>' +
            '<p class="error" id="obError" hidden>Escribe tu nombre para continuar.</p>' +
            '<div class="btn-row"><button class="btn primary" type="submit">Continuar</button>' +
            '<button class="btn ghost" type="button" data-act="back">Atrás</button></div></form>';
    } else {
        const total = LEVELS[draft.level].goalTotal;
        const value = draft.goal ? draft.goal.correct : Math.round(total * 0.75);
        body = stepHeader('Define tu meta', '¿Cuántos aciertos quieres obtener en el examen de ' + LEVELS[draft.level].label.toLowerCase() + '? ' +
            'Compararemos tus resultados con ella. Puedes cambiarla cuando quieras.') +
            '<form class="onb-form" id="goalForm">' + goalFields(value, total) +
            '<div class="btn-row"><button class="btn primary" type="submit">Guardar meta</button>' +
            '<button class="btn" type="button" data-act="skip-goal">Definir después</button>' +
            '<button class="btn ghost" type="button" data-act="back">Atrás</button></div></form>';
    }
    return '<section class="panel onboarding">' + body + '</section>';
}


function finishOnboarding(goal) {
    saveProfile({ level: draft.level, name: draft.name, goal });
    draft = null;
    if (returnTo) { location.href = examHref(returnTo); return; }
    window.scrollTo({ top: 0 });
    render();
}

// ---------------- home ----------------
function homeView(p) {
    const level = LEVELS[p.level];
    const mine = inCategory(exams, level.category);

    const goal = p.goal ? 'Meta: ' + p.goal.correct + ' de ' + p.goal.total : 'Sin meta';
    const head = '<header class="home-head">' +
        (GUEST ? '<p class="guest-banner">Modo invitado: nada se guarda al cerrar esta pestaña.</p>' : '') +
        '<p class="brand">📚 Ludomatics</p>' +
        '<h1>Hola, ' + esc(p.name) + (GUEST ? ' <span class="muted">(invitado)</span>' : '') + '</h1>' +
        '<div class="chips"><span class="chip">' + level.label + '</span>' + (GUEST ? '' : '<span class="chip">' + goal + '</span>') + '</div>' +
        '<div class="btn-row">' + (GUEST
            ? '<button class="btn small-btn" data-act="guest-change">Cambiar nombre o nivel</button><button class="btn small-btn" data-act="guest-exit">Salir del modo invitado</button>'
            : '<button class="btn small-btn" data-act="edit">Editar perfil</button>') + '</div></header>';

    const list = items => '<div class="exam-grid">' + items.map(examCard).join('') + '</div>';
    if (GUEST) {
        // Guest mode keeps no history, so it simply lists every exam of the level.
        const catalog = mine.length ? list(mine) : '<p class="muted">Todavía no hay exámenes de ' + level.label.toLowerCase() + '.</p>';
        return head + '<section class="home-section"><h2>Exámenes de ' + level.label.toLowerCase() + '</h2>' + catalog + '</section>';
    }

    // Pending: exams in progress first, then the ones not started. Graded exams move to Historial.
    const withStatus = mine.map(e => ({ e, s: statusOf(e) }));
    const pending = withStatus.filter(x => x.s && x.s.kind === 'progress')
        .concat(withStatus.filter(x => !x.s)).map(x => x.e);
    const empty = mine.length
        ? '<p class="empty-note">¡Estás al día! Cuando haya exámenes nuevos de ' + level.label.toLowerCase() + ' aparecerán aquí.</p>'
        : '<p class="empty-note">Todavía no hay exámenes de ' + level.label.toLowerCase() + '.</p>';
    const pendingSection = '<section class="home-section" id="pendientes"><h2>Exámenes pendientes</h2>' +
        (pending.length ? list(pending) : empty) + '</section>';

    const history = getHistory();
    return head + pendingSection + historySection(history, historyAll) + progressSection(history, p, app.clientWidth);
}

// ---------------- profile editor ----------------
function editDialog(p) {
    if (confirmStartOver) return startOverDialog();
    const level = p.level;
    const locked = levelLocked();
    const total = LEVELS[level].goalTotal;
    const value = p.goal ? Math.round((p.goal.correct / p.goal.total) * total) : Math.round(total * 0.75);
    return '<div class="overlay" data-overlay><form class="panel dialog" id="editForm" role="dialog" aria-modal="true" aria-labelledby="editTitle">' +
        '<div class="dialog-head"><h2 id="editTitle">Editar perfil</h2><button class="btn ghost close-btn" type="button" data-act="close-edit" aria-label="Cerrar">×</button></div>' +
        '<div class="field"><label for="edName">Nombre</label><input id="edName" type="text" value="' + esc(p.name) + '" required></div>' +
        (locked
            // Locked after 10 answered questions or a graded exam: history must not mix levels.
            ? '<div class="field"><span class="label">Nivel</span><p class="locked-level"><strong>' + LEVELS[level].label + '</strong> 🔒</p>' +
              '<p class="muted small">Ya respondiste preguntas de ' + LEVELS[level].label.toLowerCase() + ', así que el nivel ya no se puede cambiar. ' +
              'Si necesitas otro nivel, usa «Empezar de nuevo».</p></div>'
            : '<fieldset class="field"><legend>Nivel</legend><div class="radio-row">' + Object.entries(LEVELS).map(([k, l]) =>
              '<label class="radio"><input type="radio" name="edLevel" value="' + k + '"' + (k === level ? ' checked' : '') + '> ' + l.label + '</label>').join('') + '</div>' +
              '<p class="muted small">Podrás cambiarlo hasta que respondas ' + LEVEL_LOCK_ANSWERS + ' preguntas.</p></fieldset>') +
        '<fieldset class="field"><legend>Meta</legend>' +
        '<label class="radio"><input type="checkbox" id="edNoGoal"' + (p.goal ? '' : ' checked') + '> Sin meta por ahora</label>' +
        '<div id="edGoalBox"' + (p.goal ? '' : ' hidden') + '>' + goalFields(value, total) + '</div></fieldset>' +
        '<p class="error" id="edError" hidden></p>' +
        '<div class="btn-row"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-act="close-edit">Cancelar</button></div>' +
        '<div class="dialog-foot"><button class="btn danger-ghost small-btn" type="button" data-act="ask-start-over">Empezar de nuevo</button></div>' +
        '</form></div>';
}

// Second confirmation: say exactly what will be deleted.
function startOverDialog() {
    const results = getHistory().length;
    return '<div class="overlay" data-overlay><section class="panel dialog" id="startOverDialog" role="alertdialog" aria-modal="true" aria-labelledby="soTitle" tabindex="-1">' +
        '<div class="dialog-head"><h2 id="soTitle">¿Empezar de nuevo?</h2><button class="btn ghost close-btn" type="button" data-act="cancel-start-over" aria-label="Cerrar">×</button></div>' +
        '<p>Se borrarán de este dispositivo tu perfil, ' + (results ? '<strong>' + (results === 1 ? 'tu resultado' : 'tus ' + results + ' resultados') + '</strong>, ' : '') +
        'tus exámenes en progreso y las contraseñas guardadas. Después podrás elegir nivel, nombre y meta otra vez.</p>' +
        '<p><strong>Esta acción no se puede deshacer.</strong></p>' +
        '<div class="btn-row"><button class="btn danger" type="button" data-act="confirm-start-over">Sí, borrar todo</button>' +
        '<button class="btn" type="button" data-act="cancel-start-over">No, volver</button></div></section></div>';
}

// ---------------- events ----------------
app.addEventListener('click', e => {
    if (e.target.matches('[data-overlay]')) { editing = false; editingGoal = false; confirmStartOver = false; render(); return; }
    const lvl = e.target.closest('[data-level]');
    if (lvl) { draft.level = lvl.dataset.level; draft.step = 2; render('#obName'); return; }
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    switch (btn.dataset.act) {
        case 'back': draft.step -= 1; render(draft.step === 2 ? '#obName' : null); break;
        case 'skip-goal': finishOnboarding(null); break;
        case 'edit': editing = true; render('#edName'); break;
        case 'edit-goal': editingGoal = true; render('#goalNumber'); break;
        case 'close-goal': editingGoal = false; render(); break;
        case 'history-all': historyAll = true; render(); break;
        case 'close-edit': editing = false; render('[data-act="edit"]'); break;
        case 'ask-start-over': confirmStartOver = true; render('#startOverDialog'); break;
        case 'cancel-start-over': confirmStartOver = false; render('[data-act="ask-start-over"]'); break;
        case 'confirm-start-over':
            startOver();
            editing = false;
            confirmStartOver = false;
            draft = null;
            window.scrollTo({ top: 0 });
            render();
            break;
        case 'guest-change': {
            const p = getProfile();
            draft = { step: 1, level: p.level, name: p.name, goal: null };
            render();
            break;
        }
        case 'guest-exit': clearAll(); location.href = '../interactive/'; break;
    }
});

app.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'goalForm' && editingGoal) {
        const remove = document.getElementById('noGoal');
        const goal = remove && remove.checked ? null : readGoal(LEVELS[getProfile().level].goalTotal);
        if (!goal && !(remove && remove.checked)) return;
        updateProfile({ goal });
        editingGoal = false;
        render();   // goal card, chart goal line and "Necesita atención" follow the new goal
    } else if (e.target.id === 'nameForm') {
        const name = document.getElementById('obName').value.trim();
        if (!name) { document.getElementById('obError').hidden = false; return; }
        draft.name = name;
        if (GUEST) { finishOnboarding(null); return; }
        draft.step = 3;
        render('#goalNumber');
    } else if (e.target.id === 'goalForm') {
        const total = LEVELS[draft.level].goalTotal;
        const n = Math.round(Number(document.getElementById('goalNumber').value));
        if (!(n >= 1 && n <= total)) return;
        finishOnboarding({ correct: n, total });
    } else if (e.target.id === 'editForm') {
        const name = document.getElementById('edName').value.trim();
        // A locked level has no radio buttons: keep the current one.
        const level = (e.target.querySelector('input[name="edLevel"]:checked') || {}).value || getProfile().level;
        const err = document.getElementById('edError');
        if (!name) { err.textContent = 'Escribe tu nombre.'; err.hidden = false; return; }
        let goal = null;
        if (!document.getElementById('edNoGoal').checked) {
            const total = LEVELS[level].goalTotal;
            const n = Math.round(Number(document.getElementById('goalNumber').value));
            if (!(n >= 1 && n <= total)) { err.textContent = 'La meta debe estar entre 1 y ' + total + '.'; err.hidden = false; return; }
            goal = { correct: n, total };
        }
        updateProfile({ name, level, goal });
        editing = false;
        render();
    }
});

// Keep the goal number, slider and percentage in sync; re-scale the goal when the level changes in the editor.
bindGoalSync(app);
app.addEventListener('change', e => {
    if (e.target.id === 'edNoGoal') document.getElementById('edGoalBox').hidden = e.target.checked;
    if (e.target.id === 'noGoal') ['goalNumber', 'goalRange'].forEach(id => { document.getElementById(id).disabled = e.target.checked; });
    if (e.target.name === 'edLevel') {
        const num = document.getElementById('goalNumber'), range = document.getElementById('goalRange');
        const oldTotal = Number(range.max), newTotal = LEVELS[e.target.value].goalTotal;
        const v = Math.min(newTotal, Math.round((Number(num.value) / oldTotal) * newTotal));
        [num, range].forEach(x => { x.max = newTotal; x.value = v; });
        app.querySelector('.goal-total').textContent = 'de ' + newTotal;
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && editing) { editing = false; confirmStartOver = false; render('[data-act="edit"]'); }
    else if (e.key === 'Escape' && editingGoal) { editingGoal = false; render(); }
});
