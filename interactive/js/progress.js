// "Tu progreso": the student's dashboard, built from their history of graded exams.
import { LEVELS, getProfile, getHistory, updateProfile } from './profile.js';
import { goalFields, bindGoalSync, readGoal } from './goal-ui.js';
import { esc } from './catalog.js';
import { scoreSeries, totals, subjectStats, goalStatus, attentionThreshold, formatStudyTime, ATTENTION_MIN_QUESTIONS } from './stats.js';

const app = document.getElementById('app');
let profile = getProfile();
let editingGoal = false;
if (!profile) location.replace('./');   // no onboarding yet: the home page takes care of it
else {
    render();
    // Redraw the chart at the new width when the screen rotates or the window is resized.
    let timer;
    addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const card = document.getElementById('chartCard');
            if (card) card.outerHTML = chartCard(getHistory());
        }, 150);
    });
}

function render() {
    const history = getHistory();
    const level = LEVELS[profile.level];
    const head = '<header class="topbar"><div class="topbar-main"><a class="back-link" href="./">← Mis exámenes</a>' +
        '<h1 class="page-title">Tu progreso</h1><p class="muted">' + esc(profile.name) + ' · ' + level.label + '</p></div></header>';
    if (!history.length) {
        app.innerHTML = head + '<section class="panel"><h2 class="dash-h">Aún no tienes resultados</h2>' +
            '<p>Cuando termines y califiques tu primer examen, aquí verás tu avance hacia tu meta, tus materias más fuertes y las que necesitan más atención.</p>' +
            '<div class="btn-row"><a class="btn primary" href="./">Ir a mis exámenes</a></div></section>';
        return;
    }
    app.innerHTML = head + tiles(history) + goalCard(history) + chartCard(history) + subjectsCard(history) + historyCard(history) +
        (editingGoal ? goalDialog() : '');
    document.body.style.overflow = editingGoal ? 'hidden' : '';
}

// ---------------- goal editor (overlay on this page) ----------------
function goalDialog() {
    const total = LEVELS[profile.level].goalTotal;
    const value = profile.goal ? Math.round((profile.goal.correct / profile.goal.total) * total) : Math.round(total * 0.75);
    return '<div class="overlay" data-overlay><form class="panel dialog" id="goalForm" role="dialog" aria-modal="true" aria-labelledby="goalTitle">' +
        '<div class="dialog-head"><h2 id="goalTitle">' + (profile.goal ? 'Cambiar mi meta' : 'Define tu meta') + '</h2>' +
        '<button class="btn ghost close-btn" type="button" data-act="close-goal" aria-label="Cerrar">×</button></div>' +
        '<p class="muted">¿Cuántos aciertos quieres obtener en el examen de ' + LEVELS[profile.level].label.toLowerCase() + '?</p>' +
        goalFields(value, total) +
        (profile.goal ? '<label class="radio"><input type="checkbox" id="noGoal"> Quitar mi meta</label>' : '') +
        '<div class="btn-row"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-act="close-goal">Cancelar</button></div>' +
        '</form></div>';
}

function openGoal() { editingGoal = true; render(); const n = document.getElementById('goalNumber'); if (n) n.focus(); }
function closeGoal() { editingGoal = false; render(); }

app.addEventListener('click', e => {
    if (e.target.matches('[data-overlay]')) { closeGoal(); return; }
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'edit-goal') openGoal();
    if (btn.dataset.act === 'close-goal') closeGoal();
});
app.addEventListener('submit', e => {
    if (e.target.id !== 'goalForm') return;
    e.preventDefault();
    const remove = document.getElementById('noGoal');
    const goal = remove && remove.checked ? null : readGoal(LEVELS[profile.level].goalTotal);
    if (!goal && !(remove && remove.checked)) return;
    updateProfile({ goal });
    profile = getProfile();
    editingGoal = false;
    render();   // tiles, goal card, chart goal line and "Necesita atención" all follow the new goal
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && editingGoal) closeGoal(); });
app.addEventListener('change', e => {
    if (e.target.id !== 'noGoal') return;
    ['goalNumber', 'goalRange'].forEach(id => { document.getElementById(id).disabled = e.target.checked; });
});
bindGoalSync(app);

