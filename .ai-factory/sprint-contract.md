# Sprint Contract: 배너 광고 & 라우팅 연결 [packet 0008]

## 만들 항목

1. **src/App.tsx** — 이미 라우트 스캐폴드됨 ('/' + '/result' + unknown→'/') 확인만. 변경 불필요.
2. **src/pages/Home.tsx** — ScreenScaffold bottom 위에 AdSlot 배너 추가 (로드 실패 시 영역 미렌더, CSS 공간 아님)

## 타입 (types.ts에서 import)
- `FireInput` — 나이/소득/지출/순자산/연수익률 입력
- `RouteState` — navigate state: `{ input: FireInput }`

## 검증 방법
- **TS 체크**: `npx tsc --noEmit` 통과
- **라우팅**: 
  - '/' 진입 → Home 폼 렌더
  - 폼 작성 + 제출 → '/result'로 navigate (state 포함)
  - '/result' 접근 가능 (state 없을 때 기본값으로 리다이렉트 또는 처리)
  - unknown path (/foo/bar 등) → '/'로 리다이렉트
- **배너**: 
  - `npm run test:visual` 후 e2e/__shots__ 스크린샷에서 배너 영역 확인 (로드 성공/실패 구분 없음)
  - 로드 실패해도 흰 화면/콘솔 에러 0개
- **비주얼**: visual-smoke.spec.ts의 ROUTES에 '/'와 '/result' 등록됨

## 절대 금지
- **main.tsx 수정** (@AI:ANCHOR 파일)
- **App.tsx 라우트 경로 삭제** (이미 스캐폴드된 경로는 고치지 말고 보완만)
- **AdSlot이 로드 실패 시에도 영역을 렌더** (조건부 렌더 필수)
- **배너 광고 try/catch 가드 생략** (WebView 밖에서 throw → 흰 화면 유발)
- **types.ts 재정의** (import해서 쓰기만)
