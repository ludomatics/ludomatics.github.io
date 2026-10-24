// Backup and restore of everything this device remembers (personal mode): profile, history and exams in progress.
// Saved exam passwords are left out on purpose: anyone with the file could otherwise open those exams.
import { allEntries, replaceAll } from './storage.js';
import { LEVELS } from './profile.js';

export const BACKUP_FORMAT = 'ludomatics-backup-v1';
const isPassword = name => name.startsWith('password.');

export function buildBackup() {
    const data = {};
    Object.entries(allEntries()).forEach(([name, value]) => { if (!isPassword(name)) data[name] = value; });
    return { format: BACKUP_FORMAT, exportedAt: new Date().toISOString(), data };
}

export function backupFilename(profile) {
    const slug = String((profile && profile.name) || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const day = new Date().toISOString().slice(0, 10);
    return ['ludomatics-respaldo', slug, day].filter(Boolean).join('-') + '.json';
}

export class BackupError extends Error {}

// Reads a backup file's text. Returns { backup, summary } or throws BackupError with a message for the student.
export function parseBackup(text) {
    let backup;
    try { backup = JSON.parse(text); } catch (e) { throw new BackupError('Ese archivo no es un respaldo de Ludomatics.'); }
    if (!backup || backup.format !== BACKUP_FORMAT || !backup.data || typeof backup.data !== 'object') {
        throw new BackupError('Ese archivo no es un respaldo de Ludomatics.');
    }
    const { data } = backup;
    const profile = data.profile;
    if (!profile || !LEVELS[profile.level] || !profile.name) {
        throw new BackupError('El respaldo está incompleto: no tiene un perfil válido.');
    }
    const history = Array.isArray(data.history) ? data.history : [];
    const inProgress = Object.keys(data).filter(k => k.startsWith('quiz.') && data[k] && !data[k].finishedAt).length;
    return {
        backup,
        summary: {
            name: profile.name,
            level: LEVELS[profile.level].label,
            results: history.length,
            inProgress,
            exportedAt: backup.exportedAt ? new Date(backup.exportedAt) : null
        }
    };
}

// Replaces this device's data with the backup. Passwords already saved on this device are kept.
export function applyBackup(backup) {
    const entries = {};
    Object.entries(backup.data).forEach(([name, value]) => { if (!isPassword(name)) entries[name] = value; });
    return replaceAll(entries, isPassword);
}