// ---------------- summary tiles ----------------
function tiles(history) {
    const t = totals(history);
    const tile = (value, label) => '<div class="tile"><span class="tile-value">' + value + '</span><span class="tile-label">' + label + '</span></div>';
    return '<section class="dash-tiles">' +
        tile(t.exams, t.exams === 1 ? 'examen terminado' : 'exámenes terminados') +
        tile(Math.round(t.average) + '%', 'aciertos en promedio') +
        tile(Math.round(t.best.pct) + '%', 'mejor resultado') +
        tile(formatStudyTime(t.studyMs), 'de estudio') +
        '</section>';
}

// ---------------- goal ----------------
function goalCard(history) {
    const g = goalStatus(history, profile);
    if (!g) {
        return '<section class="panel goal-card"><h2 class="dash-h">Tu meta</h2>' +
            '<p>Todavía no tienes una meta. Definirla te ayuda a saber cuánto te falta y qué materias reforzar.</p>' +
            '<div class="btn-row"><button class="btn primary" data-act="edit-goal">Define tu meta</button></div></section>';
    }
    const fill = Math.min(100, (g.latest / g.goal) * 100);
    const message = g.reached
        ? '<p class="goal-result hit">✓ Tu último resultado alcanzó tu meta.</p>'
        : '<p class="goal-result miss">Te faltan <strong>' + (g.goal - g.latest) + '</strong> aciertos para tu meta.</p>';
    return '<section class="panel goal-card"><h2 class="dash-h">Tu meta</h2>' +
        '<p class="goal-big"><strong>' + g.goal + '</strong> de ' + g.total + ' aciertos <span class="muted">(' + Math.round(g.goalPct) + '%)</span></p>' +
        '<div class="goal-bar" role="img" aria-label="Último resultado: ' + g.latest + ' de ' + g.goal + ' aciertos de tu meta">' +
        '<span style="width:' + fill + '%" class="' + (g.reached ? 'hit' : '') + '"></span></div>' +
        '<div class="goal-figures"><span>Último: <strong>' + g.latest + '</strong></span><span>Mejor: <strong>' + g.best + '</strong></span><span>Meta: <strong>' + g.goal + '</strong></span></div>' +
        message +
        (history.some(r => r.total !== g.total) ? '<p class="muted small">Los exámenes de otra longitud se convierten a la escala de ' + g.total + ' preguntas.</p>' : '') +
        '<p class="small"><button class="link-btn" data-act="edit-goal">Cambiar mi meta</button></p></section>';
}

// ---------------- score over time (SVG, no library) ----------------
function chartCard(history) {
    const series = scoreSeries(history);
    const goal = profile.goal ? (profile.goal.correct / profile.goal.total) * 100 : null;
    // Drawn at the panel's real width (no scaling), so labels keep their size on phones and computers.
    const W = Math.max(280, Math.min(720, app.clientWidth - 48)), H = 230, L = 44, R = 12, T = 18, B = 34;
    const x = i => (series.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (series.length - 1));
    const y = p => T + (1 - p / 100) * (H - T - B);
    const date = t => new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

    let svg = '<svg class="chart" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Porcentaje de aciertos por examen, del más antiguo al más reciente">';
    [0, 25, 50, 75, 100].forEach(v => {
        svg += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
            '<text class="axis" x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '%</text>';
    });
    if (goal !== null) {
        svg += '<line class="goal-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(goal) + '" y2="' + y(goal) + '"/>' +
            '<text class="goal-label" x="' + (L + 6) + '" y="' + (y(goal) - 7) + '">Meta ' + Math.round(goal) + '%</text>';
    }
    if (series.length > 1) svg += '<polyline class="line" points="' + series.map((p, i) => x(i) + ',' + y(p.pct)).join(' ') + '"/>';
    series.forEach((p, i) => {
        const hit = goal !== null && p.pct >= goal - 1e-9;
        svg += '<circle class="pt' + (hit ? ' hit' : '') + '" cx="' + x(i) + '" cy="' + y(p.pct) + '" r="6"><title>' +
            esc(p.title) + ' · ' + date(p.at) + ': ' + p.correct + ' de ' + p.total + ' (' + Math.round(p.pct) + '%)</title></circle>';
    });
    // date labels: all of them when they fit, otherwise first, middle and last
    const fits = Math.floor((W - L - R) / 70);
    const labelled = series.length <= fits ? series.map((_, i) => i) : [0, Math.floor((series.length - 1) / 2), series.length - 1];
    labelled.forEach(i => {
        // the first and last labels hug the edges so they are never cut off
        const anchor = series.length === 1 ? 'middle' : i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle';
        const lx = anchor === 'start' ? x(i) - 10 : anchor === 'end' ? Math.min(W - 2, x(i) + 10) : x(i);
        svg += '<text class="axis" x="' + lx + '" y="' + (H - 10) + '" text-anchor="' + anchor + '">' + date(series[i].at) + '</text>';
    });
    svg += '</svg>';

    return '<section class="panel" id="chartCard"><h2 class="dash-h">Tus resultados en el tiempo</h2>' + svg +
        '<p class="muted small">Cada punto es un examen calificado' + (goal !== null ? '; en verde, los que alcanzaron tu meta' : '') + '.</p></section>';
}

