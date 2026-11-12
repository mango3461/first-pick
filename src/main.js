import './style.css';
import { catalog } from './data/catalog.js';
import { defaultAnswers, recommend, todayKST, sourceStatus, answerOptions } from './engine.js';
import { labels, steps, guides } from './content.js';
import { loadSession, saveSession, saveFeedback, readFeedback, clearLocalData } from './storage.js';
import { escape as e, icon, keyboard, externalLink } from './ui.js';
/** @import { Answers, Product, Assessment, Session } from './types' */

const loaded = loadSession();
/** @type {Session} */
let session = loaded.session ?? { version: 1, answers: { ...defaultAnswers }, step: 0, finished: false };
let hasProgress = Boolean(loaded.session);
let showAll = false;
let notice = loaded.message;
/** @type {Set<string>} */
const compared = new Set();
const app = /** @type {HTMLElement} */ (document.querySelector('#app'));
app.innerHTML = `<header class="site-header"><div class="container header-inner">
  <a class="brand" href="#home" aria-label="첫픽 홈"><span class="brand-mark">${icon('check', 24)}</span><span>첫픽<span class="brand-en">first pick</span></span></a>
  <nav aria-label="주 메뉴"><a href="#guide" data-nav="guide">구매 전 알아보기</a><a href="#data" data-nav="data">데이터와 원칙</a></nav>
  <a class="header-cta" href="#find">내 조건 찾기 ${icon('arrow', 16)}</a>
  </div></header>
  <div id="notice" class="notice container" role="status" aria-live="polite" hidden></div>
  <main id="main" class="container" tabindex="-1"></main>
  <footer class="site-footer container"><a class="brand footer-brand" href="#home">첫픽<span class="brand-en">first pick</span></a><p>이해하고, 나에게 맞게 고르기.<br><span>사무·학습용 키보드 · 초기 버전</span></p><div><a href="#data">출처와 한계</a><button class="text-button" data-action="clear">내 기기 저장 정보 삭제</button><small>계정 없이 이용 · 외부 분석 도구 없음</small></div></footer>
  <dialog id="guide-dialog" aria-labelledby="dialog-title"></dialog>`;
const main = /** @type {HTMLElement} */ (document.querySelector('#main'));
const dialog = /** @type {HTMLDialogElement} */ (document.querySelector('#guide-dialog'));
/** @type {HTMLElement | null} */
let dialogOpener = null;

