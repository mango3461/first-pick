import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', err => errors.get(page).push(err.message));
  await page.clock.setFixedTime(new Date('2026-11-13T03:00:00Z'));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));
async function complete(page, { wired = false, compact = false, strict = false, budget = false } = {}) {
  await page.goto('/#find');
  await page.getByRole('button', { name: '다음으로' }).click();
  if (wired) await page.getByRole('radio', { name: /케이블로 유선 입력/ }).check();
  await page.getByRole('button', { name: '다음으로' }).click();
  if (compact) await page.getByRole('radio', { name: /아니요, 마우스 공간/ }).check();
  await page.getByRole('button', { name: '다음으로' }).click();
  if (compact) await page.getByRole('radio', { name: /작은 책상에/ }).check();
  await page.getByRole('button', { name: '다음으로' }).click();
  if (strict) await page.getByRole('radio', { name: /실측 저소음 확인/ }).check();
  if (budget) await page.getByRole('radio', { name: /5만 원 이내/ }).check();
  await page.getByRole('button', { name: '조건에 맞는 후보 보기' }).click();
}
async function accessible(page) {
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations.filter(v => ['critical','serious'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
test('learning cards, accessible dialog, native Escape and focus return', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('button', { name: /축 색깔만으로/ });
  await card.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('리니어 = 무소음은 아니에요');
  await accessible(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(card).toBeFocused();
  await noOverflow(page);
});
test('wired flow, evidence, compare and real checklist download', async ({ page }) => {
  await complete(page, { wired: true });
  await expect(page.locator('.product-card')).toHaveCount(3);
  await expect(page.locator('.product-grid')).not.toContainText('MX Keys S');
  await expect(page.locator('.result-notice')).toContainText('국내 가격');
  await page.locator('[data-compare]').nth(0).check();
  await page.locator('[data-compare]').nth(1).check();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('USB 유선 입력');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '내 구매 체크리스트 저장' }).click();
  const file = await pending;
  expect(file.suggestedFilename()).toBe('first-pick-checklist-2026-11-13.txt');
  const content = await readFile(await file.path(), 'utf8');
  expect(content).toContain('B1 Pro'); expect(content).toContain('공식 사양');
  expect(content).toContain('국내 가격'); expect(content).not.toContain('V1 Max');
  await accessible(page); await noOverflow(page);
});
test('three-item compare limit and full list expansion', async ({ page }) => {
  await complete(page);
  await page.getByRole('button', { name: '나머지 일치 후보도 보기' }).click();
  await expect(page.locator('.product-card')).toHaveCount(6);
  for(let i=0;i<3;i++) await page.locator('[data-compare]').nth(i).check();
  await page.locator('[data-compare]').nth(3).click();
  await expect(page.locator('[data-compare]').nth(3)).not.toBeChecked();
  await expect(page.locator('#notice')).toContainText('최대 3개');
  await expect(page.locator('thead th')).toHaveCount(4);
  await page.getByRole('button', { name: '비교 비우기' }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
});
test('strict noise and budget produce honest empty result and recover by editing', async ({ page }) => {
  await complete(page, { strict: true, budget: true });
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('추천을 보류');
  await page.locator('.exclusions summary').click();
  await expect(page.locator('.exclusions')).toContainText('50,000원');
  await expect(page.locator('.exclusions')).toContainText('실측 소음');
  await accessible(page); await noOverflow(page);
  await page.getByRole('button', { name: '조건 수정' }).click();
  for(let i=0;i<4;i++) await page.getByRole('button', { name: '다음으로' }).click();
  await page.getByRole('radio', { name: /소음은 구매 전에/ }).check();
  await page.getByRole('radio', { name: /가격은 판매처에서/ }).check();
  await page.getByRole('button', { name: '조건에 맞는 후보 보기' }).click();
  await expect(page.locator('.product-card')).toHaveCount(3);
});
test('refresh restores valid selection and previous step preserves it', async ({ page }) => {
  await page.goto('/#find');
  await page.getByRole('radio', { name: /^Mac / }).check();
  await page.getByRole('button', { name: '다음으로' }).click();
  await page.getByRole('radio', { name: /케이블로 유선 입력/ }).check();
  await page.reload();
  await expect(page.getByRole('radio', { name: /케이블로 유선 입력/ })).toBeChecked();
  await page.getByRole('button', { name: '이전', exact: true }).click();
  await expect(page.getByRole('radio', { name: /^Mac / })).toBeChecked();
});
test('corrupt saved session and blocked storage are recoverable', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('first-pick:session:v1', '{invalid json'));
  await page.goto('/#find');
  await expect(page.locator('#notice')).toContainText('저장 정보를 읽을 수 없습니다');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('어떤 기기');
  await page.evaluate(() => Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new DOMException('blocked', 'SecurityError'); } }));
  await page.getByRole('button', { name: '다음으로' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('연결');
  await expect(page.locator('#notice')).toContainText('저장을 사용할 수 없습니다');
});
test('local feedback exports without network and can be removed', async ({ page }) => {
  const external = [];
  page.on('request', request => { if(!request.url().startsWith('http://127.0.0.1:4173')) external.push(request.url()); });
  await complete(page, { compact: true });
  await expect(page.locator('.product-card').first()).toContainText('K380s');
  await page.getByRole('radio', { name: '도움이 됐어요', exact: true }).check();
  await page.getByRole('textbox').fill('자동 테스트용 응답 — 실제 사용자 의견 아님 <script>alert(1)</script>');
  await page.getByRole('button', { name: '이 기기에 응답 저장' }).click();
  await expect(page.locator('#feedback-status')).toContainText('개발자에게 전달되지 않습니다');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: /저장한 응답 내보내기/ }).click();
  const file = await pending;
  const content = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(content.entries[0].note).toContain('실제 사용자 의견 아님');
  expect(external).toEqual([]);
  await page.getByRole('button', { name: '내 기기 저장 정보 삭제', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('first-pick:feedback:v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('first-pick:session:v1'))).toBeNull();
});
test('all key screens are accessible, fit viewport, and have no runtime errors', async ({ page }, info) => {
  await page.goto('/'); await accessible(page); await noOverflow(page);
  await page.screenshot({ path:`artifacts/qa/home-${info.project.name}.png`,fullPage:true });
  await page.goto('/#find');
  for(let i=0;i<5;i++) {
    await accessible(page); await noOverflow(page);
    if(i===1) await page.screenshot({path:`artifacts/qa/wizard-${info.project.name}.png`,fullPage:true});
    if(i<4) await page.getByRole('button',{name:'다음으로'}).click();
  }
  await page.getByRole('button',{name:'조건에 맞는 후보 보기'}).click();
  await accessible(page); await noOverflow(page);
  await page.screenshot({path:`artifacts/qa/results-${info.project.name}.png`,fullPage:true});
  await page.goto('/#data');
  await page.locator('.source-register summary').first().click();
  await accessible(page); await noOverflow(page);
  await page.goto('/#guide'); await accessible(page); await noOverflow(page);
});
test('keyboard-only wizard uses native radios and a focused question title', async ({ page }) => {
  await page.goto('/#find');
  await expect(page.getByRole('heading',{level:1})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio',{name:/Windows PC/})).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio',{name:/^Mac /})).toBeChecked();
  // radio group -> learn button -> disabled previous is skipped -> next
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'다음으로'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{level:1})).toContainText('연결');
});
test('expired catalog never appears as recommended after the review window', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-02-13T03:00:00Z'));
  await complete(page);
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.locator('.exclusions summary').click();
  await expect(page.locator('.exclusions')).toContainText('재검토 필요');
});
test('skip link preserves the current route and the following wizard action works', async ({ page }) => {
  await page.goto('/#find');
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page).toHaveURL(/#find$/);
  await page.getByRole('button',{name:'다음으로'}).click();
  await expect(page.getByRole('heading',{level:1})).toContainText('연결');
});
