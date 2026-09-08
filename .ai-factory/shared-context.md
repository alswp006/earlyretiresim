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
    AssetChart.tsx
    BottomCTA.tsx
    Card.tsx
    CountUp.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    RewardGate.tsx
    ScenarioCompare.tsx
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
- AssetChart.tsx: AssetChart
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- RewardGate.tsx: RewardGate, useRewardGate
- ScenarioCompare.tsx: ScenarioCompare
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
- 0004: 자산 그래프 & 시나리오 비교 컴포넌트 (files: src/components/AssetChart.tsx, src/components/ScenarioCompare.tsx)
- 0005: 리워드 광고 게이트 (files: src/components/RewardGate.tsx)

## Available exports from existing files
// src/App.tsx
export default function App() {

// src/components/AdSlot.tsx
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {

// src/components/Amount.tsx
export function Amount({

// src/components/AssetChart.tsx
export function AssetChart({

// src/components/BottomCTA.tsx
export function SubmitFooter({
export function ButtonStack({

// src/components/Card.tsx
export function Card({

// src/components/CountUp.tsx
export function CountUp({

// src/components/FloatingTabBar.tsx
export type TabItem = {
export function FloatingTabBar({ items }: { items: TabItem[] }) {

// src/components/MiniBar.tsx
export function MiniBar({

// src/components/PageShell.tsx
export function PageShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {

// src/components/RewardGate.tsx
export function RewardGate({ slotId, children }: RewardGateProps) {
export function useRewardGate(): {

// src/components/ScenarioCompare.tsx
export function ScenarioCompare({

// src/components/ScreenScaffold.tsx
export function ScreenScaffold({

// src/components/Sparkline.tsx
export function Sparkline({

// src/components/StateView.tsx
export function EmptyState({
export function LoadingState({

// src/components/SummaryHero.tsx
export function SummaryHero({

// src/components/TossPurchase.tsx
export interface TossPurchaseResult {
export function TossPurchase({

// src/components/TossRewardAd.tsx
export function TossRewardAd({

// src/lib/contract.ts
export type UserInput = { age: number; annualExpense: number; currentAssets: number; annualIncome: number; targetAssets: number; annualReturn: number; inflationRate: number; workYearsUntilRetirement?: number };
export type FireResult = { isAchievable: boolean; yearsToFire: number; targetAssets: number; finalAssets: number; annualRetirementIncome: number; scenarioId?: string; calculatedAt: string };
export type Scenario = { id: string; name: string; input: UserInput; result: FireResult; createdAt: string };


## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(3), general(12), testing(1), ui(1)

Key lessons (verify against actual code before applying):
- [general] 화면·라우팅 등 소비자 모듈은 그것이 import하는 생산자 모듈이 병합된 뒤에만 병합하고, 순서를 지킬 수 없으면 소비자 병합과 동시에 최소 플레이스홀더를 만들어 매 병합 직후 타입체크와 빌드가 항상 통과하도록 유지하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 전역 라우팅·탭바·Provider 배선은 개별 화면보다 먼저(초반 20% 안에) 완료하고 미구현 화면은 스텁 라우트로 연결해, 시간 예산이 소진돼도 앱이 항상 실행 가능한 상태를 유지하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 저장·데이터 접근 등 기반 계층 패킷은 이를 import 하는 화면 패킷보다 반드시 먼저 완료·병합하고, 미완료면 상위 화면 패킷 병합을 차단하라 — 빈 기반 모듈 하나가 전 라우트 스모크를 무너뜨린다. (60% · 타 앱 1회 — 맹신 금지)
- [general] 외부에서 들어온 모든 값(라우터 state, 로컬 저장소, 부분 입력 폼)은 사용 직전에 배열·객체 기본값으로 정규화하고, 테이블/맵 조회 결과는 존재 확인 후에만 하위 속성이나 length에 접근하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 의존 그래프 최하층의 타입·계약 파일은 런타임 코드 0줄의 순수 선언으로 가장 먼저 단독 타입체크를 통과시키고, 파일 생성은 셸 명령이 아닌 허용된 편집 도구로만 하게 강제하라. (60% · 타 앱 1회 — 맹신 금지)