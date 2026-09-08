기존 내용을 그대로 유지하고, 두 시뮬레이션에서 발견된 누락 AC 7개(⭐ 표시)를 추가한 보완본입니다.

---

# EarlyRetireSim (early-retire-sim)

## Mini-PRD

- **한줄 요약**: 월 소득·지출·현재 자산을 입력하면 4% 룰 기반으로 몇 살에 조기은퇴(FIRE)가 가능한지 계산하고, 저축률 +10%p 시나리오와 비교해주는 시뮬레이터.
- **문제**: 기존 은퇴/재무 계산기는 UI가 낡고 40~50대 기준의 연금 중심이라, 파이어(FIRE)에 관심 있는 2030에게 "지금 이 저축률로 몇 살에 은퇴 가능한가"와 "조금 더 아끼면 얼마나 앞당겨지나"를 즉시 보여주지 못한다.
- **목표**: 입력 시작부터 결과 확인까지 60초 이내에 은퇴 가능 나이 + 시나리오 비교를 제공하고, 결과 화면 도달률 60% 이상.
- **타겟 유저**: 조기은퇴(파이어족) 트렌드에 관심 많은 2030 직장인 중, 현재 소득/지출로 몇 살에 은퇴 가능한지 궁금한 사람.
- **핵심 기능** (최대 3개):
  1. **FIRE 입력** — 나이/월 실수령액/월 지출/현재 순자산 입력 + 기대수익률 Chip 선택, 저축률 실시간 표시
  2. **은퇴 나이 계산 + 자산 성장 그래프** — 월 복리 시뮬레이션으로 목표자산(연지출×25) 도달 나이 계산, 연도별 자산 곡선 SVG 표시, 목표 진행률
  3. **시나리오 비교 + 공유 카드 복사** — 현재 저축률 vs 저축률 +10%p 결과를 나란히 비교하고, 요약 텍스트를 클립보드에 복사
- **비목표**:
  - 실제 계좌/카드 연동, 자동 소득·지출 수집 없음
  - 세금·국민연금·인플레이션 시나리오 세분화, 포트폴리오 종목 추천 없음
  - 계정/서버 저장·기기 간 동기화 없음 (localStorage 최근 입력값 1건만 보관)
- **수익 모델**: 결과 게이팅 리워드 광고 (`TossRewardAd`) + Home 하단 배너 (`AdSlot`)
  - 예상 수익(DAU 1,000 가정): 1,000 × 0.2 × 30 × $4/1000 × 1,350 × 0.85 = **약 27,540원/월**
  - 인앱광고 수수료 15%는 2026-07 현재 수취 유예(미확정) → 유예 반영 실질 수익 **약 32,400원/월**

> 설계 노트: MicroPlanning의 "슬라이더 입력"은 TDS 핵심 컴포넌트에 Slider가 없어 검수 리스크가 있으므로, **TextField(숫자) + Chip 프리셋(±10만원 / 수익률 선택)** 조합으로 대체한다. 그래프는 외부 차트 라이브러리 없이 **인라인 SVG + vars.color 토큰**으로 자체 구현한다(번들·검수 안전).

---

## SPEC

### F1: FIRE 입력 (Home)

- **AC-F1-1**: [U] Home 화면은 `현재 나이`, `월 실수령액(원)`, `월 지출(원)`, `현재 순자산(원)` 4개의 TDS TextField(`inputMode="numeric"`)를 위에서 이 순서로 표시한다.
- **AC-F1-2**: [E] 사용자가 숫자를 입력하면, 시스템은 입력 즉시 해당 필드에 천 단위 콤마를 적용해 표시한다(예: `3200000` → `3,200,000`), 내부 상태는 숫자형으로 보관한다.
- **AC-F1-3**: [E] `월 실수령액`과 `월 지출`이 모두 유효하게 입력되면, 시스템은 저축률 = `(소득−지출)/소득 × 100`을 소수 1자리로 계산해 입력 영역 하단에 `저축률 32.5% · 월 저축 1,040,000원` 형식으로 표시한다.
- **AC-F1-4**: [U] 기대 연수익률은 TDS Chip 3개(`4%`, `6%`, `8%`)로 제공하며 기본 선택은 `6%`, 동시에 1개만 선택된다.
- **AC-F1-5**: [W] `월 지출 ≥ 월 실수령액`이면, 시스템은 계산 버튼을 비활성화하고 지출 필드에 `hasError`와 help 텍스트 `지출이 소득보다 크거나 같으면 은퇴 시점을 계산할 수 없어요`를 표시한다.
- **AC-F1-6**: [E] 계산 버튼 탭 시, 시스템은 입력값을 localStorage 키 `ers:lastInput`에 저장하고 `/result`로 `useNavigate(..., { state })` 이동한다.