// ---------------- subjects ----------------
function subjectsCard(history) {
    const subjects = subjectStats(history, profile);
    const threshold = attentionThreshold(profile);
    const flagged = subjects.filter(s => s.attention);
    const intro = flagged.length
        ? '<p>Estas materias están por debajo de ' + (profile.goal ? 'tu meta' : 'el ' + Math.round(threshold) + '%') + ': ' +
          flagged.slice(0, 3).map(s => '<strong>' + esc(s.name) + '</strong>').join(', ') + '. Dales prioridad en tu estudio.</p>'
        : '<p>' + (subjects.some(s => s.total >= ATTENTION_MIN_QUESTIONS)
            ? '¡Vas bien! Ninguna materia está por debajo de ' + (profile.goal ? 'tu meta' : 'el ' + Math.round(threshold) + '%') + '.'
            : 'Responde más preguntas para saber qué materias necesitan atención.') + '</p>';
    const rows = subjects.map(s => {
        const cls = s.pct >= threshold ? 'good' : s.attention ? 'low' : 'mid';
        const trend = s.trend === null ? '' : s.trend > 0
            ? '<span class="trend up">↑ ' + Math.round(s.trend) + ' pts en tu último examen</span>'
            : '<span class="trend down">↓ ' + Math.round(-s.trend) + ' pts en tu último examen</span>';
        return '<li class="subject' + (s.attention ? ' attention' : '') + '">' +
            '<div class="subject-head"><span class="subject-name">' + esc(s.name) + '</span>' +
            (s.attention ? '<span class="badge">Necesita atención</span>' : '') +
            '<span class="subject-pct">' + Math.round(s.pct) + '%</span></div>' +
            '<div class="subject-bar"><span class="' + cls + '" style="width:' + s.pct + '%"></span>' +
            '<i class="threshold" style="left:' + threshold + '%" title="' + (profile.goal ? 'Tu meta' : 'Referencia') + '"></i></div>' +
            '<div class="subject-meta muted small"><span>' + s.correct + ' de ' + s.total + ' preguntas</span>' + trend + '</div></li>';
    }).join('');
    return '<section class="panel"><h2 class="dash-h">Por materia</h2>' + intro +
        '<ul class="subject-list">' + rows + '</ul>' +
        '<p class="muted small">La línea vertical marca ' + (profile.goal ? 'tu meta (' + Math.round(threshold) + '%)' : 'el ' + Math.round(threshold) + '%') +
        '. Una materia se marca cuando ya respondiste al menos ' + ATTENTION_MIN_QUESTIONS + ' preguntas de ella.</p></section>';
}

// ---------------- full history ----------------
function historyCard(history) {
    const date = t => new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    const items = scoreSeries(history).reverse().map(r => {
        const goal = typeof r.goal === 'number'
            ? (r.correct >= r.goal ? '<span class="goal-hit">✓ Meta alcanzada</span>' : '<span class="goal-miss">A ' + (r.goal - r.correct) + ' de tu meta</span>')
            : '';
        const body = '<span class="h-title"><strong>' + esc(r.title) + '</strong><span class="muted small">' + date(r.at) + '</span></span>' +
            '<span class="h-score"><span><strong>' + r.correct + '</strong> / ' + r.total + ' <span class="muted small">(' + Math.round(r.pct) + '%)</span></span>' + goal + '</span>';
        // Tappable when the record kept the answers: opens that attempt's results and review, read-only.
        return r.answers && r.answers.length === r.total
            ? '<li><a class="history-link" href="examen.html?id=' + encodeURIComponent(r.examId) + '&intento=' + r.at + '">' + body + '<span class="h-go" aria-hidden="true">›</span></a></li>'
            : '<li>' + body + '</li>';
    }).join('');
    return '<section class="home-section"><h2>Historial</h2><ul class="history-list">' + items + '</ul></section>';
}
