// Draws a shareable results image (PNG) for a graded attempt, using only <canvas>.
// Portrait 1080 px wide (fits WhatsApp/Instagram previews); height grows with the number of sections.

const C = {
    blue: '#2196f3', blueDark: '#1976d2', blueSoft: '#e3f2fd',
    ink: '#333333', muted: '#666666', faint: '#888888', rule: '#dddddd', bg: '#f5f5f5', card: '#ffffff',
    ok: '#2e7d32', mid: '#f9a825', low: '#c62828'
};
const FONT = 'Arial, Helvetica, sans-serif';
const W = 1080, PAD = 72;

function font(size, weight = 'normal') { return weight + ' ' + size + 'px ' + FONT; }

// Splits text into lines that fit maxWidth (max `limit` lines, last one ellipsized).
function wrap(ctx, text, maxWidth, limit = 2) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxWidth || !line) line = test;
        else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    if (lines.length > limit) {
        lines.length = limit;
        let last = lines[limit - 1];
        while (ctx.measureText(last + '…').width > maxWidth && last.length > 1) last = last.slice(0, -1);
        lines[limit - 1] = last + '…';
    }
    return lines;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

const barColor = pct => (pct >= 70 ? C.ok : pct >= 50 ? C.mid : C.low);

// data: { examTitle, name, correct, total, bySection: [{title, correct, total}], elapsed, overtime, date, goal? }
export function drawScoreCard(data) {
    const rowH = 74;
    const sectionsTop = 760;
    const H = sectionsTop + data.bySection.length * rowH + 150;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';

    // background + header band
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.blue; ctx.fillRect(0, 0, W, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = font(30, 'bold'); ctx.fillText('LUDOMATICS · RESULTADO', PAD, 92);
    ctx.font = font(52, 'bold');
    wrap(ctx, data.examTitle, W - PAD * 2, 2).forEach((l, i) => ctx.fillText(l, PAD, 160 + i * 60));

    // white card
    const cardY = 220;
    ctx.fillStyle = C.card;
    ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
    roundRect(ctx, PAD / 2, cardY, W - PAD, H - cardY - 90, 24); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // name + date
    ctx.fillStyle = C.ink; ctx.font = font(46, 'bold');
    const nameLines = wrap(ctx, data.name || 'Estudiante', W - PAD * 2, 1);
    ctx.fillText(nameLines[0], PAD, cardY + 92);
    ctx.fillStyle = C.muted; ctx.font = font(30);
    ctx.fillText(data.date, PAD, cardY + 140);

    // score
    const pct = data.total ? Math.round((data.correct / data.total) * 100) : 0;
    ctx.fillStyle = C.blue; ctx.font = font(150, 'bold');
    const scoreText = String(data.correct);
    ctx.fillText(scoreText, PAD, cardY + 320);
    const sw = ctx.measureText(scoreText).width;
    ctx.fillStyle = C.muted; ctx.font = font(64, 'bold');
    ctx.fillText('/ ' + data.total, PAD + sw + 20, cardY + 320);
    ctx.fillStyle = C.ink; ctx.font = font(44, 'bold');
    ctx.textAlign = 'right';
    ctx.fillText(pct + '%', W - PAD, cardY + 275);
    ctx.fillStyle = C.muted; ctx.font = font(30);
    ctx.fillText('de aciertos', W - PAD, cardY + 318);
    ctx.textAlign = 'left';

    // time used
    ctx.fillStyle = C.muted; ctx.font = font(30);
    ctx.fillText('Tiempo utilizado: ' + data.elapsed + (data.overtime ? ' (+' + data.overtime + ' después del límite)' : ''), PAD, cardY + 390);

    // goal (optional): { goal, hit, missing }. Only a reached goal is shown; the gap can discourage students.
    if (data.goal && data.goal.hit) {
        ctx.font = font(30, 'bold');
        ctx.fillStyle = C.ok;
        ctx.fillText('✓ Meta alcanzada: ' + data.goal.goal + ' aciertos', PAD, cardY + 440);
    }

    // divider + section rows
    ctx.fillStyle = C.rule; ctx.fillRect(PAD, sectionsTop - 70, W - PAD * 2, 2);
    ctx.fillStyle = C.faint; ctx.font = font(24, 'bold');
    ctx.fillText('POR SECCIÓN', PAD, sectionsTop - 28);
    const labelW = 380, barX = PAD + labelW + 20, barW = W - PAD * 2 - labelW - 200;
    data.bySection.forEach((s, i) => {
        const y = sectionsTop + i * rowH + 30;
        const p = s.total ? Math.round((s.correct / s.total) * 100) : 0;
        ctx.fillStyle = C.ink; ctx.font = font(30);
        ctx.fillText(wrap(ctx, s.title, labelW, 1)[0], PAD, y);
        ctx.fillStyle = C.rule; roundRect(ctx, barX, y - 20, barW, 18, 9); ctx.fill();
        if (p > 0) { ctx.fillStyle = barColor(p); roundRect(ctx, barX, y - 20, Math.max(18, barW * p / 100), 18, 9); ctx.fill(); }
        ctx.fillStyle = C.muted; ctx.font = font(28);
        ctx.textAlign = 'right';
        ctx.fillText(s.correct + ' / ' + s.total, W - PAD, y);
        ctx.textAlign = 'left';
    });

    // footer
    ctx.fillStyle = C.faint; ctx.font = font(26);
    ctx.textAlign = 'center';
    ctx.fillText('ludomatics.github.io', W / 2, H - 38);
    ctx.textAlign = 'left';
    return canvas;
}

// Saves a file: share sheet on phones (WhatsApp, Fotos, Archivos…), a normal download elsewhere.
export async function saveFile(blob, filename, title) {
    const file = new File([blob], filename, { type: blob.type });
    const touch = matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title });
            return 'shared';
        } catch (e) {
            if (e && e.name === 'AbortError') return 'cancelled';
            // Share failed for another reason: fall back to a download.
        }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'downloaded';
}

