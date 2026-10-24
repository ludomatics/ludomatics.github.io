// The goal field (number + slider + percentage), shared by onboarding, "Editar perfil" and "Tu progreso".

export function goalFields(value, total) {
    return '<div class="goal-field"><label for="goalNumber">Aciertos</label>' +
        '<div class="goal-inputs"><input id="goalNumber" type="number" inputmode="numeric" min="1" max="' + total + '" value="' + value + '" required>' +
        '<span class="goal-total">de ' + total + '</span></div>' +
        '<input id="goalRange" type="range" min="1" max="' + total + '" value="' + value + '" aria-label="Aciertos">' +
        '<p class="muted small" id="goalPct">' + Math.round((value / total) * 100) + '% de aciertos</p></div>';
}

// Keeps the number, the slider and the percentage in sync (call once per page container).
export function bindGoalSync(root) {
    root.addEventListener('input', e => {
        const num = document.getElementById('goalNumber'), range = document.getElementById('goalRange'), pct = document.getElementById('goalPct');
        if (!num || !range || (e.target !== num && e.target !== range)) return;
        const v = e.target.value;
        if (e.target === num) range.value = v; else num.value = v;
        if (pct) pct.textContent = Math.round((Number(v) / Number(range.max)) * 100) + '% de aciertos';
    });
}

// Reads the goal from the field: { correct, total } or null when the number is out of range.
export function readGoal(total) {
    const n = Math.round(Number(document.getElementById('goalNumber').value));
    return n >= 1 && n <= total ? { correct: n, total } : null;
}
