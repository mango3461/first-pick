import { validSession } from './engine.js';
/** @import { Session } from './types' */
export const SESSION_KEY = 'first-pick:session:v1';
export const FEEDBACK_KEY = 'first-pick:feedback:v1';
/** @typedef {{version: 1, date: string, helpful: string, note: string}} Feedback */
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { session: null, message: '' };
    const parsed = JSON.parse(raw);
    if (validSession(parsed)) return { session: parsed, message: '' };
    return { session: null, message: '저장된 조건을 읽을 수 없어 새로 시작합니다.' };
  } catch { return { session: null, message: '이 브라우저의 저장 정보를 읽을 수 없습니다. 현재 화면에서는 계속 사용할 수 있어요.' }; }
}
/** @param {Session} session */
export function saveSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); return true; } catch { return false; }
}
/** @param {Feedback} entry */
export function saveFeedback(entry) {
  try {
    const previous = readFeedback();
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify([...previous, entry].slice(-20)));
    return true;
  } catch { return false; }
}
/** @returns {Feedback[]} */
export function readFeedback() {
  try {
    const value = JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(v => v?.version === 1 && typeof v.date === 'string' && ['yes', 'no', 'unsure'].includes(v.helpful) && typeof v.note === 'string' && v.note.length <= 500).slice(-20);
  } catch { return []; }
}
export function clearLocalData() {
  try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(FEEDBACK_KEY); return true; } catch { return false; }
}