### F2: 은퇴 나이 계산 + 자산 성장 그래프 (Result)

- **AC-F2-1**: [U] 목표자산은 `월 지출 × 12 × 25`(4% 룰)로 계산해 `목표 자산 12억 3,000만원` 형식(formatCurrency)으로 표시한다.
- **AC-F2-2**: [U] 자산 시뮬레이션은 월 단위 복리로 계산한다: 월 수익률 `(1+연수익률)^(1/12) − 1`, 매월 `자산 = 자산×(1+월수익률) + 월저축액`. 최대 600개월(50년)까지 반복한다.
- **AC-F2-3**: [U] 은퇴 가능 나이는 자산이 목표자산 이상이 되는 첫 달의 나이로 계산하고, `43세 (12년 4개월 후)` 형식으로 표시한다.
- **AC-F2-4**: [W] 600개월 내 목표자산에 도달하지 못하면, 시스템은 은퇴 나이 대신 `현재 조건으로는 50년 내 목표 달성이 어려워요` 문구와 `저축률을 높이면?` 시나리오 카드로 유도한다(앱 크래시 없음).
- **AC-F2-5**: [U] 자산 성장 그래프는 인라인 SVG(viewBox 기반, 폭 100% 반응형, 높이 180px)로 연 단위 자산 곡선 1개와 목표자산 수평 점선 1개를 그리며, 색상은 `vars.color` 토큰만 사용한다.
- **AC-F2-6**: [U] 목표 진행률은 `현재 순자산 / 목표자산 × 100`을 소수 1자리로 계산해 `진행률 4.2%` 텍스트와 0~100% 범위로 클램프된 가로 진행 바(SVG/div)로 표시한다.

### F3: 시나리오 비교 + 공유 카드 복사 (Result)

- **AC-F3-1**: [U] 결과 하단에 `현재 저축률` / `저축률 +10%p` 2개 카드를 좌우 배치하고, 각 카드에 은퇴 나이·필요 기간·월 저축액을 표시한다.
- **AC-F3-2**: [U] `+10%p` 시나리오의 월 저축액은 `월 소득 × (현재저축률 + 10)/100`로 계산하며, 저축률 상한은 90%로 클램프한다.
- **AC-F3-3**: [E] 두 시나리오 모두 계산 가능하면, 시스템은 비교 카드 하단에 `저축률 10%p만 올려도 3년 2개월 빨라져요` 형식의 차이 문구를 표시한다.
- **AC-F3-4**: [E] `결과 복사하기` 버튼 탭 시, 시스템은 `EarlyRetireSim | 43세 은퇴 가능 | 저축률 32.5% | 목표 12억 3,000만원` 형식의 요약 텍스트를 클립보드에 복사하고 TDS Toast로 `결과를 복사했어요`를 표시한다.
- **AC-F3-5**: [W] 클립보드 API 호출이 실패하면, 시스템은 Toast로 `복사에 실패했어요. 다시 시도해주세요`를 표시하고 화면 상태는 그대로 유지한다(외부 앱 이동 없음).
- ⭐ **AC-F3-6**: [W] `monthsToFire === null`인 시나리오 카드는 은퇴 나이 자리에 `달성 어려움` 텍스트와 TDS Chip(비활성 스타일) 뱃지를 표시하고, 기간 자리는 `50년 내 미달성`으로 표시한다. 분기 규칙은 아래 3가지로 고정한다.
  - (a) `current !== null && boosted !== null`: AC-F3-3 차이 문구를 표시한다.
  - (b) `current === null && boosted !== null`: 차이 문구 대신 `저축률을 10%p 올리면 {boosted.retireAge}세에 은퇴할 수 있어요`를 표시한다.
  - (c) `current === null && boosted === null`: 차이 문구를 **렌더하지 않고**(DOM 미존재), `지출을 줄이거나 소득을 늘리면 목표에 닿을 수 있어요` 안내 1줄 + `다시 계산하기` 버튼만 표시한다.
  - `monthsSaved`는 (a)에서만 숫자값을 가지며, (b)/(c)에서는 `null`이고 어떤 경우에도 음수/NaN을 화면에 출력하지 않는다.
  - `boosted.savingsRate`가 90% 클램프로 인해 `current.savingsRate`와 같아지면(=현재 저축률 ≥ 90%) 비교 카드 대신 `이미 저축률 상한(90%)에 도달했어요` 1줄만 표시한다.

