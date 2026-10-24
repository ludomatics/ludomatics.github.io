// "Tu progreso" and "Historial" on the home page, built from the student's history of graded exams.
import { esc } from './catalog.js';
import { LEVELS } from './profile.js';
import { goalFields } from './goal-ui.js';
import { scoreSeries, totals, subjectStats, goalStatus, attentionThreshold, formatStudyTime, ATTENTION_MIN_QUESTIONS } from './stats.js';

// History cards shown before "Ver todo".
export const HISTORY_PREVIEW = 5;

let profile = null;   // set by progressSection(); the cards below read it
let chartWidth = 600;

// Everything under "Tu progreso". `width` is the space available for the chart.
export function progressSection(history, p, width) {
    profile = p;
    chartWidth = width;
    const body = history.length
        ? tiles(history) + goalCard(history) + chartCard(history) + subjectsCard(history)
        : '<section class="panel"><p class="muted">Cuando califiques tu primer examen, aquí verás tu avance hacia tu meta, ' +
          'tus resultados en el tiempo y qué materias necesitan más atención.</p>' +
          (p.goal ? '' : '<div class="btn-row"><button class="btn" data-act="edit-goal">Define tu meta</button></div>') + '</section>';
    return '<section class="home-section" id="progreso"><h2>Tu progreso</h2><div class="dash">' + body + '</div></section>';
}

// Only the chart, redrawn when the screen width changes.
export function chartOnly(history, p, width) { profile = p; chartWidth = width; return chartCard(history); }

// ---------------- goal editor (overlay) ----------------
export function goalDialog(p) {
    const total = LEVELS[p.level].goalTotal;
    const value = p.goal ? Math.round((p.goal.correct / p.goal.total) * total) : Math.round(total * 0.75);
    return '<div class="overlay" data-overlay><form class="panel dialog" id="goalForm" role="dialog" aria-modal="true" aria-labelledby="goalTitle">' +
        '<div class="dialog-head"><h2 id="goalTitle">' + (p.goal ? 'Cambiar mi meta' : 'Define tu meta') + '</h2>' +
        '<button class="btn ghost close-btn" type="button" data-act="close-goal" aria-label="Cerrar">×</button></div>' +
        '<p class="muted">¿Cuántos aciertos quieres obtener en el examen de ' + LEVELS[p.level].label.toLowerCase() + '?</p>' +
        goalFields(value, total) +
        (p.goal ? '<label class="radio"><input type="checkbox" id="noGoal"> Quitar mi meta</label>' : '') +
        '<div class="btn-row"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-act="close-goal">Cancelar</button></div>' +
        '</form></div>';
}


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
    const W = Math.max(260, Math.min(720, chartWidth - 48)), H = 230, L = 44, R = 12, T = 18, B = 34;
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

// ---------------- history ----------------
// One card per graded attempt, newest first. Tapping opens that attempt's results.
export function historySection(history, showAll) {
    const date = t => new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    const all = scoreSeries(history).reverse();
    const shown = showAll ? all : all.slice(0, HISTORY_PREVIEW);
    const cards = shown.map(r => {
        const goal = typeof r.goal === 'number'
            ? (r.correct >= r.goal ? '<span class="goal-hit">✓ Meta alcanzada</span>' : '<span class="goal-miss">A ' + (r.goal - r.correct) + ' de tu meta</span>')
            : '';
        const body = '<span class="h-title"><strong>' + esc(r.title) + '</strong><span class="muted small">' + date(r.at) + '</span></span>' +
            '<span class="h-score"><span><strong>' + r.correct + '</strong> / ' + r.total + ' <span class="muted small">(' + Math.round(r.pct) + '%)</span></span>' + goal + '</span>';
        // Records without stored answers (very old ones) can't rebuild their results, so they aren't links.
        return r.answers && r.answers.length === r.total
            ? '<a class="history-card" href="examen.html?id=' + encodeURIComponent(r.examId) + '&intento=' + r.at + '">' + body + '<span class="h-go" aria-hidden="true">›</span></a>'
            : '<div class="history-card">' + body + '<span></span></div>';
    }).join('');
    const more = !showAll && all.length > HISTORY_PREVIEW
        ? '<button class="btn small-btn more-btn" data-act="history-all">Ver todo (' + all.length + ')</button>' : '';
    const content = all.length ? '<div class="history-cards">' + cards + '</div>' + more
        : '<p class="empty-note">Aquí aparecerá cada examen que califiques.</p>';
    return '<section class="home-section" id="historial"><h2>Historial</h2>' + content + '</section>';
}
