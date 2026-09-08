🇰🇷 [English](./README.md)

# EarlyRetireSim — FIRE 조기 퇴직 나이 계산기

모바일 중심의 FIRE(경제적 독립, 조기 퇴직) 시뮬레이터로, 4% 규칙을 기반으로 퇴직 나이를 계산합니다. 월 소득, 지출, 현재 자산을 입력하면 조기 퇴직이 가능한 시점을 알 수 있으며, 저축 시나리오를 한눈에 비교해볼 수 있습니다.

2030년대 이상의 전문가를 대상으로 FIRE 트렌드에 관심 있는 사람들을 위해 설계되었습니다. 결과는 몇 초 내에 표시되며, 선택적으로 저축률 10% 증가 시나리오와 비교하여 퇴직까지의 시간 단축 효과를 볼 수 있습니다.

## 기능

- 📊 **퇴직 나이 계산기** — 4% 규칙(연간 인출액 = 연간 지출액 × 25배) 기반으로 월 복리 이자를 시뮬레이션
- 📈 **인터랙티브 자산 성장 그래프** — SVG 기반의 자산 축적 시간대 시각화, 모바일 화면 최적화
- 💡 **실시간 저축률 표시** — 소득과 지출을 조정할 때 즉시 피드백
- 🎯 **시나리오 비교** — 현재 저축률과 +10% 저축률 상황의 나란한 비교 및 시간 절감 표시
- 📋 **결과 공유** — 포맷된 요약을 클립보드로 복사하여 빠르게 공유
- 💰 **예상 수익률 선택** — 연 4%, 6%, 8% 수익률 중 선택 가능
- 🎬 **리워드 광고 게이트** — 리워드 광고 시청 후 또는 5초 타임아웃 경과 후 결과 제공
- 📱 **모바일 네이티브 UX** — 다크 모드, 터치 최적화 입력, 키보드 처리, 안전 영역 지원
- 📦 **오프라인 우선** — 모든 계산은 로컬에서 실행, 마지막 입력을 localStorage에 저장
- ⚠️ **탄력적 폴백** — 광고 실패, 네트워크 오류, 용량 초과 오류를 우아하게 처리

## 기술 스택

- **프레임워크**: React 18 + Vite
- **UI**: TDS (Toss Design System) 컴포넌트 + Emotion CSS-in-JS
- **라우팅**: React Router DOM v7
- **언어**: TypeScript 5
- **테스트**: Vitest + @testing-library/react + Playwright (시각화)
- **아이콘**: lucide-react
- **상태 관리**: React hooks + localStorage
- **배포**: Toss CDN (App-in-Toss 플랫폼)

## 시작하기

### 필수 사항

- Node.js 18 이상
- npm (Node.js에 포함)

### 설치 및 설정

```bash
npm install
npm run typecheck  # TypeScript 검증
npm run test       # 단위 테스트 실행
npm run test:visual  # 시각화/e2e 테스트 실행 (chromium 필요)
npx tsc --noEmit   # 제출 전 최종 타입 체크
```

### 개발

프로젝트는 Vite를 사용합니다. 이 환경에서는 dev 서버를 검증할 수 없으므로 다음에 의존하세요:

```bash
npm run build       # 프로덕션 빌드
npm run test:visual # Playwright 전체 테스트 + 스크린샷 캡처
npx vitest run      # 단위 테스트
```

### 명령어 참조

| 명령어 | 용도 |
|---------|---------|
| `npm run dev` | Vite dev 서버 시작 (로컬 개발용) |
| `npm run build` | `dist/` 디렉토리로 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 타입 체크 |
| `npm run test` | vitest 실행 (단위 테스트) |
| `npm run test:watch` | vitest를 감시 모드로 실행 |
| `npm run test:visual` | Playwright 시각화 테스트 + 스크린샷 캡처 |
| `npm run test:visual:update` | 시각화 테스트 스냅샷 업데이트 |
| `npm run gate` | 제출 전 품질 게이트 (타입 + 테스트 + 시각화 + 콘솔 오류 없음) |

## 환경 변수

| 변수 | 설명 | 필수 |
|----------|-------------|----------|
| `VITE_TOSS_AD_SLOT_ID` | Toss 리워드 광고 슬롯 ID (콘솔에서 발급) | 아니오 (폴백 제공) |

모든 설정은 `apps-in-toss.config.ts`에서 설정됩니다. 앱 이름(`earlyretiresim`)은 Toss 콘솔 등록명과 정확히 일치해야 합니다.

## 프로젝트 구조