### 필수 AC (모든 QuickApp에 포함)

- **AC-INPUT-1**: [W] 4개 입력 필드 중 하나라도 비어 있으면 `은퇴 나이 계산하기` 버튼을 `disabled` 처리하고, 포커스 아웃된 빈 필드에 `hasError`를 표시한다.
- ⭐ **AC-INPUT-EMPTY-HELP**: [U] 포커스 아웃된 빈 필드는 `hasError={true}`와 함께 help 텍스트 `필수 입력 항목이에요`를 4개 필드(나이·월 실수령액·월 지출·현재 순자산) 모두 동일 문구로 표시하고, 값이 다시 입력되면 help 텍스트와 `hasError`를 즉시 제거한다.
- **AC-INPUT-2**: [W] 범위를 벗어난 값(나이 <19 또는 >70, 소득/지출 <0 또는 >100,000,000, 순자산 <0 또는 >10,000,000,000)은 help 텍스트로 허용 범위를 안내한다(예: `나이는 19~70세만 입력할 수 있어요`).
- ⭐ **AC-INPUT-FORMAT**: [E] TextField 입력값은 onChange 시점에 `value.replace(/[^0-9]/g, '')`로 숫자만 추출해 상태에 반영한다. 소수점(`.`)·마이너스(`-`)·공백·한글·이모지는 화면에 남지 않으며, 콤마는 AC-F1-2의 표시 포맷으로만 재삽입된다. 필터링 결과가 빈 문자열이면 값은 `undefined`(미입력)로 취급하고 AC-INPUT-EMPTY-HELP를 따른다. 선행 0은 제거한다(`007` → `7`). 필터링 자체로 에러 문구를 띄우지 않는다.
- **AC-EMPTY**: [S] 저장된 입력(`ers:lastInput`)이 없는 첫 진입 시, Home 상단에 TDS Pattern E 형식의 안내(`아직 계산 기록이 없어요 · 월 소득과 지출을 입력하면 은퇴 가능 나이를 알려드려요`)를 표시한다.
- ⭐ **AC-STORAGE-FAILURE**: [W] `localStorage.setItem`/`getItem`/`JSON.parse` 중 예외(QuotaExceededError, 시크릿 모드, 손상된 JSON 등)가 발생하면 시스템은 다음을 모두 만족한다.
  - 저장 실패: `/result` 라우팅은 정상 진행하고(입력값은 route state로 전달), Toast로 `계산 기록을 저장하지 못했어요`를 1회 표시한다.
  - 읽기/파싱 실패: 저장값이 없는 것으로 간주해 AC-EMPTY의 Empty State를 표시하고, 손상된 키는 `removeItem`으로 정리한다.
  - 모든 실패는 `try/catch`로 흡수하며 `console.error` 출력 0건(AC-REVIEW-2 유지).
