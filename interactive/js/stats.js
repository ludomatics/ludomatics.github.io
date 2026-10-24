// Progress numbers for "Tu progreso", all computed from the history of graded exams (profile.js).

export const SUBJECT_NAMES = {
    fisica: 'Física',
    quimica: 'Química',
    biologia: 'Biología',
    matematicas: 'Matemáticas',
    espanol: 'Español',
    literatura: 'Literatura',
    geografia: 'Geografía',
    historia: 'Historia',
    'historia-universal': 'Historia Universal',
    'historia-mexico': 'Historia de México',
    'formacion-civica': 'Formación Cívica y Ética',
    'habilidad-verbal': 'Habilidad Verbal',
    'habilidad-matematica': 'Habilidad Matemática'
};

// A subject "needs attention" when the student has answered enough of it to judge (MIN_QUESTIONS)
// and their accuracy is below their goal percentage (or DEFAULT_PCT without a goal).
export const ATTENTION_MIN_QUESTIONS = 10;
export const ATTENTION_DEFAULT_PCT = 60;
// A change in the latest exam counts as a trend from this many percentage points.
const TREND_POINTS = 10;

const pct = (correct, total) => (total ? (correct / total) * 100 : 0);

export function goalPercent(profile) {
    return profile && profile.goal && profile.goal.total ? pct(profile.goal.correct, profile.goal.total) : null;
}

export function attentionThreshold(profile) {
    const g = goalPercent(profile);
    return g === null ? ATTENTION_DEFAULT_PCT : g;
}

const byDate = history => history.slice().sort((a, b) => a.finishedAt - b.finishedAt);

// One point per graded exam, oldest first.
export function scoreSeries(history) {
    return byDate(history).map(r => ({
        at: r.finishedAt, title: r.examTitle, examId: r.examId, answers: r.answers,
        correct: r.correct, total: r.total, pct: pct(r.correct, r.total), goal: r.goal
    }));
}

export function totals(history) {
    const s = scoreSeries(history);
    const answered = history.reduce((n, r) => n + r.total, 0);
    const correct = history.reduce((n, r) => n + r.correct, 0);
    return {
        exams: history.length,
        answered,
        average: answered ? pct(correct, answered) : null,
        best: s.length ? s.reduce((b, p) => (p.pct > b.pct ? p : b)) : null,
        latest: s.length ? s[s.length - 1] : null,
        studyMs: history.reduce((n, r) => n + (r.elapsedMs || 0), 0)
    };
}

// Accuracy per subject across every graded exam, weakest first.
// Each: { key, name, correct, total, pct, lastPct, trend (pts vs. before the latest exam, or null), attention }
export function subjectStats(history, profile) {
    const threshold = attentionThreshold(profile);
    const map = new Map();
    for (const r of byDate(history)) {
        for (const s of r.sections || []) {
            if (!s.total) continue;
            const key = s.subject || s.title;
            const m = map.get(key) || { key, name: SUBJECT_NAMES[s.subject] || s.title, correct: 0, total: 0, last: null, before: null };
            m.before = { correct: m.correct, total: m.total };
            m.correct += s.correct;
            m.total += s.total;
            m.last = { correct: s.correct, total: s.total };
            map.set(key, m);
        }
    }
    return [...map.values()].map(m => {
        const p = pct(m.correct, m.total);
        const trend = m.before && m.before.total ? pct(m.last.correct, m.last.total) - pct(m.before.correct, m.before.total) : null;
        return {
            key: m.key, name: m.name, correct: m.correct, total: m.total, pct: p,
            lastPct: pct(m.last.correct, m.last.total),
            trend: trend !== null && Math.abs(trend) >= TREND_POINTS ? trend : null,
            attention: m.total >= ATTENTION_MIN_QUESTIONS && p < threshold
        };
    }).sort((a, b) => a.pct - b.pct);
}

// The latest exam measured against the goal, in the goal's own scale (e.g. 87 of 120 vs. 90 of 120).
export function goalStatus(history, profile) {
    if (!profile || !profile.goal) return null;
    const t = totals(history);
    const scale = p => Math.round((p / 100) * profile.goal.total);
    return {
        goal: profile.goal.correct,
        total: profile.goal.total,
        goalPct: goalPercent(profile),
        latest: t.latest ? scale(t.latest.pct) : null,
        best: t.best ? scale(t.best.pct) : null,
        reached: t.latest ? t.latest.pct >= goalPercent(profile) - 1e-9 : false
    };
}

export function formatStudyTime(ms) {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return minutes + ' min';
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
}
