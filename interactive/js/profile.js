// The student's profile (level, name, goal), their history of graded exams, and remembered passwords.
import { MODE, getJSON, setJSON, remove, clearAll, allAttempts } from './storage.js';

// Levels a student can choose. `category` matches "category" in exams/index.json;
// `goalTotal` is the length of that level's admission exam, the scale for the goal.
export const LEVELS = {
    bachillerato: {
        label: 'Bachillerato',
        category: 'Bachillerato',
        goalTotal: 128,
        blurb: 'Examen de ingreso a la educación media superior.'
    },
    universidad: {
        label: 'Universidad',
        category: 'Universidad',
        goalTotal: 120,
        blurb: 'Examen de ingreso a licenciatura.'
    }
};

export const levelOfCategory = category =>
    Object.keys(LEVELS).find(k => LEVELS[k].category.toLowerCase() === String(category || '').toLowerCase()) || null;

// ---------------- profile ----------------
// { v: 1, level: 'universidad' | 'bachillerato', name: 'Ana', goal: { correct: 90, total: 120 } | null, createdAt }

export function getProfile() {
    const p = getJSON('profile');
    return p && LEVELS[p.level] && p.name ? p : null;
}

export function saveProfile(profile) {
    return setJSON('profile', Object.assign({ v: 1, createdAt: Date.now() }, profile));
}

export function updateProfile(patch) {
    const current = getJSON('profile') || {};
    return saveProfile(Object.assign({}, current, patch));
}

// The goal scaled to an exam of `total` questions (e.g. 90/120 → 96/128). Null when there is no goal.
export function goalFor(total) {
    const p = getProfile();
    if (!p || !p.goal || !p.goal.total) return null;
    return Math.round((p.goal.correct / p.goal.total) * total);
}

// ---------------- level lock ----------------
// After 10 answered questions (any exam) or any graded exam, the level can no longer change,
// so history and progress never mix bachillerato and universidad. "Empezar de nuevo" is the way out.
export const LEVEL_LOCK_ANSWERS = 10;

export function answeredQuestions() {
    return allAttempts().reduce((n, a) => n + a.answers.filter(x => x !== null).length, 0);
}

export function levelLocked() {
    return getHistory().length > 0 || answeredQuestions() >= LEVEL_LOCK_ANSWERS;
}

// Deletes profile, history, attempts and remembered passwords on this device (this mode only).
export function startOver() {
    clearAll();
}

// ---------------- history ----------------
// One record per graded attempt; never overwritten by "Nuevo intento".
// { examId, examTitle, category, finishedAt, correct, total, elapsedMs, goal, answers: 'ABDC…',
//   sections: [{ title, subject, correct, total }] }

const HISTORY_LIMIT = 500;

export function getHistory() {
    const h = getJSON('history', []);
    return Array.isArray(h) ? h : [];
}

export function addToHistory(record) {
    // Guests keep nothing after the tab closes; their history is not worth recording.
    if (MODE === 'guest') return false;
    const history = getHistory();
    // The same attempt graded twice (e.g. double tap) is recorded once.
    if (history.some(r => r.examId === record.examId && r.finishedAt === record.finishedAt)) return true;
    history.push(record);
    return setJSON('history', history.slice(-HISTORY_LIMIT));
}

// ---------------- passwords of protected exams ----------------
// Personal devices remember them (localStorage); guests only for the open tab (sessionStorage).

export const getPassword = examId => getJSON('password.' + examId);
export const rememberPassword = (examId, password) => setJSON('password.' + examId, password);
export const forgetPassword = examId => remove('password.' + examId);
