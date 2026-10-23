#!/usr/bin/env node
// Encrypts an exam so only people with the password can read it.
//
//   node tools/encrypt-exam.mjs exams-private/<exam-id>.json [--password "..."]
//
// - Checks the exam (same validation as the quiz page).
// - Embeds its images (exams/<exam-id>/*.png next to the source file) so they are encrypted too.
// - Writes interactive/exams/<exam-id>.enc.json and marks the exam as protected in interactive/exams/index.json.
//
// Keep the readable source (exams-private/) out of git: anyone with it can read the exam and answers.
// Needs Node 18 or newer, no packages.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as crypto } from 'node:crypto';
import readline from 'node:readline';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = join(ROOT, 'interactive');
const ITERATIONS = 600000;
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

const { normalizeExam, ENCRYPTED_FORMAT } = await import(join(ENGINE, 'js', 'exam.js'));

function fail(msg) { console.error('Error: ' + msg); process.exit(1); }

function ask(question, hidden) {
    return new Promise(res => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        if (hidden) rl._writeToOutput = s => { if (s.includes(question)) rl.output.write(s); };
        rl.question(question, answer => { rl.close(); if (hidden) process.stdout.write('\n'); res(answer); });
    });
}

const args = process.argv.slice(2);
const source = args.find(a => !a.startsWith('--'));
const pwIndex = args.indexOf('--password');
if (!source) fail('indica el archivo del examen, por ejemplo: node tools/encrypt-exam.mjs exams-private/mi-examen.json');
const sourcePath = resolve(source);
if (relative(ENGINE, sourcePath).split(/[\\/]/)[0] !== '..') {
    console.warn('Aviso: el archivo fuente está dentro de interactive/, que es público. Muévelo a exams-private/.');
}

const raw = JSON.parse(await readFile(sourcePath, 'utf8'));
let exam;
try { exam = normalizeExam(raw, raw.id); } catch (e) { fail(e.message); }
if (!raw.id || !/^[a-z0-9-]+$/.test(raw.id)) fail('el examen necesita un "id" con minúsculas, números y guiones.');

// Embed images referenced as exams/<id>/<file> (paths relative to /interactive/).
let text = JSON.stringify(raw);
const missing = [];
const refs = [...new Set(text.match(/exams\/[a-z0-9-]+\/[A-Za-z0-9._-]+\.(?:png|jpe?g|gif|svg|webp)/g) || [])];
for (const ref of refs) {
    const file = join(dirname(sourcePath), ref.slice('exams/'.length));
    if (!existsSync(file)) { missing.push(ref); continue; }
    const uri = 'data:' + MIME[extname(file).toLowerCase()] + ';base64,' + (await readFile(file)).toString('base64');
    text = text.split(ref).join(uri);
}
if (missing.length) fail('faltan imágenes junto al archivo fuente:\n  ' + missing.join('\n  '));

let password = pwIndex >= 0 ? args[pwIndex + 1] : null;
if (!password) {
    password = await ask('Contraseña para "' + raw.title + '": ', true);
    const again = await ask('Repite la contraseña: ', true);
    if (password !== again) fail('las contraseñas no coinciden.');
}
if (!password) fail('la contraseña está vacía.');
if (password.length < 12) console.warn('Aviso: una contraseña corta se puede adivinar. Usa al menos 12 caracteres (por ejemplo, cuatro palabras).');

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
const b64 = bytes => Buffer.from(bytes).toString('base64');

const out = {
    format: ENCRYPTED_FORMAT,
    meta: { id: raw.id, title: raw.title, category: raw.category || null, questionCount: exam.questions.length },
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: b64(salt) },
    cipher: { name: 'AES-GCM', iv: b64(iv), data: b64(data) }
};
const outPath = join(ENGINE, 'exams', raw.id + '.enc.json');
await writeFile(outPath, JSON.stringify(out) + '\n');

// Keep the catalog in sync: question count and the lock marker.
const indexPath = join(ENGINE, 'exams', 'index.json');
const index = JSON.parse(await readFile(indexPath, 'utf8'));
const entry = index.exams.find(e => e.id === raw.id);
if (entry) {
    entry.questionCount = exam.questions.length;
    entry.protected = true;
    await writeFile(indexPath, JSON.stringify(index, null, 2) + '\n');
} else {
    console.warn('Aviso: "' + raw.id + '" no está en interactive/exams/index.json; agrégalo para que aparezca en el catálogo.');
}

const plainCopy = join(ENGINE, 'exams', raw.id + '.json');
console.log('Listo: ' + relative(ROOT, outPath) + ' (' + exam.questions.length + ' preguntas, ' + refs.length + ' imágenes, ' + Math.round(out.cipher.data.length / 1024) + ' KB)');
if (existsSync(plainCopy)) console.warn('Aviso: todavía existe ' + relative(ROOT, plainCopy) + ' sin cifrar. Bórralo antes de publicar.');
