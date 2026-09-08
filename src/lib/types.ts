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
