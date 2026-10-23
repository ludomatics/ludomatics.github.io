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

// data: { examTitle, name, correct, total, bySection: [{title, correct, total}], elapsed, overtime, date }
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

// Saves the image: share sheet on phones (WhatsApp, Fotos…), a normal download elsewhere.
export async function saveScoreCard(canvas, filename, title) {
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('No se pudo crear la imagen.');
    const file = new File([blob], filename, { type: 'image/png' });
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
