// Loads exam files, decrypts password-protected ones, and turns them into a flat, numbered list of questions.

// Format written by tools/encrypt-exam.mjs. Only these fields are readable without the password.
export const ENCRYPTED_FORMAT = 'ludomatics-exam-encrypted-v1';

// Returns { kind: 'plain', raw } or { kind: 'encrypted', file } (file.meta has id, title, category).
export async function loadExamFile(id) {
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
        throw new ExamError('No se indicó un examen válido.');
    }
    // Protected exams are published as <id>.enc.json; unprotected ones as <id>.json.
    for (const [name, kind] of [[`exams/${id}.enc.json`, 'encrypted'], [`exams/${id}.json`, 'plain']]) {
        let response;
        try {
            response = await fetch(name, { cache: 'no-cache' });
        } catch (e) {
            throw new ExamError('No se pudo cargar el examen. Revisa tu conexión e intenta de nuevo.');
        }
        if (response.status === 404) continue;
        if (!response.ok) throw new ExamError('No se pudo cargar el examen. Intenta de nuevo más tarde.');
        const body = await response.json();
        if (kind === 'encrypted') {
            if (body.format !== ENCRYPTED_FORMAT) throw new ExamError('El archivo del examen no tiene un formato válido.');
            return { kind, file: body };
        }
        return { kind, raw: body };
    }
    throw new ExamError('No encontramos ese examen.');
}

// Decrypts an encrypted exam file with the password. Throws ExamError on a wrong password.
export async function unlockExam(file, password) {
    if (!(globalThis.crypto && crypto.subtle)) {
        throw new ExamError('Este navegador no puede abrir exámenes protegidos. Ábrelo desde https:// o con un navegador actualizado.');
    }
    const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(file.kdf.salt), iterations: file.kdf.iterations },
        material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    let plain;
    try {
        plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(file.cipher.iv) }, key, bytes(file.cipher.data));
    } catch (e) {
        throw new ExamError('Contraseña incorrecta.');
    }
    return normalizeExam(JSON.parse(new TextDecoder().decode(plain)), file.meta.id);
}

export class ExamError extends Error {}

// Input: { id, title, category?, durationMinutes? (default 180), numberOfOptions,
//          passages?: { <key>: { intro?, title?, html } },
//          sections: [{ title, subject?, questions: [{ text, options[], answer, image?, passage? }] }] }
// Output: { id, title, letters, passages, sections: [{ title, subject, start, end, count }], questions: [{ ..., number, sectionIndex }] }
export function normalizeExam(raw, fallbackId) {
    const letters = 'ABCDEFGH'.slice(0, raw.numberOfOptions || 4).split('');
    const passages = raw.passages || {};
    const sections = [];
    const questions = [];
    const problems = [];

    (raw.sections || []).forEach((section, sectionIndex) => {
        const start = questions.length;
        (section.questions || []).forEach(q => {
            const number = questions.length + 1;
            if (!Array.isArray(q.options) || q.options.length !== letters.length) {
                problems.push(`Pregunta ${number}: tiene ${q.options ? q.options.length : 0} opciones, se esperaban ${letters.length}.`);
            }
            if (!letters.includes(q.answer)) {
                problems.push(`Pregunta ${number}: la respuesta "${q.answer}" no es una opción válida.`);
            }
            if (q.passage && !passages[q.passage]) {
                problems.push(`Pregunta ${number}: la lectura "${q.passage}" no existe.`);
            }
            questions.push(Object.assign({}, q, { number, sectionIndex }));
        });
        sections.push({ title: section.title, subject: section.subject || null, start, end: questions.length - 1, count: questions.length - start });
    });

    if (!questions.length) problems.push('El examen no tiene preguntas.');
    if (problems.length) throw new ExamError('El examen tiene errores:\n' + problems.join('\n'));

    const durationMinutes = Number(raw.durationMinutes) > 0 ? Number(raw.durationMinutes) : 180;
    return { id: raw.id || fallbackId, title: raw.title || 'Examen', category: raw.category || null, durationMinutes, letters, passages, sections, questions };
}

export function grade(exam, answers) {
    const results = exam.questions.map((q, i) => answers[i] === q.answer);
    const bySection = exam.sections.map(s => ({ title: s.title, correct: 0, total: s.count }));
    results.forEach((ok, i) => {
        if (ok) bySection[exam.questions[i].sectionIndex].correct++;
    });
    return { results, correctCount: results.filter(Boolean).length, bySection };
}
