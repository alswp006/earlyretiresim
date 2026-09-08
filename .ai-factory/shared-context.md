# Shared Context (auto-generated — do NOT modify)


## 패킷 간 계약 (src/lib/contract.ts — 자동 생성, 수정 금지)
여기 선언된 이름·인자·반환 타입은 확정이다. 기반 패킷은 이대로 구현하고,
화면 패킷은 이대로 호출하라. 다르게 만들지 마라.

```typescript
/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** Home 입력값 → FIRE 계산 input (구현: 패킷 0001) */
export type UserInput = { age: number; annualExpense: number; currentAssets: number; annualIncome: number; targetAssets: number; annualReturn: number; inflationRate: number; workYearsUntilRetirement?: number };

/** FIRE 계산 output → Result 표시, 차트 데이터 (구현: 패킷 0001) */
export type FireResult = { isAchievable: boolean; yearsToFire: number; targetAssets: number; finalAssets: number; annualRetirementIncome: number; scenarioId?: string; calculatedAt: string };

/** 저장된 시나리오 → 비교/로드 (구현: 패킷 0001) */
export type Scenario = { id: string; name: string; input: UserInput; result: FireResult; createdAt: string };

/** Home → Result: 핵심 계산 엔진 (구현: 패킷 0002) */
export type calculateFireFn = (input: UserInput) => FireResult;

/** Home: 입력값 유효성 검사 (구현: 패킷 0003) */
export type validateUserInputFn = (input: Partial<UserInput>) => { valid: boolean; errors: string[] };

/** Result: 시나리오 저장, 반환 ID (구현: 패킷 0003) */
export type saveScenarioFn = (scenario: Scenario) => Promise<string>;

/** Result, App: 저장된 시나리오 로드 (구현: 패킷 0003) */
export type loadScenarioFn = (id: string) => Promise<Scenario | null>;

/** Result: 공유 링크 생성 (구현: 패킷 0003) */
export type generateShareUrlFn = (scenario: Scenario) => Promise<string>;

/** Result: 자산 증가 그래프 props (구현: 패킷 0004) */
export type AssetChartProps = { result: FireResult; scenarioComparisons?: FireResult[] };

/** Result: 시나리오 비교 테이블 props (구현: 패킷 0004) */
export type ScenarioCompareProps = { scenarios: Scenario[]; baseScenarioId: string };

/** Home: 광고 게이트 props (구현: 패킷 0005) */
export type RewardGateProps = { onWatched: () => void; feature: 'calculate' | 'save' | 'share' };

/** Home, Result: 광고 시청 상태 hook (구현: 패킷 0005) */
export type useRewardGateFn = () => { isWatched: boolean; isLoading: boolean; watchAd: () => Promise<boolean> };

/** 라우팅 상태 (Router state 또는 Context API) (구현: 패킷 0008) */
export type PageContext = { currentPage: 'home' | 'result'; lastCalculation?: FireResult; scenarioId?: string };

/** Home → Result: 계산 후 이동 (구현: 패킷 0008) */
export type navigateToResultFn = (result: FireResult, scenarioId?: string) => void;

/** Result → Home: 새 계산 시작 (구현: 패킷 0008) */
export type navigateToHomeFn = () => void;

```

## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
// Domain types — FIRE(경제적 자립·조기은퇴) 계산 앱

export interface FireInput {
  age: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netWorth: number;
  annualReturnRate: 0.04 | 0.06 | 0.08;
}

export interface ScenarioResult {
  savingsRate: number;
  monthlySaving: number;
  targetAsset: number;
  monthsToFire: number | null;
  retireAge: number | null;
  series: { year: number; asset: number }[];
}

export interface FireResult {
  current: number;
  boosted: number;
  progressPercent: number;
  monthsSaved: number | null;
}

export interface RouteState {
  input: FireInput;
}

export type RewardGateState = "adLoading" | "adFailed" | "revealed";

export type CompareMode = "both" | "boostedOnly" | "neither" | "capped";

export const LIMITS = {
  age: { min: 19, max: 70 },
  money: { min: 0, max: 100000000 },
  netWorth: { min: 0, max: 10000000000 },
} as const;

export const REWARD_AD_TIMEOUT_MS = 5000;
export const REWARD_AD_MAX_RETRY = 2;
export const MAX_SAVINGS_RATE = 90;
export const STORAGE_KEY = "ers:lastInput";

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    Card.tsx
    CountUp.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
  lib/
    contract.ts
    fire.ts
    share.ts
    storage.ts
    types.ts
    utils.ts
    validation.ts
  main.tsx
  pages/
    Home.tsx
    Result.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- contract.ts: export type UserInput =; export type FireResult =; export type Scenario =; export type calculateFireFn = (input: UserInput) => FireResult; export type validateUserInputFn = (input: Partial<UserInput>) =>; export type saveScenarioFn = (scenario: Scenario) => Promise<string>; export type loadScenarioFn = (id: string) => Promise<Scenario | null>; export type generateShareUrlFn = (scenario: Scenario) => Promise<string>
- fire.ts: export function calcSavingsRate(monthlyIncome: number, monthlyExpense: number): number; export function calcTargetAsset(monthlyExpense: number): number; export function simulate( currentAge: number, asset: number, monthlyIncome: number, monthlyExpense: number, targetAsset:; export function calcBoostedScenario( current: ScenarioResult, monthlyIncome: number, targetAsset: number, currentAge: nu; export function calcMonthsSaved(current: ScenarioResult, boosted: ScenarioResult): number | null; export function calcProgressPercent(netWorth: number, targetAsset: number): number; export function getCompareMode(current: ScenarioResult, boosted: ScenarioResult): CompareMode; export function calculateFire(input: UserInput): CalcFireResult
- share.ts: export interface ShareResultInput; export function buildShareText( result: ShareResultInput, _input: Pick<FireInput, "age" | "monthlyExpense"> ): string; export async function generateShareUrl(scenario: Scenario): Promise<string>; export async function copyToClipboard(text: string): Promise<boolean>
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void; export function safeSet(key: string, value: unknown): boolean; export function safeGet<T>(key: string): T | null; export function safeRemove(key: string): boolean; export async function saveScenario(scenario: Scenario): Promise<string>; export async function loadScenario(id: string): Promise<Scenario | null>
- types.ts: export interface FireInput; export interface ScenarioResult; export interface FireResult; export interface RouteState; export type RewardGateState = "adLoading" | "adFailed" | "revealed"; export type CompareMode = "both" | "boostedOnly" | "neither" | "capped"; export const LIMITS =; export const REWARD_AD_TIMEOUT_MS = 5000
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string
- validation.ts: export function sanitizeNumeric(raw: string): string; export function validateEmpty(value: unknown): string | null; export function validateInput(field: string, value: unknown): string | null; export function validateUserInput(input: Partial<UserInput>):

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd

### Module Dependencies (import graph)
  lib/fire.ts → imports: lib/types, lib/contract
  lib/share.ts → imports: lib/types, lib/contract
  lib/storage.ts → imports: lib/contract
  lib/validation.ts → imports: lib/types, lib/contract
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: Types & Constants (files: src/lib/types.ts)
- 0002: FIRE 계산 로직 (files: src/lib/fire.ts)
- 0003: 검증·공유·저장 유틸 (files: src/lib/validation.ts, src/lib/share.ts, src/lib/storage.ts)