```
src/
├── pages/              # 화면 컴포넌트
│   ├── Home.tsx        # 입력 화면 (4개 필드 + 수익률 Chip + 광고 배너)
│   ├── Result.tsx      # 결과 화면 (퇴직 나이 + 그래프 + 비교)
│   └── __TdsGallery.tsx  # 개발 전용 TDS 컴포넌트 갤러리
├── components/         # 재사용 가능한 UI 컴포넌트 & SDK 래퍼
│   ├── ScreenScaffold.tsx      # 페이지 레이아웃 컨테이너 (상단 헤더 + 본문 + 하단 CTA)
│   ├── PageShell.tsx           # 안전 영역 래퍼
│   ├── SummaryHero.tsx         # 큰 영웅 숫자 표시 (퇴직 나이)
│   ├── AssetChart.tsx          # SVG 자산 성장 그래프
│   ├── ScenarioCompare.tsx     # 비교 카드 레이아웃
│   ├── RewardGate.tsx          # 광고 리워드 게이트 + 폴백 UI
│   ├── TossRewardAd.tsx        # 리워드 광고 래퍼 (SDK 가드 + 정리)
│   ├── AdSlot.tsx              # 배너 광고 래퍼
│   ├── CountUp.tsx             # 애니메이션 숫자 카운터
│   ├── StateView.tsx           # 빈 상태/로딩 상태 컴포넌트
│   └── ...                     # TDS 헬퍼: Card, Amount, BottomCTA 등
├── lib/                # 유틸리티 & 비즈니스 로직
│   ├── fire.ts         # FIRE 계산 엔진 (퇴직 나이, 자산 성장)
│   ├── validation.ts   # 입력 필드 검증 & 오류 메시지
│   ├── types.ts        # 공유 TypeScript 타입 & RouteState
│   ├── storage.ts      # localStorage 헬퍼 (getItem/setItem)
│   ├── share.ts        # Clipboard API 래퍼
│   ├── utils.ts        # 포맷터 (통화, 숫자, 개월->년)
│   └── contract.ts     # 앱 상태 타입 계약
├── __tests__/          # 단위 & 통합 테스트
└── main.tsx            # 앱 진입점 (TDSMobileAITProvider 사전 설정)
```

## 주요 구현 세부 사항

### FIRE 계산 엔진 (`src/lib/fire.ts`)

- 월 복리 이자를 시뮬레이션: `월_수익률 = (1 + 연_수익률)^(1/12) - 1`
- 목표 자산: `월_지출 × 12 × 25` (4% 규칙)
- 최대 600개월(50년)까지 반복 계산
- 퇴직 나이 + 그래프용 연도별 전체 자산 반환
- 엣지 케이스 처리: 음수 저축, 도달 불가능한 목표 (폴백 UI 표시)

### 입력 검증 & 지속성 (`src/lib/validation.ts` + `src/lib/storage.ts`)

- 모든 필드 검증: 나이 19-70세, 소득/지출 0-1억, 자산 0-100억
- 유효하지 않은 입력은 계산 버튼 활성화 방지
- 마지막 입력을 `localStorage:ers:lastInput`에 저장 (페이지 새로고침 후에도 유지)
- 스토리지 실패는 우아하게 처리: 라우트 상태를 통한 계산 진행, 1회 Toast 표시

### 리워드 광고 게이트 (`src/components/RewardGate.tsx`)

- 리워드 광고 로드 및 완료 **또는** 5초 타임아웃 후에만 결과 표시
- 타임아웃 시 폴백 UI 트리거 (재시도 버튼 + "광고 건너뛰기" 버튼)
- 최대 2회 재시도 가능, 3번째 실패 시 재시도 버튼 비활성화
- "광고 건너뛰기" 버튼 항상 사용 가능 — 결과가 영구적으로 잠기지 않음

### 반응형 그래프 (`src/components/AssetChart.tsx`)

- 순수 SVG (차팅 라이브러리 없음) — 인라인으로 번들 감소
- 모바일 반응성을 위한 `viewBox` 스케일링
- 테마 색상용 CSS 변수 사용 (다크 모드 자동 적용)
- 자산 곡선 + 목표선 + 진행률 표시

## 테스트 전략

- **단위 테스트** `src/__tests__/` — 비즈니스 로직 (FIRE 계산, 검증, 스토리지)
- **컴포넌트 테스트** — React Router, localStorage, TDS 모의 객체와의 통합
- **시각화 테스트** `e2e/visual-smoke.spec.ts` — Playwright가 모바일 스크린샷 캡처
- **제출 전 게이트** — `npm run gate`가 타입 → 테스트 → 시각화 → 콘솔 체크 실행

### 테스트 실행

```bash
npx vitest run              # 단일 실행 (완료 후 종료)
npx vitest                  # 감시 모드 (파일 변경 시 재실행)
npm run test:visual         # Playwright 전체 테스트 + 스크린샷 캡처
npm run test:visual:update  # 시각화 스크린샷 재베이스라인
```

## 배포

앱은 빌드 파이프라인의 `ait` CLI를 통해 **Toss CDN**(Vercel이나 외부 클라우드 아님)에 배포됩니다.

- **앱 이름**: `earlyretiresim` (Toss 콘솔에 등록; 불일치 시 4031 오류)
- **런타임**: CSR만 가능 (정적 Vite 빌드 → 브라우저 렌더링)
- **빌드 결과물**: `dist/` 디렉토리 (파이프라인에서 Toss CDN에 업로드)

### 배포 전 체크리스트

1. ✅ `npx tsc --noEmit` 실행 — 모든 TypeScript 오류 수정
2. ✅ `npx vitest run` 실행 — 모든 테스트 통과
3. ✅ `npm run test:visual` 실행 — `e2e/__shots__/*.png` 스크린샷 검토
4. ✅ `npm run gate` 실행 — 최종 품질 게이트 (타입 + 테스트 + 시각화 + 콘솔 오류 없음)
5. ✅ 모든 import이 해결되는지, 플레이스홀더 마커(`@ai-factory:placeholder`)가 남지 않았는지 확인
6. ✅ App.tsx의 라우트가 모든 네비게이션 대상과 일치하는지 확인
7. ✅ 정상 흐름에서 `console.error` 0개

## 라이선스

MIT
