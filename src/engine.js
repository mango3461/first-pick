/** @import { Answers, Product, Source, Assessment, Session } from './types' */
export const MAX_SOURCE_AGE_DAYS = 90;
/** @type {Answers} */
export const defaultAnswers = { os: 'windows', connection: 'any', numpad: 'any', devices: 'one', priority: 'balanced', noise: 'normal', budget: 'none' };
/** @type {Record<keyof Answers, readonly string[]>} */
export const answerOptions = {
  os: ['windows', 'macos', 'ipados'], connection: ['any', 'bluetooth', 'receiver', 'wired'],
  numpad: ['any', 'yes', 'no'], devices: ['one', 'multi'],
  priority: ['compact', 'rechargeable', 'low', 'balanced'], noise: ['normal', 'strict'], budget: ['none', '50000', '100000', '200000'],
};

/** @param {Date} [now] */
export function todayKST(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
/** @param {unknown} value @returns {value is Answers} */
export function validAnswers(value) {
  if (!value || typeof value !== 'object') return false;
  const record = /** @type {Record<string, unknown>} */ (value);
  if (Object.keys(record).length !== Object.keys(answerOptions).length) return false;
  return Object.entries(answerOptions).every(([key, values]) => typeof record[key] === 'string' && values.includes(/** @type {string} */ (record[key])));
}
/** @param {unknown} value @returns {value is Session} */
export function validSession(value) {
  if (!value || typeof value !== 'object') return false;
  const s = /** @type {Record<string, unknown>} */ (value);
  return s.version === 1 && validAnswers(s.answers) && Number.isInteger(s.step) && Number(s.step) >= 0 && Number(s.step) <= 4 && typeof s.finished === 'boolean';
}
/** @param {string} day */
function validDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const time = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === day;
}
/** @param {Source} s @param {string} today */
export function sourceStatus(s, today) {
  if (!validDay(s.checkedAt) || !validDay(today)) return 'invalid';
  let url;
  try { url = new URL(s.url); } catch { return 'invalid'; }
  if (url.protocol !== 'https:' || !['www.logitech.com', 'www.keychron.com'].includes(url.hostname) || url.username || url.password) return 'invalid';
  const age = (Date.parse(today) - Date.parse(s.checkedAt)) / 86400000;
  if (age < 0) return 'future';
  return age > MAX_SOURCE_AGE_DAYS ? 'stale' : 'fresh';
}
/** @param {Product} p @param {string} [today] */
export function auditProduct(p, today = todayKST()) {
  /** @type {string[]} */
  const errors = [];
  if (!p.id || !p.variant || !p.sources.length) errors.push('모델/옵션/출처 누락');
  const ids = p.sources.map(s => s.id);
  if (new Set(ids).size !== ids.length) errors.push('중복 출처 ID');
  for (const s of p.sources) if (sourceStatus(s, today) !== 'fresh') errors.push(`${s.id}: 출처 재검토 필요 (${sourceStatus(s, today)})`);
  for (const [key, f] of Object.entries(p.facts)) {
    if (f.value !== null && (!f.source || !ids.includes(f.source))) errors.push(`${key}: 근거 없는 값`);
    if (!f.note.trim()) errors.push(`${key}: 확인 메모 누락`);
    if (f.value === null) continue;
    if (['numpad', 'multiDevice', 'receiverIncluded', 'backlight'].includes(key) && typeof f.value !== 'boolean') errors.push(`${key}: boolean 필요`);
    if (['width', 'weight', 'priceKrw', 'noiseDb'].includes(key) && (typeof f.value !== 'number' || !Number.isFinite(f.value) || f.value <= 0)) errors.push(`${key}: 양의 유한 수 필요`);
    if (key === 'power' && !['battery', 'rechargeable'].includes(String(f.value))) errors.push(`${key}: 잘못된 전원 분류`);
    if (key === 'profile' && !['low', 'standard'].includes(String(f.value))) errors.push(`${key}: 잘못된 높이 분류`);
    if (key === 'mechanism' && (typeof f.value !== 'string' || !f.value.trim())) errors.push(`${key}: 구조 설명 필요`);
    if (key === 'connections' || key === 'os') {
      const allowed = key === 'connections' ? ['bluetooth', 'receiver', 'wired'] : ['windows', 'macos', 'ipados'];
      if (!Array.isArray(f.value) || !f.value.length || f.value.some(v => !allowed.includes(v)) || new Set(f.value).size !== f.value.length) errors.push(`${key}: 잘못된 지원 목록`);
    }
  }
  return errors;
}
/** @param {Product} product @param {Answers} answers @param {string} [today] @returns {Assessment} */
export function assess(product, answers, today = todayKST()) {
  if (!validAnswers(answers)) throw new TypeError('유효하지 않은 구매 조건입니다.');
  const f = product.facts;
  /** @type {Assessment} */
  const result = { product, status: 'match', score: 0, reasons: [], blockers: [], warnings: [...product.caveats] };
  const invalid = auditProduct(product, today);
  if (invalid.length) return { ...result, status: 'unknown', blockers: invalid };
  /** @param {boolean | null} pass @param {string} yes @param {string} no @param {keyof Product['facts']} field */
  function requirement(pass, yes, no, field) {
    if (pass === true) result.reasons.push({ text: yes, field });
    else {
      result.blockers.push(pass === null ? `${no} (미확인)` : no);
      if (pass === false) result.status = 'excluded';
      else if (result.status !== 'excluded') result.status = 'unknown';
    }
  }
  requirement(f.os.value?.includes(answers.os) ? true : null, '선택한 운영체제의 기본 입력 지원', '선택한 운영체제 호환을 확인할 수 없음', 'os');
  if (answers.connection !== 'any') {
    requirement(f.connections.value?.includes(answers.connection) ?? null, '선택한 연결 방식 지원', '요청한 연결 방식이 지원 목록에 없음', 'connections');
    if (answers.connection === 'receiver' && f.receiverIncluded.value !== true) result.warnings.unshift(f.receiverIncluded.value === false ? '수신기는 별매입니다. 추가 비용이 듭니다.' : '수신기 포함 여부는 확인되지 않았습니다.');
    if (answers.connection !== 'bluetooth' && answers.os === 'ipados') requirement(null, '', 'iPadOS에서 이 연결 방식의 동작/어댑터 호환', 'connections');
  }
  if (answers.numpad !== 'any') requirement(f.numpad.value === null ? null : f.numpad.value === (answers.numpad === 'yes'), answers.numpad === 'yes' ? '숫자패드가 있는 배열' : '숫자패드 없는 배열', '숫자패드 조건 불일치', 'numpad');
  if (answers.devices === 'multi') {
    requirement(f.multiDevice.value, '페어링한 여러 기기를 전환 가능', '여러 기기 전환 조건 불충족', 'multiDevice');
    if (answers.connection === 'wired') requirement(null, '', 'USB 유선 연결만으로 여러 기기를 전환할 수 있는지', 'multiDevice');
    if (answers.connection === 'receiver') requirement(null, '', '수신기 연결만으로 여러 기기를 전환할 수 있는지', 'multiDevice');
  }
  if (answers.noise === 'strict') requirement(null, '', '조용한 공간 적합성을 판단할 동일 조건 실측 소음 자료 없음', 'noiseDb');
  if (answers.budget !== 'none') requirement(null, '', `${Number(answers.budget).toLocaleString('ko-KR')}원 이내 총 구매가를 확인할 수 없음`, 'priceKrw');
  if (answers.priority === 'compact' && f.width.value !== null && f.width.value <= 330) {
    result.score = 1; result.reasons.push({ text: `가로 ${f.width.value} mm: 작은 책상 선호에 부합`, field: 'width' });
  }
  if (answers.priority === 'rechargeable' && f.power.value === 'rechargeable') {
    result.score = 1; result.reasons.push({ text: '건전지 교체 대신 충전식 전원', field: 'power' });
  }
  if (answers.priority === 'low' && f.profile.value === 'low') {
    result.score = 1; result.reasons.push({ text: '낮은 키 높이를 선호하는 조건에 부합', field: 'profile' });
  }
  result.warnings.push('국내 가격·재고·실측 소음은 미확인입니다. 구매 전 확인이 필요합니다.');
  return result;
}
/** @param {Product[]} products @param {Answers} answers @param {string} [today] */
export function recommend(products, answers, today = todayKST()) {
  const assessed = products.map(p => assess(p, answers, today));
  const matches = assessed.filter(r => r.status === 'match').sort((a, b) =>
    b.score - a.score || (answers.priority === 'compact' ? (a.product.facts.width.value ?? Infinity) - (b.product.facts.width.value ?? Infinity) : 0) || a.product.id.localeCompare(b.product.id));
  return { matches, excluded: assessed.filter(r => r.status === 'excluded'), unknown: assessed.filter(r => r.status === 'unknown') };
}