- **AC-LOADING**: [S] `/result` 진입 후 시뮬레이션 계산 중에는 TDS Spinner와 `계산 중이에요` 문구를 표시하고, 계산 완료 시 200ms 이내에 결과 영역으로 전환한다.
- **AC-ERROR**: [W] 계산 중 예외 발생 또는 route state 누락 시, `결과를 불러오지 못했어요` 메시지와 `다시 입력하기` 버튼(→ `/`)을 표시한다.
- **AC-A11Y-1**: [U] 모든 Button/TextField에 목적을 설명하는 `aria-label`을 부여한다(예: `aria-label="월 실수령액 입력"`).
- **AC-A11Y-2**: [U] 모든 터치 타겟은 최소 44×44px 이상이다(TDS 기본 사이즈 유지, 축소 스타일 금지).
- **AC-A11Y-3**: [U] 모든 색상은 `vars.color` 토큰만 사용하고 HEX 하드코딩은 0건이다(SVG 그래프의 stroke/fill 포함).
- **AC-REWARD**: [E] `/result`의 결과 영역은 `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>`로 감싸며, 광고 시청 완료 후에만 은퇴 나이·그래프·시나리오가 공개된다.
- ⭐ **AC-REWARD-TIMEOUT**: [E] `/result` 진입과 동시에 5,000ms 타이머를 시작하고, 그 안에 광고가 준비(ready) 또는 시청 완료(watched) 상태로 전이하지 않으면 시스템은 로딩 Spinner를 해제하고 폴백 UI(AC-REWARD-FALLBACK)로 전환한다. 광고가 정상 시청 완료되면 타이머는 `clearTimeout`으로 해제되어 폴백 UI가 뜨지 않는다.
- ⭐ **AC-REWARD-FALLBACK**: [W] 광고 초기화 실패·에러 콜백 수신·AC-REWARD-TIMEOUT 발동 중 하나라도 발생하면, 시스템은 다음 3요소를 표시하고 무한 로딩 상태에 머무르지 않는다.
  1. 안내 문구 `광고를 불러올 수 없어요. 인터넷 연결을 확인해주세요`
  2. `다시 시도` 버튼 — 광고 로드를 1회 재시도하고 5초 타이머를 다시 시작한다(최대 재시도 2회, 2회 소진 후에는 버튼을 `disabled` 처리)
  3. `결과 보기` 버튼 — 탭 시 광고 없이 결과 영역을 공개한다(리워드 광고 실패로 결과 열람이 영구 차단되지 않음)
  - 폴백 경로로 결과를 공개해도 외부 로깅 SDK 호출은 0건이며(AC-REVIEW-3 유지), `console.error`도 출력하지 않는다.
- ⭐ **AC-NETWORK-RESILIENCE**: [W] 오프라인/불안정 네트워크(WebView 3G 등)에서도 앱은 다음과 같이 동작한다. ① 입력·검증·시뮬레이션 계산은 순수 함수·로컬 연산이므로 네트워크와 무관하게 정상 수행된다. ② 광고(배너/리워드) 로드 실패는 AC-REWARD-FALLBACK으로 흡수하며, `AdSlot` 배너 실패 시 배너 영역을 렌더하지 않고(빈 공간·에러 박스 노출 금지) 나머지 화면은 그대로 동작한다. ③ 저장소 실패는 AC-STORAGE-FAILURE로 흡수한다. ④ 어떤 경우에도 흰 화면(white screen)·앱 크래시·무한 Spinner가 발생하지 않는다.
- **AC-FORMAT**: [U] 모든 금액은 `formatCurrency`, 개수/연수 등 숫자는 `formatNumber`를 사용해 출력한다(`1,234,567원`).
- **AC-REVIEW-1**: [W] 외부 도메인으로 이동하는 링크(`<a href="http...">`, `window.open`)는 0건이다.
- **AC-REVIEW-2**: [U] 정상 플로우(입력→계산→결과→복사) 실행 시 `console.error` 출력 0건이다.
- **AC-REVIEW-3**: [W] GA/Amplitude 등 외부 로깅 SDK를 포함하지 않는다.
- **AC-KEYBOARD**: [E] TextField 포커스 시, 시스템은 해당 필드를 `scrollIntoView({ block: 'center' })`로 이동시켜 키보드가 입력 필드와 하단 버튼을 가리지 않게 한다.

