// Everything the site remembers goes through this module.
//
// Two modes, chosen by the page (<html data-mode="guest"> for /invitado/):
// - personal (default): kept on this device in localStorage, under "ludomatics.*"
// - guest: kept only while the tab is open (sessionStorage), under "ludomatics.guest.*",
//   so a guest never reads or changes the owner's profile, history or attempts.
//
// Every access is wrapped: private mode or blocked storage must never break the site.

export const MODE = document.documentElement.dataset.mode === 'guest' ? 'guest' : 'personal';
const PREFIX = MODE === 'guest' ? 'ludomatics.guest.' : 'ludomatics.';

function backend() {
    try { return MODE === 'guest' ? sessionStorage : localStorage; } catch (e) { return null; }
}

export function getJSON(name, fallback = null) {
    try {
        const raw = backend().getItem(PREFIX + name);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

// Returns true when it was saved.
export function setJSON(name, value) {
    try {
        backend().setItem(PREFIX + name, JSON.stringify(value));
        return true;
    } catch (e) {
        return false;
    }
}

export function remove(name) {
    try { backend().removeItem(PREFIX + name); } catch (e) { /* nothing to remove */ }
}

// Every key this mode owns (used to wipe guest data on "Salir").
export function clearAll() {
    const store = backend();
    if (!store) return;
    try {
        Object.keys(store).filter(k => k.startsWith(PREFIX)).forEach(k => store.removeItem(k));
    } catch (e) { /* ignore */ }
}

// ---------------- exam attempts (one in-progress or graded attempt per exam) ----------------

export function loadAttempt(examId, questionCount) {
    const attempt = getJSON('quiz.' + examId);
    // Drop attempts that no longer match the exam (e.g. questions were added or removed).
    if (!attempt || !Array.isArray(attempt.answers) || attempt.answers.length !== questionCount) return null;
    return attempt;
}

export function saveAttempt(examId, attempt) {
    return setJSON('quiz.' + examId, attempt);
}

export function clearAttempt(examId) {
    remove('quiz.' + examId);
}

// Every saved attempt in this mode (any exam), e.g. to count answered questions.
export function allAttempts() {
    const store = backend();
    if (!store) return [];
    try {
        return Object.keys(store).filter(k => k.startsWith(PREFIX + 'quiz.'))
            .map(k => { try { return JSON.parse(store.getItem(k)); } catch (e) { return null; } })
            .filter(a => a && Array.isArray(a.answers));
    } catch (e) {
        return [];
    }
}

// ---------------- whole-device data (backup and restore) ----------------

// Every saved value in this mode, as { name: value } (names without the prefix).
export function allEntries() {
    const store = backend();
    const out = {};
    if (!store) return out;
    try {
        Object.keys(store).filter(k => k.startsWith(PREFIX)).forEach(k => {
            try { out[k.slice(PREFIX.length)] = JSON.parse(store.getItem(k)); } catch (e) { /* skip unreadable */ }
        });
    } catch (e) { /* ignore */ }
    return out;
}

// Replaces every saved value except the ones `keep(name)` returns true for. Returns true when all were saved.
export function replaceAll(entries, keep = () => false) {
    const store = backend();
    if (!store) return false;
    try {
        Object.keys(store).filter(k => k.startsWith(PREFIX) && !keep(k.slice(PREFIX.length))).forEach(k => store.removeItem(k));
    } catch (e) { return false; }
    return Object.entries(entries).every(([name, value]) => setJSON(name, value));
}

// Asks the browser not to delete this site's data on its own (e.g. Safari after 7 days without visits,
// or when the device is low on space). Silent: if the browser says no, nothing changes.
export async function requestPersistence() {
    if (MODE !== 'personal') return false;
    try {
        if (!(navigator.storage && navigator.storage.persist)) return false;
        if (await navigator.storage.persisted()) return true;
        return await navigator.storage.persist();
    } catch (e) {
        return false;
    }
}
