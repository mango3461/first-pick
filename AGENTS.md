# First Pick / 첫픽

한국어 구매 입문 가이드와 출처 기반 키보드 후보 비교를 만드는 무예산 프로젝트다.

## 작업 규칙
- 기존 변경을 보존하고 `git status`부터 확인한다. 현 상태는 `docs/STATUS.md`에 갱신한다.
- 완료 기준은 `docs/ACCEPTANCE.md`에 고정한다. 결과에 맞춰 기준을 낮추지 않는다.
- 공식 출처에서 확인한 사양만 데이터에 넣는다. SKU/지역/옵션을 구분하고 필드별 출처·확인일을 기록한다.
- 미확인 값은 null이다. 미확인 가격, 소음, 재고, 인기도, 실사용 경험을 추정해 채우지 않는다.
- 필수 조건 불일치/미확인 후보를 적합하다고 표시하지 않는다. 점수는 구매 만족 확률이 아니다.
- 유료 API/서비스, 배포, 외부 메시지 발송은 추가 승인 없이는 하지 않는다. 사용자 승인: GitHub `first-pick`, 공개, `main`.
- 비밀/개인 응답/로컬 피드백/브라우저 기록은 커밋하지 않는다. 외부 분석·폰트·이미지 요청을 추가하지 않는다.
- 한국어 화면, 키보드 탐색, 모바일 레이아웃, 빈 결과와 저장 실패를 검증한다.

## 환경과 명령
Node.js 22.14 이상(22 LTS 권장), npm, 커밋된 package-lock.json을 사용한다. 가상환경/서버 DB/GPU 불필요.

```sh
npm ci
npm run dev
npm test
npm run check
npm run build
npm run test:e2e
npm run data:audit
```

E2E는 설치된 Edge를 기본 사용한다. 다른 환경: `npx playwright install chromium`, `PLAYWRIGHT_BROWSER=chromium`.
링크 점검은 수동 감사 보조 도구다. HTTP 성공만으로 내용이 최신/정확하다고 간주하지 않는다.