---

### Screen Definitions

#### Home (`/`)
- 구성: Top(타이틀 `조기은퇴 시뮬레이터`) → Empty State 안내(첫 진입) → TextField 4개 → 기대수익률 Chip 3개 → 저축률 요약 ListRow → `은퇴 나이 계산하기` Button → `AdSlot` 배너
- 상태: `초기(빈 입력/Empty State)` / `입력 중(저축률 실시간 표시)` / `검증 오류(hasError + help)` / `저장값 복원됨` / ⭐ `저장 실패(Toast 1회, 라우팅은 진행)`
- 네비게이션: 버튼 탭 → `navigate('/result', { state: { input } })`
- 간격은 TDS `Spacing`(size prop 필수)만 사용

#### Result (`/result`)
- 구성: Top(뒤로가기) → `TossRewardAd` 게이트 → [은퇴 나이 히어로 카드 · 진행률 바 · 자산 성장 SVG 그래프 · 시나리오 비교 2카드 · 결과 복사 버튼 · 다시 계산하기 버튼]
- 상태: `광고 대기` / ⭐ `광고 폴백(안내 + 다시 시도 + 결과 보기)` / `계산 로딩` / `결과 표시` / `달성 불가 안내` / ⭐ `양쪽 시나리오 미달성(차이 문구 숨김)` / `에러`
- ⭐ 상태 전이: `adLoading` --(5초 초과 | onError)--> `adFailed` --(다시 시도)--> `adLoading` / --(결과 보기)--> `revealed`; `adLoading` --(시청 완료)--> `revealed`
- `다시 계산하기` → `navigate('/')`

---

### Data Model

```typescript
// src/lib/types.ts
export interface FireInput {
  age: number;            // 19~70
  monthlyIncome: number;  // 원, 0~100_000_000
  monthlyExpense: number; // 원, 0~100_000_000
  netWorth: number;       // 원, 0~10_000_000_000
  annualReturnRate: 0.04 | 0.06 | 0.08;
}

export interface ScenarioResult {
  savingsRate: number;        // %, 소수 1자리
  monthlySaving: number;      // 원
  targetAsset: number;        // 원 = monthlyExpense*12*25
  monthsToFire: number | null;// null = 600개월 내 미달성
  retireAge: number | null;
  series: { year: number; asset: number }[]; // 그래프용 연 단위
}

export interface FireResult {
  current: ScenarioResult;
  boosted: ScenarioResult;    // 저축률 +10%p (상한 90%)
  progressPercent: number;    // netWorth/targetAsset*100, 0~100 클램프
  monthsSaved: number | null; // current - boosted (양쪽 달성 시에만 숫자)
}

// Route state (react-router useNavigate)
export interface RouteState {
  input: FireInput;
}

// ⭐ 광고 게이트 상태 (AC-REWARD-TIMEOUT / AC-REWARD-FALLBACK)
export type RewardGateState = 'adLoading' | 'adFailed' | 'revealed';

// ⭐ 시나리오 비교 분기 (AC-F3-6)
export type CompareMode = 'both' | 'boostedOnly' | 'neither' | 'capped';

export const REWARD_AD_TIMEOUT_MS = 5000;
export const REWARD_AD_MAX_RETRY = 2;
export const MAX_SAVINGS_RATE = 90;
```

---

## TASK

### Epic 1: Data Layer

**Task 1 — `src/lib/types.ts`**
- 내용: `FireInput`, `ScenarioResult`, `FireResult`, `RouteState`, ⭐`RewardGateState`, ⭐`CompareMode` 및 입력 범위 상수(`LIMITS`), ⭐광고 상수(`REWARD_AD_TIMEOUT_MS`, `REWARD_AD_MAX_RETRY`) 정의
- Covers: AC-INPUT-2, AC-F1-1, ⭐AC-REWARD-TIMEOUT(타입/상수)
- Files: `src/lib/types.ts`
- DoD: `tsc --noEmit` 통과, 다른 모듈에서 import 가능

