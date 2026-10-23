// Loads an exam JSON file and turns it into a flat, numbered list of questions.

export async function fetchExam(id) {
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
        throw new ExamError('No se indicó un examen válido.');
    }
    let response;
    try {
        response = await fetch(`exams/${id}.json`, { cache: 'no-cache' });
    } catch (e) {
        throw new ExamError('No se pudo cargar el examen. Revisa tu conexión e intenta de nuevo.');
    }
    if (!response.ok) {
        throw new ExamError('No encontramos ese examen.');
    }
    return normalizeExam(await response.json(), id);
}

export class ExamError extends Error {}

// Input: { id, title, numberOfOptions, sections: [{ title, questions: [{ text, options[], answer, image? }] }] }
// Output: { id, title, letters, sections: [{ title, start, end, count }], questions: [{ ..., number, sectionIndex }] }
export function normalizeExam(raw, fallbackId) {
    const letters = 'ABCDEFGH'.slice(0, raw.numberOfOptions || 4).split('');
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
            questions.push(Object.assign({}, q, { number, sectionIndex }));
        });
        sections.push({ title: section.title, start, end: questions.length - 1, count: questions.length - start });
    });

    if (!questions.length) problems.push('El examen no tiene preguntas.');
    if (problems.length) throw new ExamError('El examen tiene errores:\n' + problems.join('\n'));

    return { id: raw.id || fallbackId, title: raw.title || 'Examen', letters, sections, questions };
}

export function grade(exam, answers) {
    const results = exam.questions.map((q, i) => answers[i] === q.answer);
    const bySection = exam.sections.map(s => ({ title: s.title, correct: 0, total: s.count }));
    results.forEach((ok, i) => {
        if (ok) bySection[exam.questions[i].sectionIndex].correct++;
    });
    return { results, correctCount: results.filter(Boolean).length, bySection };
}
