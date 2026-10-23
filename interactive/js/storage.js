// Saves one attempt per exam in this browser's localStorage.
// Every access is wrapped: private mode or blocked storage must never break the quiz.

const PREFIX = 'ludomatics.quiz.';

function key(examId) {
    return PREFIX + examId;
}

export function loadAttempt(examId, questionCount) {
    try {
        const raw = localStorage.getItem(key(examId));
        if (!raw) return null;
        const attempt = JSON.parse(raw);
        // Drop attempts that no longer match the exam (e.g. questions were added or removed).
        if (!attempt || !Array.isArray(attempt.answers) || attempt.answers.length !== questionCount) return null;
        return attempt;
    } catch (e) {
        return null;
    }
}

// Returns true when the attempt was saved.
export function saveAttempt(examId, attempt) {
    try {
        localStorage.setItem(key(examId), JSON.stringify(attempt));
        return true;
    } catch (e) {
        return false;
    }
}

export function clearAttempt(examId) {
    try {
        localStorage.removeItem(key(examId));
    } catch (e) {
        /* nothing to clear */
    }
}
