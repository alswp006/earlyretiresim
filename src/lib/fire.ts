import type { ScenarioResult, FireResult, CompareMode } from "@/lib/types";
import type { UserInput, FireResult as CalcFireResult } from "@/lib/contract";

const MAX_MONTHS = 600;
const MAX_YEARS = 60;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calcSavingsRate(monthlyIncome: number, monthlyExpense: number): number {
  if (monthlyIncome <= 0) return 0;
  const rate = ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100;
  return round1(rate);
}

export function calcTargetAsset(monthlyExpense: number): number {
  return monthlyExpense * 12 * 25;
}

function runCompound(
  startingAsset: number,
  monthlySaving: number,
  targetAsset: number,
  annualReturnRate: number
): { monthsToFire: number | null; series: { year: number; asset: number }[] } {
  if (monthlySaving <= 0) {
    return { monthsToFire: null, series: [] };
  }

  const monthlyRate = Math.pow(1 + annualReturnRate, 1 / 12) - 1;
  let asset = startingAsset;
  let monthsToFire: number | null = null;
  const series: { year: number; asset: number }[] = [];

  for (let month = 1; month <= MAX_MONTHS; month++) {
    asset = asset * (1 + monthlyRate) + monthlySaving;
    if (month % 12 === 0) {
      series.push({ year: month / 12, asset });
    }
    if (monthsToFire === null && asset >= targetAsset) {
      monthsToFire = month;
      break;
    }
  }

  if (monthsToFire === null) {
    return { monthsToFire: null, series: [] };
  }

  return { monthsToFire, series };
}

export function simulate(
  currentAge: number,
  asset: number,
  monthlyIncome: number,
  monthlyExpense: number,
  targetAsset: number,
  annualReturnRate: number
): ScenarioResult {
  const savingsRate = calcSavingsRate(monthlyIncome, monthlyExpense);
  const monthlySaving = monthlyIncome - monthlyExpense;
  const { monthsToFire, series } = runCompound(asset, monthlySaving, targetAsset, annualReturnRate);

  return {
    savingsRate,
    monthlySaving,
    targetAsset,
    monthsToFire,
    retireAge: monthsToFire === null ? null : currentAge + monthsToFire / 12,
    series,
  };
}

export function calcBoostedScenario(
  current: ScenarioResult,
  monthlyIncome: number,
  targetAsset: number,
  currentAge: number,
  annualReturnRate: number
): ScenarioResult {
  const savingsRate = Math.min(current.savingsRate + 10, 90);
  const monthlySaving = (monthlyIncome * savingsRate) / 100;

  if (current.monthsToFire === null) {
    return { savingsRate, monthlySaving, targetAsset, monthsToFire: null, retireAge: null, series: [] };
  }

  const { monthsToFire, series } = runCompound(0, monthlySaving, targetAsset, annualReturnRate);

  return {
    savingsRate,
    monthlySaving,
    targetAsset,
    monthsToFire,
    retireAge: monthsToFire === null ? null : currentAge + monthsToFire / 12,
    series,
  };
}

export function calcMonthsSaved(current: ScenarioResult, boosted: ScenarioResult): number | null {
  if (current.monthsToFire === null || boosted.monthsToFire === null) return null;
  return current.monthsToFire - boosted.monthsToFire;
}

export function calcProgressPercent(netWorth: number, targetAsset: number): number {
  if (targetAsset <= 0) return 0;
  const pct = (netWorth / targetAsset) * 100;
  return round1(Math.max(0, Math.min(100, pct)));
}

export function getCompareMode(current: ScenarioResult, boosted: ScenarioResult): CompareMode {
  if (current.savingsRate >= 90) return "capped";
  if (current.monthsToFire === null && boosted.monthsToFire === null) return "neither";
  if (current.monthsToFire === null) return "boostedOnly";
  return "both";
}

/** Home → Result: 핵심 계산 엔진 (계약: src/lib/contract.ts calculateFireFn) */
export function calculateFire(input: UserInput): CalcFireResult {
  const { currentAssets, annualIncome, annualExpense, targetAssets, annualReturn, inflationRate, workYearsUntilRetirement } = input;

  // 인플레이션을 반영한 실질 수익률
  const realReturnRate = (1 + annualReturn) / (1 + inflationRate) - 1;
  const annualSavings = annualIncome - annualExpense;
  const maxYears = workYearsUntilRetirement && workYearsUntilRetirement > 0 ? Math.min(workYearsUntilRetirement, MAX_YEARS) : MAX_YEARS;

  let assets = currentAssets;
  let yearsToFire = maxYears;
  let isAchievable = false;

  if (assets >= targetAssets) {
    yearsToFire = 0;
    isAchievable = true;
  } else {
    for (let year = 1; year <= maxYears; year++) {
      assets = assets * (1 + realReturnRate) + annualSavings;
      if (assets >= targetAssets) {
        yearsToFire = year;
        isAchievable = true;
        break;
      }
    }
  }

  const finalAssets = Math.max(0, Math.round(assets));
  const annualRetirementIncome = Math.round(finalAssets * 0.04);

  return {
    isAchievable,
    yearsToFire,
    targetAssets,
    finalAssets,
    annualRetirementIncome,
    calculatedAt: new Date().toISOString(),
  };
}

export function calcFireResult(
  current: ScenarioResult,
  boosted: ScenarioResult,
  netWorth: number
): FireResult {
  return {
    current: current.monthsToFire ?? 0,
    boosted: boosted.monthsToFire ?? 0,
    progressPercent: calcProgressPercent(netWorth, current.targetAsset),
    monthsSaved: calcMonthsSaved(current, boosted),
  };
}
