/** @import { Answers } from './types' */
/** @type {Record<keyof Answers, Record<string, string>>} */
export const labels = {
  os: { windows: 'Windows', macos: 'Mac', ipados: 'iPad' },
  connection: { any: '연결 방식 무관', bluetooth: 'Bluetooth', receiver: 'USB 수신기', wired: 'USB 유선 입력' },
  numpad: { any: '숫자패드 무관', yes: '숫자패드 필요', no: '숫자패드 제외' },
  devices: { one: '주로 한 대', multi: '여러 기기 전환' },
  priority: { balanced: '선호 없이 비교', compact: '작은 책상', rechargeable: '충전식 전원', low: '낮은 키 높이' },
  noise: { normal: '소음은 직접 확인', strict: '실측 저소음 필수' },
  budget: { none: '가격은 직접 확인', '50000': '5만 원 이내 확인', '100000': '10만 원 이내 확인', '200000': '20만 원 이내 확인' },
};
/** @type {{ title: string, eyebrow: string, description: string, fields: { key: keyof Answers, legend: string, options: [string, string, string][] }[], tip: string, guide: string }[]} */
export const steps = [
  {
    title: '어떤 기기에서 쓰실 건가요?', eyebrow: '01 · 함께 쓸 기기',
    description: '가장 자주 사용할 기기를 골라 주세요. 기본 입력 호환성을 먼저 확인할게요.',
    fields: [{ key: 'os', legend: '주로 사용하는 운영체제', options: [
      ['windows', 'Windows PC', '데스크톱이나 Windows 노트북'], ['macos', 'Mac', 'MacBook, iMac, Mac mini'], ['ipados', 'iPad', 'Bluetooth 키보드를 연결해 사용'],
    ] }],
    tip: '“Mac 호환”과 “모든 기능 사용 가능”은 달라요. 기본 타이핑은 되더라도 전용 단축키나 설정 앱은 지원하지 않을 수 있어요.', guide: 'connection',
  },
  {
    title: '어떻게 연결하고 싶으세요?', eyebrow: '02 · 연결 방식',
    description: '반드시 필요한 방식을 골라 주세요. 선택한 연결을 지원하는 후보만 남깁니다.',
    fields: [{ key: 'connection', legend: '필요한 연결 방식', options: [
      ['any', '아직 정하지 않았어요', '지원하는 연결 방식을 비교하면서 고를게요'],
      ['bluetooth', 'Bluetooth로 무선 연결', '기기의 Bluetooth 지원을 확인해 주세요'],
      ['receiver', 'USB 수신기로 무선 연결', 'USB 포트가 필요해요. 수신기가 별매일 수 있어요'],
      ['wired', '케이블로 유선 입력', '충전만 되는 USB-C 포트와는 달라요'],
    ] }], tip: 'USB-C가 있다고 모두 유선 키보드는 아니에요. 충전 전용 포트라면 입력은 여전히 Bluetooth나 수신기로 전달됩니다.', guide: 'connection',
  },
  {
    title: '오른쪽 숫자패드가 필요한가요?', eyebrow: '03 · 키 배열',
    description: '숫자를 얼마나 자주 입력하는지, 책상에 얼마나 공간이 있는지 생각해 보세요.',
    fields: [{ key: 'numpad', legend: '숫자패드 선택', options: [
      ['yes', '네, 숫자를 자주 입력해요', '엑셀·회계 작업에 쓰는 별도 숫자패드 필요'],
      ['no', '아니요, 마우스 공간이 더 중요해요', '숫자패드 없는 배열만 볼게요'],
      ['any', '둘 다 비교해 볼게요', '크기와 배열을 보고 결정하고 싶어요'],
    ] }], tip: '75%·텐키리스 같은 말은 키 배열을 뜻해요. 작은 키보드는 자리를 덜 차지하지만 일부 키의 위치나 조합이 달라질 수 있어요.', guide: 'layout',
  },
  {
    title: '내 일상에 맞는 쪽은 무엇인가요?', eyebrow: '04 · 사용 습관',
    description: '기기 전환은 필수 조건으로, 가장 끌리는 특징은 후보를 정렬하는 선호로 사용해요.',
    fields: [
      { key: 'devices', legend: '기기를 오가며 사용하나요?', options: [ ['one', '주로 한 대에서 사용해요', '기기 전환 기능이 꼭 필요하지 않아요'], ['multi', '여러 기기를 전환해요', '페어링한 기기를 쉽게 바꾸는 기능 필요'] ] },
      { key: 'priority', legend: '가장 우선하고 싶은 한 가지 (선호)', options: [ ['balanced', '차이를 먼저 비교할게요', '특정 특징에 우선순위를 두지 않아요'], ['compact', '작은 책상에 두고 싶어요', '가로 330 mm 이하 후보를 먼저 보여줘요'], ['rechargeable', '건전지보다 충전이 좋아요', '충전식 후보를 먼저 보여줘요'], ['low', '낮은 키가 익숙해요', '낮은 키 높이 후보를 먼저 보여줘요'] ] },
    ], tip: '기기 전환은 여러 화면에 동시에 입력한다는 뜻이 아니에요. 유선이나 수신기만 쓰려면 별도의 전환 방법을 확인해야 합니다.', guide: 'connection',
  },
  {
    title: '꼭 확인되어야 하는 조건이 있나요?', eyebrow: '05 · 확인의 범위',
    description: '현재 국내 결제 가격과 실측 소음 자료는 없어요. 반드시 확인이 필요하다면 추천을 보류합니다.',
    fields: [
      { key: 'noise', legend: '소음 조건', options: [ ['normal', '소음은 구매 전에 직접 확인할게요', '사양에 맞는 후보를 먼저 보고 싶어요'], ['strict', '실측 저소음 확인이 꼭 필요해요', '도서관처럼 조용해야 하는 곳 · 현재 추천 불가'] ] },
      { key: 'budget', legend: '배송비 포함 예산 이내 여부', options: [ ['none', '가격은 판매처에서 확인할게요', '현재 가격 비교는 제공하지 않아요'], ['50000', '5만 원 이내 확인이 필요해요', '국내 총액 자료 없음 · 현재 추천 불가'], ['100000', '10만 원 이내 확인이 필요해요', '국내 총액 자료 없음 · 현재 추천 불가'], ['200000', '20만 원 이내 확인이 필요해요', '국내 총액 자료 없음 · 현재 추천 불가'] ] },
    ], tip: '축 색상이나 “저소음”이라는 상품명만으로 실제 소리를 알 수 없어요. 같은 제품도 타건 방법·책상·주변 환경에 따라 다르게 들립니다.', guide: 'switch',
  },
];
export const guides = [
  {
    id: 'layout', index: '01', icon: 'layout', tag: '크기와 배열', title: '작으면 무조건 편할까요?',
    summary: '숫자패드와 책상 공간, 먼저 따져보세요.', color: 'sage',
    paragraphs: [
      '풀사이즈는 오른쪽 숫자패드를 포함하는 배열이에요. 숫자를 자주 입력하면 유용하지만, 키보드가 차지하는 가로 공간도 커집니다.',
      '텐키리스(TKL)는 숫자패드를 덜어낸 배열, 75%는 방향키와 기능키를 더 붙여 배치한 형태예요. 같은 비율이라도 키 위치와 실제 크기는 모델마다 다릅니다.',
      '처음 고를 때는 “숫자패드가 필요한가?”부터 정하세요. 그다음 자주 쓰는 Home·End·Delete 키와 한글 각인, Enter 모양을 제품 사진에서 확인하세요.',
    ], takeaway: '키 개수보다 내가 자주 쓰는 키의 위치가 먼저예요.',
    sources: [{ title: 'Keychron 배열별 제품 찾기', url: 'https://www.keychron.com/collections/keyboard-finder' }],
  },
  {
    id: 'switch', index: '02', icon: 'switch', tag: '타건감과 소음', title: '축 색깔만으로 고르지 마세요.',
    summary: '눌리는 감각과 소리 크기는 다른 이야기예요.', color: 'lilac',
    paragraphs: [
      '기계식에서 리니어는 중간 걸림 없이 내려가는 감각, 택타일은 눌림 도중 걸림이 느껴지는 감각, 클릭형은 여기에 의도적인 클릭 소리가 더해진 방식이에요.',
      '적축·갈축·청축 같은 색 이름은 제조사와 제품군에 따라 의미가 달라질 수 있어요. 색 이름 하나로 소리나 편안함을 확정하면 안 됩니다. 펜타그래프(시저)는 기계식 축의 색 분류와 다른 키 지지 구조예요.',
      '소음은 스위치 외에도 키캡, 하우징, 큰 키의 구조, 책상과 타건 방법의 영향을 받습니다. 녹음 영상도 녹음 조건이 다르면 직접 비교하기 어려워요. 가능하면 같은 공간에서 타건하거나 반품 조건을 확인하세요.',
    ], takeaway: '리니어 = 무소음은 아니에요. 첫픽은 실측 없는 저소음을 보증하지 않아요.',
    sources: [{ title: 'CHERRY 스위치 분류', url: 'https://www.cherry.de/en-gb/products/switches' }, { title: 'RTINGS 소음 측정 방법', url: 'https://www.rtings.com/keyboard/tests/typing-noise' }],
  },
  {
    id: 'connection', index: '03', icon: 'connection', tag: '연결과 호환성', title: 'USB-C가 있어도 무선일 수 있어요.',
    summary: '충전 포트, 유선 입력, 수신기를 구분해요.', color: 'peach',
    paragraphs: [
      'Bluetooth는 기기에 직접 무선 연결하고, USB 수신기는 작은 동글을 USB 포트에 꽂아 무선으로 연결해요. 수신기는 별매일 수 있고, 서로 다른 수신기 규격이 자동으로 호환되지는 않습니다.',
      'USB-C는 단자 모양이에요. MX Keys S처럼 충전용 케이블이 있어도 입력 연결은 무선인 제품이 있고, B1 Pro처럼 USB 유선 입력을 지원하는 제품도 있어요.',
      '운영체제 지원은 기본 타이핑과 전용 설정 앱을 나눠 확인하세요. 기기 전환은 보통 페어링된 기기 중 하나를 선택하는 기능입니다. iPad의 USB 어댑터나 유선 전환기까지 이 서비스가 확인한 것은 아니에요.',
    ], takeaway: '구매 전 “입력 연결 방식”과 “수신기 포함 여부”를 따로 확인하세요.',
    sources: [{ title: 'Logitech MX Keys S 사양', url: 'https://www.logitech.com/ko-kr/shop/p/mx-keys-s' }, { title: 'Keychron B1 Pro 사양', url: 'https://www.keychron.com/products/keychron-b1-pro-ultra-slim-wireless-keyboard' }],
  },
];