export async function saveScoreCard(canvas, filename, title) {
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('No se pudo crear la imagen.');
    return saveFile(blob, filename, title);
}

// ---------------- progress image ("Descargar progreso" on the home page) ----------------
// data: { name, level, date,
//         tiles: [{ value, label }] (4),
//         goal: { goal, total, goalPct, latest, best, reached } | null,
//         points: [{ pct, label }] (oldest first), goalPct | null,
//         subjects: [{ name, pct, correct, total, attention }] (weakest first), threshold }
export function drawProgressCard(data) {
    const subjects = data.subjects.slice(0, 10);
    const goalH = data.goal ? 250 : 0;
    const chartTop = 640 + goalH, chartH = 300;
    const subjectsTop = chartTop + chartH + 150;
    const rowH = 74;
    const H = subjectsTop + Math.max(1, subjects.length) * rowH + 150;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // background + header band
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.blue; ctx.fillRect(0, 0, W, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = font(30, 'bold'); ctx.fillText('LUDOMATICS · MI PROGRESO', PAD, 92);
    ctx.font = font(52, 'bold'); ctx.fillText(wrap(ctx, data.name || 'Estudiante', W - PAD * 2, 1)[0], PAD, 160);

    // white card
    const cardY = 220;
    ctx.fillStyle = C.card;
    ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
    roundRect(ctx, PAD / 2, cardY, W - PAD, H - cardY - 90, 24); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    ctx.fillStyle = C.muted; ctx.font = font(30);
    ctx.fillText(data.level + ' · ' + data.date, PAD, cardY + 76);

    // four tiles
    const gap = 24, tileW = (W - PAD * 2 - gap * 3) / 4, tileY = cardY + 116, tileH = 170;
    data.tiles.forEach((t, i) => {
        const x = PAD + i * (tileW + gap);
        ctx.fillStyle = C.blueSoft; roundRect(ctx, x, tileY, tileW, tileH, 16); ctx.fill();
        ctx.fillStyle = C.blue;
        let size = 54;
        do { ctx.font = font(size, 'bold'); size -= 2; } while (ctx.measureText(String(t.value)).width > tileW - 44 && size > 24);
        ctx.fillText(t.value, x + 22, tileY + 78);
        ctx.fillStyle = C.muted; ctx.font = font(24);
        wrap(ctx, t.label, tileW - 44, 2).forEach((l, k) => ctx.fillText(l, x + 22, tileY + 118 + k * 28));
    });

    // goal
    let y = tileY + tileH + 80;
    if (data.goal) {
        const g = data.goal;
        ctx.fillStyle = C.faint; ctx.font = font(24, 'bold'); ctx.fillText('MI META', PAD, y);
        ctx.fillStyle = C.blue; ctx.font = font(64, 'bold'); ctx.fillText(String(g.goal), PAD, y + 72);
        const gw = ctx.measureText(String(g.goal)).width;
        ctx.fillStyle = C.ink; ctx.font = font(32); ctx.fillText('de ' + g.total + ' aciertos (' + Math.round(g.goalPct) + '%)', PAD + gw + 16, y + 72);
        const barY = y + 104, barW = W - PAD * 2;
        ctx.fillStyle = C.rule; roundRect(ctx, PAD, barY, barW, 22, 11); ctx.fill();
        const fill = Math.min(1, g.latest / g.goal);
        if (fill > 0) { ctx.fillStyle = g.reached ? C.ok : C.blue; roundRect(ctx, PAD, barY, Math.max(22, barW * fill), 22, 11); ctx.fill(); }
        ctx.font = font(28); ctx.fillStyle = C.muted;
        ctx.fillText('Último: ' + g.latest + '   ·   Mejor: ' + g.best, PAD, barY + 66);
        if (g.reached) {   // only a reached goal is called out
            ctx.textAlign = 'right'; ctx.font = font(28, 'bold'); ctx.fillStyle = C.ok;
            ctx.fillText('✓ Meta alcanzada', W - PAD, barY + 66);
            ctx.textAlign = 'left';
        }
        y += goalH;
    }

    // results over time (last 12)
    const pts = data.points.slice(-12);
    ctx.fillStyle = C.rule; ctx.fillRect(PAD, chartTop - 70, W - PAD * 2, 2);
    ctx.fillStyle = C.faint; ctx.font = font(24, 'bold'); ctx.fillText('RESULTADOS EN EL TIEMPO', PAD, chartTop - 28);
    const L = PAD + 70, R = W - PAD - 10, T = chartTop + 10, B = chartTop + chartH - 40;
    const cy = p => T + (1 - p / 100) * (B - T);
    const cx = i => (pts.length === 1 ? (L + R) / 2 : L + (i * (R - L)) / (pts.length - 1));
    ctx.font = font(22); ctx.textAlign = 'right';
    [0, 50, 100].forEach(v => {
        ctx.fillStyle = C.rule; ctx.fillRect(L, cy(v), R - L, 2);
        ctx.fillStyle = C.faint; ctx.fillText(v + '%', L - 14, cy(v) + 8);
    });
    ctx.textAlign = 'left';
    if (data.goalPct !== null && data.goalPct !== undefined) {
        ctx.strokeStyle = C.ok; ctx.lineWidth = 3; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.moveTo(L, cy(data.goalPct)); ctx.lineTo(R, cy(data.goalPct)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.ok; ctx.font = font(22, 'bold'); ctx.fillText('Meta ' + Math.round(data.goalPct) + '%', L + 10, cy(data.goalPct) - 10);
    }
    if (pts.length > 1) {
        ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.lineJoin = 'round';
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(cx(i), cy(p.pct)) : ctx.moveTo(cx(i), cy(p.pct)))); ctx.stroke();
    }
    pts.forEach((p, i) => {
        const hit = data.goalPct !== null && data.goalPct !== undefined && p.pct >= data.goalPct - 1e-9;
        ctx.beginPath(); ctx.arc(cx(i), cy(p.pct), 10, 0, Math.PI * 2);
        ctx.fillStyle = hit ? C.ok : C.card; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = hit ? C.ok : C.blue; ctx.stroke();
    });
    ctx.fillStyle = C.faint; ctx.font = font(22);
    const ends = pts.length === 1 ? [0] : [0, pts.length - 1];
    ends.forEach(i => {
        ctx.textAlign = pts.length === 1 ? 'center' : i === 0 ? 'left' : 'right';
        ctx.fillText(pts[i].label, pts.length === 1 ? cx(i) : i === 0 ? L - 10 : R + 10, B + 40);
    });
    ctx.textAlign = 'left';

    // subjects, weakest first
    ctx.fillStyle = C.rule; ctx.fillRect(PAD, subjectsTop - 70, W - PAD * 2, 2);
    ctx.fillStyle = C.faint; ctx.font = font(24, 'bold'); ctx.fillText('POR MATERIA', PAD, subjectsTop - 28);
    const labelW = 340, barX = PAD + labelW + 20, barW = W - PAD * 2 - labelW - 150;
    subjects.forEach((s, i) => {
        const ry = subjectsTop + i * rowH + 30;
        ctx.fillStyle = s.attention ? C.low : C.ink; ctx.font = font(30, s.attention ? 'bold' : 'normal');
        ctx.fillText(wrap(ctx, s.name, labelW, 1)[0], PAD, ry);
        ctx.fillStyle = C.rule; roundRect(ctx, barX, ry - 20, barW, 18, 9); ctx.fill();
        const color = s.pct >= data.threshold ? C.ok : s.attention ? C.low : C.mid;
        if (s.pct > 0) { ctx.fillStyle = color; roundRect(ctx, barX, ry - 20, Math.max(18, barW * s.pct / 100), 18, 9); ctx.fill(); }
        ctx.fillStyle = C.ink; ctx.fillRect(barX + barW * data.threshold / 100 - 1, ry - 28, 3, 34);
        ctx.fillStyle = s.attention ? C.low : C.muted; ctx.font = font(28, 'bold');
        ctx.textAlign = 'right'; ctx.fillText(Math.round(s.pct) + '%', W - PAD, ry); ctx.textAlign = 'left';
    });
    if (!subjects.length) { ctx.fillStyle = C.muted; ctx.font = font(28); ctx.fillText('Aún no hay materias con resultados.', PAD, subjectsTop + 30); }

    // footer
    ctx.fillStyle = C.faint; ctx.font = font(26);
    ctx.textAlign = 'center';
    ctx.fillText('ludomatics.github.io', W / 2, H - 38);
    ctx.textAlign = 'left';
    return canvas;
}