**Task 2 — `src/lib/fire.ts` (순수 계산 로직)**
- 내용: `calcSavingsRate`, `calcTargetAsset`, `simulate(input, monthlySaving): ScenarioResult`(월 복리, 최대 600개월, 연 단위 series 생성), `calcFireResult(input): FireResult`(current/boosted/progress/monthsSaved), ⭐`getCompareMode(result): CompareMode`(both/boostedOnly/neither/capped 판정, `monthsSaved`는 both일 때만 숫자)
- Covers: AC-F1-3, AC-F2-1, AC-F2-2, AC-F2-3, AC-F2-4, AC-F2-6, AC-F3-2, AC-F3-3, ⭐AC-F3-6
- Files: `src/lib/fire.ts`
- DoD: 순수 함수(React/DOM 의존 0), 지출≥소득·600개월 미달성 케이스에서 예외 없이 `monthsToFire: null` 반환, ⭐`monthsSaved`가 음수/NaN이 되는 입력이 0건(양쪽 달성이 아니면 `null`)

**Task 3 — `src/lib/validation.ts` + `src/lib/share.ts` + ⭐`src/lib/storage.ts`**
- 내용: 필드별 검증 함수(`validateInput(input): Record<field, string | null>`), ⭐`validateEmpty(value): string | null`(`필수 입력 항목이에요`), ⭐`sanitizeNumeric(raw: string): string`(숫자 외 문자 제거 + 선행 0 제거), 요약 텍스트 생성 `buildShareText(result, input)`, `copyToClipboard(text): Promise<boolean>`, ⭐`safeGet<T>(key): T | null` / `safeSet(key, value): boolean`(try-catch, 파싱 실패 시 `removeItem`, console 출력 0건)
- Covers: AC-INPUT-1, AC-INPUT-2, AC-F1-5, AC-F3-4, AC-F3-5, ⭐AC-INPUT-EMPTY-HELP, ⭐AC-INPUT-FORMAT, ⭐AC-STORAGE-FAILURE
- Files: `src/lib/validation.ts`, `src/lib/share.ts`, ⭐`src/lib/storage.ts`
- DoD: 경계값(19/70, 0/1억) 검증 결과가 명세와 일치, 클립보드 실패 시 `false` 반환(throw 없음), ⭐`sanitizeNumeric('1,2.3-4가🙂')==='1234'`, ⭐storage 함수는 어떤 입력에도 throw하지 않고 `false`/`null` 반환

### Epic 2: Components

**Task 4 — `src/components/AssetChart.tsx`**
- 내용: `series`, `targetAsset`을 받아 인라인 SVG 라인 차트 렌더(viewBox `0 0 320 180`, 반응형 width 100%, 목표선 점선, 도달 지점 마커). 색상은 `vars.color` 토큰만 사용
- Covers: AC-F2-5, AC-A11Y-3
- Files: `src/components/AssetChart.tsx`
- DoD: HEX 하드코딩 0건, series 길이 1 또는 0에서도 크래시 없음, `role="img"` + `aria-label` 부여

**Task 5 — `src/components/ScenarioCompare.tsx`**
- 내용: `current`/`boosted` 2카드 flex 배치(커스텀 CSS는 flex 배치에만), 은퇴 나이·기간·월 저축액 표시(formatCurrency), 하단 차이 문구, ⭐`mode: CompareMode`에 따른 조건부 렌더(`both`=차이 문구 / `boostedOnly`=대체 문구 / `neither`=차이 문구 DOM 미렌더 + 안내 1줄 / `capped`=상한 안내 1줄), ⭐`monthsToFire === null` 카드에 `달성 어려움` 뱃지 + `50년 내 미달성`
- Covers: AC-F3-1, AC-F3-3, ⭐AC-F3-6, AC-FORMAT
- Files: `src/components/ScenarioCompare.tsx`
- DoD: `monthsToFire === null` 시 `달성 어려움` 표기, TDS 컴포넌트 padding 오버라이드 0건, ⭐4개 mode 각각에서 렌더 스냅샷 확인 및 `NaN`/`undefined` 텍스트 출력 0건

