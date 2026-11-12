import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/data/catalog.js';
import { assess, recommend, defaultAnswers, answerOptions, sourceStatus, validSession, validAnswers, auditProduct, todayKST } from '../src/engine.js';
const day = '2026-11-13';
const answers = (patch = {}) => ({ ...defaultAnswers, ...patch });
const find = id => catalog.find(p => p.id === id);

test('catalog gate: 6 distinct real models, 2 brands, traceable and fresh facts', () => {
  assert.equal(catalog.length, 6);
  assert.equal(new Set(catalog.map(p => p.id)).size, 6);
  assert.equal(new Set(catalog.map(p => p.brand)).size, 2);
  for (const p of catalog) { assert.deepEqual(auditProduct(p, day), []); assert.ok(Object.values(p.facts).filter(f => f.value !== null).length >= 8); }
});
test('wired input does not confuse a charging port with data', () => {
  const result = recommend(catalog, answers({ connection: 'wired' }), day);
  assert.deepEqual(result.matches.map(r => r.product.id), ['keychron-b1-pro','keychron-b6-pro','keychron-v1-max']);
  assert.ok(result.excluded.some(r => r.product.id === 'mx-keys-s'));
});
test('full-size and multiple devices excludes one-device K650', () => {
  const result = recommend(catalog, answers({ numpad: 'yes', devices: 'multi', connection: 'bluetooth' }), day);
  assert.deepEqual(result.matches.map(r => r.product.id), ['keychron-b6-pro','mx-keys-s']);
});
test('unknown iPadOS support is not invented and is not labeled incompatible', () => {
  const result = recommend(catalog, answers({ os: 'ipados', connection: 'bluetooth' }), day);
  assert.equal(result.matches.length, 3); assert.equal(result.unknown.length, 3);
});
test('iPadOS + USB receiver is never recommended on generic OS support alone', () => {
  assert.equal(recommend(catalog, answers({ os: 'ipados', connection: 'receiver' }), day).matches.length, 0);
});
test('multidevice switching does not silently assume Bluetooth when wired is required', () => {
  assert.equal(recommend(catalog, answers({ devices: 'multi', connection: 'wired' }), day).matches.length, 0);
});
test('strict noise request returns unknown, never a quiet marketing claim', () => {
  const result = recommend(catalog, answers({ noise: 'strict' }), day);
  assert.equal(result.matches.length, 0); assert.equal(result.unknown.length, 6);
});
test('strict budget never uses an invented KRW price', () => {
  const result = recommend(catalog, answers({ budget: '50000' }), day);
  assert.equal(result.matches.length, 0); assert.equal(result.unknown.length, 6);
});
test('optional compact priority is explained and ordered by verified width', () => {
  const result = recommend(catalog, answers({ numpad: 'no', priority: 'compact' }), day);
  assert.deepEqual(result.matches.map(r => r.product.id), ['pebble-k380s','keychron-b1-pro','keychron-v1-max']);
  assert.ok(result.matches.every(r => r.reasons.some(x => x.field === 'width')));
});
test('optional preference never overrides mandatory layout', () => {
  assert.ok(recommend(catalog, answers({ numpad: 'yes', priority: 'compact' }), day).matches.every(r => r.product.facts.numpad.value === true));
});
test('unknown facts fail closed', () => {
  const p = structuredClone(find('keychron-b1-pro'));
  p.facts.connections = { value: null, source: null, note: 'unconfirmed' };
  assert.equal(assess(p, answers({ connection: 'wired' }), day).status, 'unknown');
});
test('missing source, stale, future and invalid date cannot enter recommendations', () => {
  for (const change of [p => p.facts.width.source = 'missing', p => p.sources[0].checkedAt = '2026-01-01', p => p.sources[0].checkedAt = '2026-11-14', p => p.sources[0].checkedAt = '2026-02-30']) {
    const p = structuredClone(catalog[0]); change(p);
    assert.equal(assess(p, answers(), day).status, 'unknown');
  }
});
test('90-day freshness boundary is exact', () => {
  const s = { ...catalog[0].sources[0], checkedAt: '2026-11-13' };
  assert.equal(sourceStatus(s, '2027-02-11'), 'fresh');
  assert.equal(sourceStatus(s, '2027-02-12'), 'stale');
});
test('unsafe source URLs fail validation', () => {
  for (const url of ['javascript:alert(1)', 'https://www.logitech.com.evil.example/x', 'http://www.logitech.com/x']) {
    assert.equal(sourceStatus({ ...catalog[0].sources[0], url }, day), 'invalid');
  }
});
test('receiver cost is visible', () => {
  assert.match(assess(catalog[0], answers({ connection: 'receiver' }), day).warnings[0], /별매/);
});
test('invalid / hostile stored input cannot become active answers', () => {
  assert.equal(validAnswers({ ...defaultAnswers, os: '<script>' }), false);
  assert.equal(validAnswers({ ...defaultAnswers, unexpected: '<script>' }), false);
  assert.equal(validSession({ version: 1, answers: defaultAnswers, step: 9, finished: true }), false);
  assert.equal(validSession({ version: 1, answers: defaultAnswers, step: 0, finished: false }), true);
  assert.throws(() => recommend(catalog, {}, day), TypeError);
});
test('KST date respects midnight in Korea', () => assert.equal(todayKST(new Date('2026-11-12T15:01:00Z')), '2026-11-13'));
test('recommendation is deterministic and does not mutate inputs', () => {
  const before = JSON.stringify(catalog); const a = answers();
  assert.deepEqual(recommend(catalog,a,day),recommend(catalog,a,day)); assert.equal(JSON.stringify(catalog),before);
});
test('invalid types, impossible numeric values and malformed support lists are rejected', () => {
  for (const [field, value] of [['width', -1], ['weight', NaN], ['numpad', 'true'], ['connections', ['telepathy']], ['os', []]]) {
    const p = structuredClone(catalog[0]); p.facts[field].value = value;
    assert.ok(auditProduct(p, day).length > 0);
    assert.equal(assess(p, answers(), day).status, 'unknown');
  }
});
test('all 2304 supported answer combinations preserve mandatory-condition invariants', () => {
  let cases = [{}];
  for (const [key, values] of Object.entries(answerOptions)) cases = cases.flatMap(a => values.map(v => ({...a,[key]:v})));
  assert.equal(cases.length, 2304);
  for(const a of cases) for(const r of recommend(catalog,a,day).matches) {
    const f=r.product.facts;
    assert.ok(f.os.value.includes(a.os));
    assert.ok(a.connection==='any'||f.connections.value.includes(a.connection));
    assert.ok(a.numpad==='any'||f.numpad.value===(a.numpad==='yes'));
    assert.ok(a.devices!=='multi'||f.multiDevice.value);
    assert.equal(a.noise,'normal'); assert.equal(a.budget,'none');
    assert.ok(r.reasons.every(reason => f[reason.field].source));
  }
});
