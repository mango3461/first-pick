# 진행 상태

2026-11-13 (Asia/Seoul). 다음 세션은 이 문서, ACCEPTANCE, git status부터 확인한다.

- 기존 폴더: 빈 폴더. Git/AGENTS 없음. 기존 사용자 파일 없음.
- 목표: 첫 구매자가 개념을 이해하고 근거를 확인하며 후보를 좁히는 무료 서비스.
- 선택: 첫 카테고리는 사무·학습용 키보드. 공식 사양 기반 6개 모델/2개 브랜드로 한정.
- 승인: GitHub first-pick 공개 저장소, main. 배포/비용 승인 없음.
- 환경: Windows 11, Node 22.14.0, npm 10.9.2, Git 2.48.1. GitHub CLI 대신 기존 Git credential manager + GitHub REST API 사용.
- 2026-11-13 KST: 핵심 게이트 통과. 6개 모델의 공식 출처·옵션·필드 근거 기록. 추천/출처/날짜 테스트 18개 통과, check와 data:audit 통과. 전체 화면 구현 전에 실행함.
- GitHub 인증: 기존 credential manager로 mango3461 계정 확인. 비밀 출력/파일 저장 없음.
- 데이터 발견: K650 공식 FAQ AA/AAA 충돌 → 정확한 건전지 규격 사용 안 함. 글로벌 ANSI와 한국어 SKU 구분. 가격/소음 실측/국내 재고 미확인.
- 구현 완료: 한국어 입문 가이드, 5단계 조건 선택, 근거/보류 결과, 3개 비교, 체크리스트 다운로드, 로컬 조건/피드백 저장·내보내기·삭제, 출처 노트, 만료 필터.
- 검증: 단위 20개(2,304조합), E2E 주요 20개 + skip-link 추가 2개, 타입/빌드/출처 감사 통과. 주요 화면 axe serious/critical 0. 별도 디렉터리 npm ci→check→test→build 재현 성공. 전체 npm audit 알려진 취약점 0. 세부 결과 QA.md.
- 도구 제한: 사용자 화면 브라우저 미리보기 연결 불가. Edge 자동 테스트와 PNG 시각 검토 수행. 링크 자동 점검은 Keychron 429, Logitech 200. 우회 안 함.
- GitHub: https://github.com/mango3461/first-pick 공개 저장소 생성 완료, 기본 main, Pages 비활성. 코드 최초 푸시 진행 예정.
- 다음: 최종 Git 검토·커밋·푸시 및 원격 커밋 확인. 추가 기능 확장 없음.
- 실제 사용자 인터뷰/수요 검증: 0명, 미수행. docs/VALIDATION.md에 5명 자발적 관찰의 과제·판단 기준·빈 기록 양식 준비.
- 비용: 새 유료 서비스/API 연결 없음. 서비스 미배포. 모델/API 호출 없이 정적 앱으로 동작.