⭐ **Task 5b — `src/components/RewardGate.tsx` (광고 게이트 래퍼)**
- 내용: `TossRewardAd`를 감싸는 상태 머신 컴포넌트. `adLoading` 진입 시 `REWARD_AD_TIMEOUT_MS` 타이머 시작, 시청 완료/에러/타임아웃에 따라 `RewardGateState` 전이. `adFailed`에서 안내 문구 + `다시 시도`(최대 2회, 소진 시 disabled) + `결과 보기` 버튼 렌더, `revealed`에서만 `children` 렌더. 언마운트 시 `clearTimeout`
- Covers: ⭐AC-REWARD-TIMEOUT, ⭐AC-REWARD-FALLBACK, AC-REWARD
- Files: `src/components/RewardGate.tsx`
- DoD: `revealed` 이전에는 children이 DOM에 없음, 타임아웃 후 Spinner가 남지 않음, `다시 시도` 3번째 탭 불가(disabled), 광고 실패 시 `console.error` 0건, 언마운트 후 타이머 콜백으로 인한 setState 경고 0건

### Epic 3: Pages

**Task 6 — `src/pages/Home.tsx` (입력 + 검증)**
- 내용: TextField 4개 + 수익률 Chip + 저축률 요약 ListRow + Empty State + 계산 버튼, ⭐`sanitizeNumeric` 기반 콤마 포맷 입력, ⭐빈 필드 blur 시 `필수 입력 항목이에요` help, ⭐`safeGet`/`safeSet` 사용한 `ers:lastInput` 복원/저장 + 저장 실패 Toast, focus 시 `scrollIntoView`
- Covers: AC-F1-1~6, AC-INPUT-1, AC-INPUT-2, ⭐AC-INPUT-EMPTY-HELP, ⭐AC-INPUT-FORMAT, ⭐AC-STORAGE-FAILURE, AC-EMPTY, AC-KEYBOARD, AC-A11Y-1, AC-A11Y-2
- Files: `src/pages/Home.tsx`
- DoD: 빈 입력에서 버튼 disabled, 지출≥소득에서 `hasError`+help 노출, 새로고침 후 이전 입력 복원, ⭐localStorage 차단 환경(시크릿 모드 시뮬레이션)에서도 계산 플로우 정상 진행

**Task 7 — `src/pages/Result.tsx` (광고 게이트 + 결과)**
- 내용: route state 수신 → 로딩(Spinner) → ⭐`RewardGate`로 결과 게이팅(타임아웃/폴백 포함) → 히어로 카드/진행률 바/`AssetChart`/`ScenarioCompare`(⭐`getCompareMode` 결과 전달)/복사 버튼/다시 계산 버튼, 에러 fallback
- Covers: AC-REWARD, ⭐AC-REWARD-TIMEOUT, ⭐AC-REWARD-FALLBACK, ⭐AC-F3-6, ⭐AC-NETWORK-RESILIENCE, AC-LOADING, AC-ERROR, AC-F2-1, AC-F2-3, AC-F2-4, AC-F2-6, AC-F3-4, AC-F3-5, AC-FORMAT
- Files: `src/pages/Result.tsx`
- DoD: state 없이 `/result` 직접 진입 시 에러 화면 + `다시 입력하기` 동작, 광고 시청 전 결과 텍스트 DOM 미노출, ⭐기내 모드(오프라인)에서 5초 후 폴백 UI 노출 및 `결과 보기`로 결과 열람 가능, ⭐양쪽 미달성 입력에서 차이 문구 미렌더

**Task 8 — Home 배너 + `src/App.tsx` 라우팅 연결**
- 내용: `AdSlot`을 Home 하단에 배치(⭐로드 실패 시 영역 미렌더), `App.tsx`에 `/`, `/result` Route 등록 및 unknown path → `/` 리다이렉트
- Covers: AC-REVIEW-1, AC-REVIEW-2, AC-REVIEW-3, ⭐AC-NETWORK-RESILIENCE(배너 부분)
- Files: `src/App.tsx`, `src/pages/Home.tsx`
- DoD: 빌드 성공, 전체 플로우 실행 시 console.error 0건, 외부 링크·외부 로깅 SDK 0건, ⭐오프라인 상태에서 Home 진입 시 흰 화면 없이 입력 UI 정상 표시