function persist() {
  hasProgress = true;
  if (!saveSession(session)) setNotice('브라우저 저장을 사용할 수 없습니다. 지금은 계속 사용할 수 있지만 새로고침하면 조건이 사라질 수 있어요.');
}
/** @param {string} message */
function setNotice(message) {
  notice = message;
  const el = /** @type {HTMLElement} */ (document.querySelector('#notice'));
  el.textContent = notice; el.hidden = !notice;
}
/** @param {string} route */
function navigate(route) {
  if (location.hash === `#${route}`) render(); else location.hash = route;
}
function titleFocus() {
  const title = main.querySelector('h1');
  title?.setAttribute('tabindex', '-1');
  title?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
/** @param {Product} p @param {keyof Product['facts']} key */
function factText(p, key) {
  const v = p.facts[key].value;
  if (v === null) return '미확인';
  if (key === 'connections') return /** @type {string[]} */ (v).map(x => labels.connection[x]).join(' · ');
  if (key === 'os') return /** @type {string[]} */ (v).map(x => labels.os[x]).join(' · ');
  if (key === 'width') return `${v} mm`;
  if (key === 'weight') return `${v} g`;
  if (key === 'power') return v === 'battery' ? '교체형 건전지' : '충전식';
  if (key === 'profile') return v === 'low' ? '낮은 키 높이' : '일반 키 높이';
  if (key === 'receiverIncluded') return v ? '포함' : '별매';
  if (typeof v === 'boolean') return v ? '있음' : '없음';
  return String(v);
}
/** @param {Product} p @param {keyof Product['facts']} key */
function evidenceLink(p, key) {
  const s = p.sources.find(s => s.id === p.facts[key].source);
  return s ? externalLink('근거', s.url) : '<span class="muted">미확인</span>';
}

function home() {
  return `<section class="hero">
    <div class="hero-copy"><div class="eyebrow"><span class="status-dot"></span>첫 번째 구매 가이드 <span class="eyebrow-divider">/</span> 키보드</div>
      <h1>첫 키보드,<br>스펙보다 <span class="accent-underline">내 일상부터.</span></h1>
      <p class="hero-description">적축, 텐키리스, 멀티페어링…<br>낯선 단어는 쉽게 이해하고,<br>내가 고른 이유가 분명한 키보드를 만나세요.</p>
      <div class="hero-actions"><a class="button primary" href="#find">${hasProgress ? '내 조건 이어서 찾기' : '나에게 맞는 키보드 찾기'} ${icon('arrow', 19)}</a><span class="microcopy">5단계 질문 · 가입 없이</span></div>
      <a class="subtle-link" href="#guide">고르기 전에 먼저 알아볼래요 ${icon('arrow', 15)}</a>
    </div>
    <div class="hero-art"><div class="art-grid"></div><span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span>
      <div class="art-note note-top">${icon('check', 16)} 내게 필요한 연결 방식</div>
      <div class="hero-keyboard">${keyboard(false, 'sage')}</div>
      <div class="floating-key">A<span>나의 기준</span></div>
      <div class="art-note note-bottom"><span class="tiny-square"></span> 정답보다, 나에게 맞는 선택</div>
      <span class="art-caption">키보드 이해를 돕는 도식 · 실물 사진 아님</span>
      <span class="spark spark-one">✳</span><span class="spark spark-two">+</span>
    </div>
  </section>
  <section class="trust-strip" aria-label="추천의 범위"><div>${icon('shield')}<span><strong>근거가 보이는 후보</strong><small>제조사 공식 사양에 연결</small></span></div><div>${icon('layout')}<span><strong>두 브랜드, 6개 모델</strong><small>전체 시장 순위가 아닌 작은 시작</small></span></div><div>${icon('info')}<span><strong>모르는 것은 모른다고</strong><small>국내 가격·재고·실측 소음 미확인</small></span></div></section>
  <section class="learn-section"><div class="section-heading"><div><span class="eyebrow">BEFORE YOU PICK</span><h2>세 가지만 알면, 선택이 쉬워져요.</h2></div><a class="subtle-link" href="#guide">가이드 전체 보기 ${icon('arrow', 17)}</a></div><div class="guide-grid">${guideCards()}</div></section>
  <section class="promise"><div><span class="eyebrow">HOW FIRST PICK WORKS</span><h2>추천보다 먼저,<br>고르는 기준을 드려요.</h2></div><ol><li><span>01</span><div><strong>낯선 용어를 내 언어로</strong><p>배열, 연결, 타건감의 차이를 이해해요.</p></div></li><li><span>02</span><div><strong>꼭 필요한 조건으로 좁히기</strong><p>조건이 안 맞거나 근거가 없으면 추천을 보류해요.</p></div></li><li><span>03</span><div><strong>이유를 확인하고 직접 결정하기</strong><p>후보의 차이와 구매 전 확인할 점을 함께 봐요.</p></div></li></ol></section>`;
}
function guideCards() {
  return guides.map(g => `<button class="guide-card ${g.color}" data-guide="${g.id}"><span class="guide-top"><span>${g.index} / ${g.tag}</span>${icon(g.icon, 25)}</span><strong>${g.title}</strong><span class="guide-summary">${g.summary}</span><span class="guide-bottom">쉽게 알아보기 ${icon('arrow', 19)}</span></button>`).join('');
}
function guidePage() {
  return `<section class="page-heading"><span class="eyebrow">THE BEGINNER'S NOTES</span><h1>좋은 선택은,<br>조금의 이해에서 시작해요.</h1><p>모든 스펙을 외울 필요는 없어요. 내 생활에 영향을 주는 차이부터 알아보세요.</p></section><div class="guide-grid standalone-guides">${guideCards()}</div><aside class="callout">${icon('info')}<p>설명은 구매 판단을 돕는 일반 가이드예요. 특정 제품의 소음·편안함·건강 효과를 보증하지 않습니다. 각 글에서 참고 출처를 확인할 수 있어요.</p></aside><div class="center-action"><a class="button primary" href="#find">이제 내 조건 찾아보기 ${icon('arrow')}</a></div>`;
}
/** @param {string} id */
function openGuide(id) {
  const g = guides.find(g => g.id === id);
  if (!g) return;
  dialogOpener = /** @type {HTMLElement} */ (document.activeElement);
  dialog.innerHTML = `<div class="dialog-content"><button class="icon-button dialog-close" data-action="close-guide" aria-label="가이드 닫기">${icon('close')}</button><span class="eyebrow">${g.index} / ${g.tag}</span><h2 id="dialog-title">${g.title}</h2>${g.paragraphs.map(p => `<p>${p}</p>`).join('')}<div class="takeaway">${icon('check')}<strong>${g.takeaway}</strong></div><div class="guide-sources"><strong>설명에 참고한 출처</strong>${g.sources.map(s => externalLink(s.title, s.url)).join('')}</div><button class="button primary" data-action="close-guide">이해했어요 ${icon('check',18)}</button></div>`;
  dialog.showModal();
}
function wizard() {
  const step = steps[session.step];
  return `<div class="workspace-heading"><a href="#home" class="subtle-link">${icon('back', 16)} 처음으로</a><span class="small muted">선택은 이 브라우저에만 저장돼요</span></div>
  <div class="wizard-layout"><aside class="wizard-sidebar"><span class="eyebrow">MY FIRST KEYBOARD</span><h2>내 일상에<br>맞춰 고르기.</h2><ol class="step-list">${steps.map((s, i) => `<li class="${i === session.step ? 'current' : i < session.step ? 'done' : ''}" ${i === session.step ? 'aria-current="step"' : ''}><button data-step="${i}" ${i > session.step ? 'disabled' : ''}><span>${i < session.step ? icon('check', 14) : `0${i + 1}`}</span>${s.eyebrow.split(' · ')[1]}</button></li>`).join('')}</ol><div class="sidebar-note">${icon('shield', 20)}<p>6개 모델의 공식 자료로<br>가능한 후보를 좁힙니다.<br>시장 전체의 순위는 아니에요.</p></div></aside>
  <section class="question-panel"><div class="progress-label"><span>${step.eyebrow}</span><span>${session.step + 1} / 5</span></div><div class="progress-track" role="progressbar" aria-label="조건 선택 진행" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${session.step + 1}"><span style="width:${(session.step + 1) * 20}%"></span></div>
  <h1>${step.title}</h1><p class="question-description">${step.description}</p>
  <form id="question-form">${step.fields.map(field => `<fieldset><legend>${field.legend}</legend><div class="options ${field.options.length > 3 ? 'two-columns' : ''}">${field.options.map(([value, label, help]) => `<label class="option"><input type="radio" name="${field.key}" value="${value}" ${session.answers[field.key] === value ? 'checked' : ''}/><span class="option-copy"><strong>${label}</strong><span>${help}</span></span></label>`).join('')}</div></fieldset>`).join('')}
  <div class="question-tip"><span class="tip-label">알고 고르면 달라져요</span><p>${step.tip}</p><button type="button" class="text-button" data-guide="${step.guide}">조금 더 알아보기 ${icon('arrow', 14)}</button></div>
  <div class="wizard-actions"><button type="button" class="button secondary" data-action="previous" ${session.step === 0 ? 'disabled' : ''}>${icon('back',16)} 이전</button><button type="submit" class="button primary">${session.step === 4 ? '조건에 맞는 후보 보기' : '다음으로'} ${icon('arrow',18)}</button></div></form></section></div>`;
}
function conditionChips() {
  return Object.entries(session.answers).map(([key, value]) => `<span class="chip">${labels[/** @type {keyof Answers} */(key)][value]}</span>`).join('');
}
/** @param {Assessment} r @param {number} i */
function productCard(r, i) {
  const p = r.product;
  return `<article class="product-card" data-product="${p.id}"><div class="product-visual ${['sage','lilac','peach'][i%3]}"><span class="product-number">CANDIDATE ${String(i+1).padStart(2,'0')}</span>${keyboard(p.facts.numpad.value === true, ['sage','lilac','peach'][i%3])}<span class="schematic-label">배열 이해용 도식</span></div><div class="product-body"><div class="product-meta"><span>${p.brand}</span><span class="verified">${icon('check',12)} 필수 사양 일치</span></div><h2>${p.name}</h2><p class="product-summary">${p.summary}</p><div class="product-specs"><span>${factText(p,'width')}</span><span>${factText(p,'power')}</span><span>${p.facts.numpad.value ? '숫자패드 있음' : '숫자패드 없음'}</span></div>
    <div class="reasons"><h3>이 후보를 보여드린 이유</h3><ul>${r.reasons.map(reason => `<li>${icon('check',14)}<span>${e(reason.text)} <span class="reason-source">${evidenceLink(p, reason.field)}</span></span></li>`).join('')}</ul></div>
    <div class="product-caution"><strong>구매 전 확인</strong><p>${e(r.warnings[0])}</p><p>국내 가격·재고·실측 소음 미확인</p></div>
    <details class="product-details"><summary>옵션·전체 제약·출처 보기 ${icon('plus',15)}</summary><p><strong>검토한 옵션</strong><br>${p.variant}<br>${p.region}</p><ul>${r.warnings.slice(1).map(w=>`<li>${e(w)}</li>`).join('')}</ul><p><strong>입력 연결</strong><br>${factText(p,'connections')}</p><p>${p.facts.os.note}</p>${p.sources.map(s=>`<div class="source-entry">${externalLink(s.title,s.url)}<small>확인 ${s.checkedAt} · 제조사 사양, 자체 실측 아님</small></div>`).join('')}</details>
    <p class="card-source-date">사양 확인 ${p.sources[0].checkedAt} · ${externalLink('공식 자료',p.sources[0].url)}</p>
    <label class="compare-option"><input type="checkbox" data-compare="${p.id}" ${compared.has(p.id)?'checked':''}/> 비교에 담기 <span>최대 3개</span></label></div></article>`;
}
function results() {
  const result = recommend(catalog, session.answers);
  const validIds = new Set(result.matches.map(r=>r.product.id));
  for(const id of compared) if(!validIds.has(id)) compared.delete(id);
  const visible = showAll ? result.matches : result.matches.slice(0,3);
  return `<section class="page-heading result-heading"><span class="eyebrow">YOUR FIRST PICKS</span><h1>${result.matches.length ? '고른 이유가 분명한, 나의 후보.' : '지금 근거로는, 추천을 보류할게요.'}</h1><p>${result.matches.length ? '필수 사양이 맞는 후보예요. 실물 경험과 구매 조건은 마지막으로 확인해 주세요.' : '조건을 만족한다고 확인할 수 있는 제품이 없습니다. 조건을 임의로 낮추지 않았어요.'}</p><div class="condition-summary">${conditionChips()}</div><button class="button secondary small-button" data-action="edit">조건 수정 ${icon('back',15)}</button></section>
  <div class="result-notice">${icon('info',20)}<p><strong>국내 가격·재고·실측 소음은 확인되지 않았습니다.</strong> 아래 후보는 검토한 6개 모델 안에서의 사양 비교예요. 최신 판매가와 배송비, 지역별 옵션은 구매 전에 확인해 주세요.</p></div>
  ${result.matches.length ? `<div class="results-topline"><span>필수 사양 일치 <strong>${result.matches.length}개</strong> 중 ${visible.length}개 표시</span><span>선호 우선 · 동률은 고정 순서 <button class="text-button" data-action="method">정렬 기준</button></span></div><div class="product-grid">${visible.map(productCard).join('')}</div>${!showAll && result.matches.length>3 ? '<div class="center-action"><button class="button secondary" data-action="show-all">나머지 일치 후보도 보기</button></div>' : ''}` : `<section class="empty-state"><span class="empty-icon">${icon('layout',42)}</span><h2>없다고 단정하기보다,<br>확인되지 않았다고 말씀드릴게요.</h2><p>${session.answers.noise==='strict' ? '실측 소음 자료가 없어 조용한 공간에 적합한지 판단할 수 없어요. 직접 타건하거나 동일 조건 측정 자료를 확인해야 해요.' : session.answers.budget!=='none' ? '국내 판매가와 배송비가 없어 예산 이내임을 보장할 수 없어요. 판매처에서 총액을 확인해야 해요.' : '현재 조건 조합에 맞는 근거가 없거나, 검토한 자료의 유효기간이 지났습니다. 아래에서 보류 이유를 확인해 주세요.'}</p><button class="button primary" data-action="edit">내 조건 다시 살펴보기 ${icon('arrow',18)}</button></section>`}
  <details class="exclusions"><summary>추천하지 않은 후보와 이유 (${result.excluded.length+result.unknown.length}개)</summary><div>${[...result.unknown,...result.excluded].map(r=>`<article><strong>${r.product.brand} ${r.product.name}</strong><span class="status-label ${r.status}">${r.status==='unknown'?'확인 불가':'조건 불일치'}</span><ul>${r.blockers.map(b=>`<li>${e(b)}</li>`).join('')}</ul></article>`).join('') || '<p>현재 모든 모델이 선택한 필수 사양에 일치합니다. 구매 적합성을 보증하는 것은 아닙니다.</p>'}</div></details>
  <section id="comparison" class="comparison-section" aria-label="담은 후보 비교">${comparison()}</section>
  <section class="checklist-section"><div><span class="eyebrow">BEFORE YOU BUY</span><h2>결제 전에, 이 네 가지.</h2><p>후보를 찾았다면 마지막 확인은 직접 해 주세요.</p><button class="button secondary" data-action="download">${icon('download',18)} 내 구매 체크리스트 저장</button></div><ol class="checklist"><li><span>01</span><div><strong>최종 결제 금액</strong><p>배송비·별매 수신기·추가 부품까지 합쳐 예산 확인</p></div></li><li><span>02</span><div><strong>정확한 모델과 배열</strong><p>한글 각인, 스위치 옵션, 완제품/베어본, 숫자패드 확인</p></div></li><li><span>03</span><div><strong>내 기기와 연결</strong><p>OS 버전, USB 포트, 수신기 포함 여부 확인</p></div></li><li><span>04</span><div><strong>실제 타건과 반품 조건</strong><p>소음·키감은 가능하면 직접 확인하고 판매처 정책 확인</p></div></li></ol></section>
  ${feedbackForm()}`;
}
function comparison() {
  const products = catalog.filter(p=>compared.has(p.id));
  if (!products.length) return `<div class="comparison-empty">${icon('compare',25)}<div><h2>후보의 차이를 나란히</h2><p>제품 카드에서 ‘비교에 담기’를 선택하면 여기에 보여요. 최대 3개까지 비교할 수 있어요.</p></div></div>`;
  /** @type {[string, keyof Product['facts']][]} */
  const rows = [['연결 방식','connections'],['가로 크기','width'],['숫자패드','numpad'],['기기 전환','multiDevice'],['전원','power'],['수신기 포함','receiverIncluded'],['키 높이','profile'],['키 구조','mechanism'],['백라이트','backlight'],['국내 가격','priceKrw'],['실측 소음','noiseDb']];
  return `<div class="section-heading"><h2>담은 후보 비교 <span class="muted">${products.length}/3</span></h2><button class="text-button" data-action="clear-compare">비교 비우기</button></div><div class="table-scroll" tabindex="0" role="region" aria-label="제품 비교 표. 작은 화면에서 좌우 스크롤"><table><caption class="sr-only">선택한 키보드 사양과 출처 비교</caption><thead><tr><th scope="col">비교 기준</th>${products.map(p=>`<th scope="col">${p.brand}<br><strong>${p.name}</strong></th>`).join('')}</tr></thead><tbody>${rows.map(([title,key])=>`<tr><th scope="row">${title}</th>${products.map(p=>`<td>${e(factText(p,key))}<small>${evidenceLink(p,key)}</small></td>`).join('')}</tr>`).join('')}<tr><th scope="row">검토한 옵션</th>${products.map(p=>`<td class="variant-cell">${p.variant}</td>`).join('')}</tr><tr><th scope="row">사양 확인일</th>${products.map(p=>`<td>${p.sources[0].checkedAt}</td>`).join('')}</tr></tbody></table></div><p class="small muted">같은 배열이라도 키 위치는 모델마다 다릅니다. 도식이 아닌 판매처의 실제 사진을 확인하세요.</p>`;
}
function feedbackForm() {
  return `<section class="feedback-section"><div><span class="eyebrow">HELP US LEARN</span><h2>고르는 기준이 생겼나요?</h2><p>실제 도움이 되는 서비스인지 확인하고 싶어요.<br>응답은 이 브라우저에만 저장됩니다. 자동 전송되지 않아요.</p></div><form id="feedback-form"><fieldset><legend>내 선택 기준을 정하는 데 도움이 되었나요?</legend><div class="feedback-options"><label><input type="radio" name="helpful" value="yes" required/> 도움이 됐어요</label><label><input type="radio" name="helpful" value="unsure"/> 아직 잘 모르겠어요</label><label><input type="radio" name="helpful" value="no"/> 아쉬워요</label></div></fieldset><label for="feedback-note">어떤 정보가 더 필요했나요? <span class="muted">(선택)</span></label><textarea id="feedback-note" name="note" maxlength="500" rows="3" placeholder="개인정보 없이 남겨 주세요. 최대 500자"></textarea><div class="feedback-actions"><button class="button primary small-button" type="submit">이 기기에 응답 저장</button><button class="text-button" type="button" data-action="export-feedback">저장한 응답 내보내기 ${icon('download',15)}</button></div><p id="feedback-status" role="status" class="small"></p></form></section>`;
}
function dataPage() {
  return `<section class="page-heading"><span class="eyebrow">SOURCES, NOT GUESSWORK</span><h1>확인한 것과,<br>아직 모르는 것을 함께.</h1><p>첫픽은 직접 검토한 공식 사양으로 후보를 좁히는 도구입니다. 자체 실측 리뷰나 시장 전체의 추천 순위가 아니에요.</p></section>
  <div class="principles-grid"><article><span class="number">01</span><h2>작고 명확한 범위</h2><p>사무·학습용 키보드 6개, 두 브랜드를 검토했습니다. 공식 자료 접근성을 기준으로 선정했으며 시장의 대표 표본은 아닙니다.</p></article><article><span class="number">02</span><h2>미확인 값은 비워두기</h2><p>국내 가격·재고·실측 소음은 제공하지 않습니다. 제조사 설명만으로 ‘조용하다’, ‘가성비 1위’ 같은 판정을 만들지 않아요.</p></article><article><span class="number">03</span><h2>오래된 근거는 보류</h2><p>사양 확인 후 90일이 지나면 추천에서 제외합니다. 이는 첫픽의 검토 주기이며, 그동안 사양이 바뀌지 않는다는 보장은 아니에요.</p></article></div>
  <section class="method-section" id="method"><h2>후보는 어떻게 고르나요?</h2><ol><li>OS·연결 방식·숫자패드·기기 전환 필수 조건이 맞는지 확인합니다. 불일치와 미확인 모두 추천에서 제외합니다.</li><li>선호한 특징이 맞는 후보를 먼저 보여줍니다. ‘작은 책상’은 가로 330 mm 이하를 기준으로 하며, 이 값은 서비스의 편집 기준입니다.</li><li>작은 책상 선호는 가로 폭이 작은 순, 그 외 동률은 고정된 모델 ID 순입니다. 순서는 품질·만족도·인기 순위가 아닙니다.</li><li>엄격한 저소음·예산 이내 확인은 현재 데이터로 판단할 수 없어 추천을 보류합니다. 조건을 몰래 완화하지 않습니다.</li></ol></section>
  <section><div class="section-heading"><div><span class="eyebrow">SOURCE REGISTER</span><h2>직접 확인할 수 있는 사양 노트</h2></div><span class="small muted">날짜 기준: Asia/Seoul</span></div><div class="source-register">${catalog.map(p=>`<details><summary><span><small>${p.brand} · ${p.region}</small><strong>${p.name}</strong></span><span class="source-date">${p.sources[0].checkedAt}<span class="${sourceStatus(p.sources[0],todayKST())==='fresh'?'fresh':'expired'}">${sourceStatus(p.sources[0],todayKST())==='fresh'?'검토 기간 내':'재검토 필요'}</span></span>${icon('plus',18)}</summary><div class="source-details"><p><strong>검토한 옵션:</strong> ${p.variant}</p>${p.sources.map(s=>`<p>${externalLink(s.title,s.url)}<br><small>${s.section}</small></p>`).join('')}<dl>${Object.entries(p.facts).map(([key,f])=>`<div><dt>${fieldName(key)}</dt><dd>${e(factText(p,/** @type {keyof Product['facts']} */(key)))}<p>${e(f.note)}</p></dd></div>`).join('')}</dl></div></details>`).join('')}</div></section>
  <section class="privacy-note"><h2>내 조건과 응답은 어디에 남나요?</h2><p>이 브라우저의 localStorage에만 저장합니다. 서버, 광고 도구, 외부 분석 서비스로 보내지 않습니다. 피드백은 저장 버튼을 눌러야 남고, 내보내기로 직접 파일을 받을 수 있어요. 개인 응답이 개발자에게 자동으로 전달되지는 않습니다.</p><p>브라우저 저장을 차단하거나 삭제해도 서비스는 사용할 수 있습니다. 새로고침하면 저장되지 않은 선택은 사라집니다. 공식 출처 링크는 새 탭에서 해당 외부 사이트를 엽니다.</p><button class="button secondary" data-action="clear">내 기기 저장 정보 삭제</button></section>`;
}
/** @param {string} key */
function fieldName(key) {
  return /** @type {Record<string,string>} */ ({ connections:'연결 방식', numpad:'숫자패드', os:'OS 기본 입력', multiDevice:'기기 전환', power:'전원', profile:'키 높이', width:'가로 크기', weight:'표기 무게', receiverIncluded:'수신기 포함', backlight:'백라이트', mechanism:'키 구조', priceKrw:'국내 가격', noiseDb:'실측 소음' })[key] ?? key;
}
function render() {
  let route = location.hash.slice(1) || 'home';
  if(route === 'main') route = 'home';
  if(route==='results'&&!session.finished) route='find';
  if(!['home','find','guide','results','data'].includes(route)) route='home';
  document.querySelectorAll('[data-nav]').forEach(el=>{if(el.getAttribute('data-nav')===route) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current');});
  main.className = `container route-${route}`;
  main.innerHTML = route === 'find' ? wizard() : route === 'results' ? results() : route === 'guide' ? guidePage() : route === 'data' ? dataPage() : home();
  document.title = `${/** @type {Record<string,string>} */({home:'이해하고, 나에게 맞게 고르기',find:'내 조건 찾기',results:'내 키보드 후보',guide:'구매 전 알아보기',data:'데이터와 원칙'})[route]} — 첫픽`;
  setNotice(notice); titleFocus();
}
/** @param {string} content @param {string} filename @param {string} [type] */
function download(content, filename, type='text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content],{type}));
  const a = document.createElement('a'); a.href=url; a.download=filename; document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadChecklist() {
  const r = recommend(catalog, session.answers);
  const picks = compared.size ? r.matches.filter(r=>compared.has(r.product.id)) : r.matches.slice(0,3);
  const text = [`첫픽 구매 체크리스트 · ${todayKST()} KST`, '검토한 6개 모델 중 조건 기반 후보입니다. 구매 적합성·가격·소음·재고를 보증하지 않습니다.', '', '내 조건', ...Object.entries(session.answers).map(([k,v])=>`- ${labels[/** @type {keyof Answers} */(k)][v]}`), '', '비교할 후보', ...(picks.length?picks.map(r=>`${r.product.brand} ${r.product.name}\n옵션: ${r.product.variant}\n이유: ${r.reasons.map(x=>x.text).join('; ')}\n제약: ${r.warnings.join('; ')}\n${r.product.sources.map(s=>`${s.title}: ${s.url} (확인 ${s.checkedAt})`).join('\n')}`):['확인 가능한 후보 없음. 미확인 조건을 먼저 확인하세요.']), '', '[ ] 배송비와 별매품을 합친 결제 총액', '[ ] 정확한 옵션/한글 각인/완제품 여부', '[ ] OS 버전/연결/수신기 포함 여부', '[ ] 실제 타건감·소음과 판매처의 반품·보증 정책', '', '이 파일은 기기에서 생성했으며 외부로 자동 전송하지 않았습니다.'].join('\n');
  download(text,`first-pick-checklist-${todayKST()}.txt`);
  setNotice('구매 체크리스트 파일을 만들었습니다. 브라우저의 다운로드 목록에서 확인하세요.');
}
app.addEventListener('click', event => {
  if(!(event.target instanceof Element)) return;
  const target = event.target.closest('button');
  if(!target) return;
  if(target.dataset.guide) { openGuide(target.dataset.guide); return; }
  if(target.dataset.step !== undefined) { session.step=Number(target.dataset.step); persist(); render(); return; }
  switch(target.dataset.action) {
    case 'close-guide': dialog.close(); break;
    case 'previous': session.step=Math.max(0,session.step-1); persist(); render(); break;
    case 'edit': session.step=0; persist(); navigate('find'); break;
    case 'show-all': showAll=true; render(); break;
    case 'clear-compare': compared.clear(); render(); break;
    case 'method': navigate('data'); break;
    case 'download': downloadChecklist(); break;
    case 'clear': {
      const cleared=clearLocalData(); session={version:1,answers:{...defaultAnswers},step:0,finished:false}; hasProgress=false; compared.clear(); showAll=false;
      setNotice(cleared ? '이 기기에 저장한 조건과 피드백을 삭제했습니다.' : '현재 선택을 초기화했습니다. 브라우저 저장소 접근이 차단되어 저장된 정보의 삭제 여부는 확인할 수 없습니다. 브라우저 설정에서 삭제해 주세요.');
      navigate('home'); break;
    }
    case 'export-feedback': {
      const entries=readFeedback();
      if(!entries.length) { setNotice('이 브라우저에 저장된 응답이 없습니다. 응답 저장을 먼저 눌러 주세요.'); break; }
      download(JSON.stringify({app:'first-pick',exportedAt:todayKST(),entries},null,2),`first-pick-feedback-${todayKST()}.json`,'application/json');
      setNotice('저장된 응답 파일을 만들었습니다. 외부로 자동 전송하지 않았습니다.'); break;
    }
  }
});
app.addEventListener('change', event => {
  if(!(event.target instanceof HTMLInputElement)) return;
  const input=event.target;
  if(input.dataset.compare) {
    if(input.checked && compared.size>=3) { input.checked=false; setNotice('비교는 최대 3개까지 가능합니다. 담은 후보를 하나 해제해 주세요.'); return; }
    if(input.checked) compared.add(input.dataset.compare); else compared.delete(input.dataset.compare);
    const section = document.querySelector('#comparison'); if(section) section.innerHTML=comparison();
    setNotice(`비교에 ${compared.size}개를 담았습니다. 카드 아래 비교 표에서 차이를 볼 수 있어요.`); return;
  }
  const key=/** @type {keyof Answers} */(input.name);
  if(key in answerOptions && answerOptions[key].includes(input.value)) {
    session.answers=/** @type {Answers} */({...session.answers,[key]:input.value});
    session.finished=false; compared.clear(); showAll=false; persist();
  }
});
app.addEventListener('submit', event=> {
  if(!(event.target instanceof HTMLFormElement)) return;
  event.preventDefault();
  if(event.target.id==='question-form') {
    if(session.step<4) { session.step++; persist(); render(); }
    else { session.finished=true; persist(); navigate('results'); }
  }
  if(event.target.id==='feedback-form') {
    const values=new FormData(event.target); const helpful=String(values.get('helpful')??'');
    if(!['yes','no','unsure'].includes(helpful)) return;
    const ok=saveFeedback({version:1,date:todayKST(),helpful,note:String(values.get('note')??'').slice(0,500)});
    const status=document.querySelector('#feedback-status');
    if(status) status.textContent=ok?'이 기기에 응답을 저장했습니다. 직접 내보내기 전까지 개발자에게 전달되지 않습니다.':'저장에 실패했습니다. 브라우저의 저장 허용 설정을 확인해 주세요. 응답은 전송되지 않았습니다.';
    if(ok) event.target.reset();
  }
});
dialog.addEventListener('close',()=>dialogOpener?.focus());
document.querySelector('.skip-link')?.addEventListener('click',event=>{
  event.preventDefault(); main.focus(); main.scrollIntoView();
});
window.addEventListener('hashchange', render);
render();