---

## AC Coverage

| Epic/Task | Covers |
|---|---|
| Task 1 | AC-INPUT-2, AC-F1-1, ⭐AC-REWARD-TIMEOUT(상수) |
| Task 2 | AC-F1-3, AC-F2-1~4, AC-F2-6, AC-F3-2, AC-F3-3, ⭐AC-F3-6 |
| Task 3 | AC-INPUT-1, AC-INPUT-2, AC-F1-5, AC-F3-4, AC-F3-5, ⭐AC-INPUT-EMPTY-HELP, ⭐AC-INPUT-FORMAT, ⭐AC-STORAGE-FAILURE |
| Task 4 | AC-F2-5, AC-A11Y-3 |
| Task 5 | AC-F3-1, AC-F3-3, ⭐AC-F3-6, AC-FORMAT |
| ⭐Task 5b | AC-REWARD, ⭐AC-REWARD-TIMEOUT, ⭐AC-REWARD-FALLBACK |
| Task 6 | AC-F1-1~6, AC-INPUT-1/2, ⭐AC-INPUT-EMPTY-HELP, ⭐AC-INPUT-FORMAT, ⭐AC-STORAGE-FAILURE, AC-EMPTY, AC-KEYBOARD, AC-A11Y-1/2 |
| Task 7 | AC-REWARD, ⭐AC-REWARD-TIMEOUT, ⭐AC-REWARD-FALLBACK, ⭐AC-F3-6, ⭐AC-NETWORK-RESILIENCE, AC-LOADING, AC-ERROR, AC-F2-1/3/4/6, AC-F3-4/5, AC-FORMAT |
| Task 8 | AC-REVIEW-1/2/3, ⭐AC-NETWORK-RESILIENCE |

- **Total**: 38개 (F1: 6, F2: 6, F3: 6, 필수: 20)
- **Covered**: 38개 (100%)
- **Uncovered**: 0개

---

## 보완 요약 (이번 추가분)

| 추가 AC | 출처 | 해결하는 문제 | 영향 Task |
|---|---|---|---|
| ⭐AC-F3-6 | 여정 시뮬 ③ | 한쪽/양쪽 시나리오 미달성 시 UI·차이 문구 분기 미정의 | 2, 5, 7 |
| ⭐AC-INPUT-EMPTY-HELP | 에러 시뮬 ② | `hasError`만 있고 help 문구 미정의 | 3, 6 |
| ⭐AC-INPUT-FORMAT | 에러 시뮬 ④ | `inputMode="numeric"`의 브라우저별 편차(소수점·부호·특수문자) | 3, 6 |
| ⭐AC-STORAGE-FAILURE | 에러 시뮬 ③ | localStorage 저장/파싱 실패 시 동작 미정의 | 3, 6 |
| ⭐AC-REWARD-TIMEOUT | 여정 시뮬 ② | 광고 무한 대기 가능성(타임아웃 5초로 확정) | 1, 5b, 7 |
| ⭐AC-REWARD-FALLBACK | 여정 시뮬 ① / 에러 시뮬 ① | 광고 실패 시 결과 영구 차단 방지(다시 시도 2회 + 결과 보기) | 5b, 7 |
| ⭐AC-NETWORK-RESILIENCE | 에러 시뮬 ⑤ | 오프라인/불안정 네트워크에서의 Graceful Degradation 기준 | 7, 8 |

**의도적으로 반영하지 않은 제안**
- "폴백으로 결과 열람 시 조회 기록 로깅" → AC-REVIEW-3(외부 로깅 SDK 금지)과 충돌하므로 제외.
- 광고 타임아웃 값은 시뮬레이션 제안(5초 vs 30초)이 엇갈려 **5,000ms로 단일 확정**(30초 대기는 모바일 UX상 이탈 유발).