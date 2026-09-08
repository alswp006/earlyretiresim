import { LIMITS } from "@/lib/types";
import type { UserInput } from "@/lib/contract";

export function sanitizeNumeric(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.replace(/^0+(?=\d)/, "");
}

export function validateEmpty(value: unknown): string | null {
  if (value === undefined || value === null) return "필수 입력 항목이에요";
  return null;
}

interface ExpenseCompare {
  monthlyIncome: number;
  monthlyExpense: number;
}

export function validateInput(field: string, value: unknown): string | null {
  if (field === "age") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < LIMITS.age.min || n > LIMITS.age.max) {
      return `나이는 ${LIMITS.age.min}~${LIMITS.age.max}세만 입력할 수 있어요`;
    }
    return null;
  }

  if (field === "monthlyExpense" && typeof value === "object" && value !== null) {
    const { monthlyIncome, monthlyExpense } = value as ExpenseCompare;
    if (typeof monthlyIncome === "number" && typeof monthlyExpense === "number") {
      if (monthlyExpense >= monthlyIncome) {
        return "지출이 소득보다 크거나 같으면 은퇴 시점을 계산할 수 없어요";
      }
      return null;
    }
  }

  if (field === "monthlyIncome" || field === "monthlyExpense") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < LIMITS.money.min || n > LIMITS.money.max) {
      const label = field === "monthlyIncome" ? "소득" : "지출";
      return `${label}은 0원부터 ${LIMITS.money.max.toLocaleString("ko-KR")}원까지 입력할 수 있어요`;
    }
    return null;
  }

  if (field === "netWorth") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < LIMITS.netWorth.min || n > LIMITS.netWorth.max) {
      const eok = LIMITS.netWorth.max / 100000000;
      return `순자산은 0원부터 ${eok}억원까지 입력할 수 있어요`;
    }
    return null;
  }

  return null;
}

/** Home: 입력값 유효성 검사 (계약: src/lib/contract.ts validateUserInputFn) */
export function validateUserInput(input: Partial<UserInput>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.age === undefined || input.age === null) {
    errors.push("나이를 입력해 주세요");
  } else if (!Number.isFinite(input.age) || input.age < LIMITS.age.min || input.age > LIMITS.age.max) {
    errors.push(`나이는 ${LIMITS.age.min}~${LIMITS.age.max}세만 입력할 수 있어요`);
  }

  if (input.currentAssets === undefined || input.currentAssets === null) {
    errors.push("현재 자산을 입력해 주세요");
  } else if (!Number.isFinite(input.currentAssets) || input.currentAssets < 0) {
    errors.push("현재 자산은 0원 이상이어야 해요");
  }

  if (input.annualIncome === undefined || input.annualIncome === null) {
    errors.push("연간 소득을 입력해 주세요");
  } else if (!Number.isFinite(input.annualIncome) || input.annualIncome < 0) {
    errors.push("연간 소득은 0원 이상이어야 해요");
  }

  if (input.annualExpense === undefined || input.annualExpense === null) {
    errors.push("연간 지출을 입력해 주세요");
  } else if (!Number.isFinite(input.annualExpense) || input.annualExpense < 0) {
    errors.push("연간 지출은 0원 이상이어야 해요");
  }

  if (
    typeof input.annualIncome === "number" &&
    typeof input.annualExpense === "number" &&
    input.annualExpense >= input.annualIncome
  ) {
    errors.push("지출이 소득보다 크거나 같으면 은퇴 시점을 계산할 수 없어요");
  }

  if (input.targetAssets === undefined || input.targetAssets === null) {
    errors.push("목표 자산을 입력해 주세요");
  } else if (!Number.isFinite(input.targetAssets) || input.targetAssets <= 0) {
    errors.push("목표 자산은 0원보다 커야 해요");
  }

  if (input.annualReturn === undefined || input.annualReturn === null) {
    errors.push("예상 수익률을 입력해 주세요");
  } else if (!Number.isFinite(input.annualReturn) || input.annualReturn < -1 || input.annualReturn > 1) {
    errors.push("예상 수익률은 -100%~100% 사이여야 해요");
  }

  if (input.inflationRate === undefined || input.inflationRate === null) {
    errors.push("예상 물가상승률을 입력해 주세요");
  } else if (!Number.isFinite(input.inflationRate) || input.inflationRate < -1 || input.inflationRate > 1) {
    errors.push("물가상승률은 -100%~100% 사이여야 해요");
  }

  if (
    input.workYearsUntilRetirement !== undefined &&
    (!Number.isFinite(input.workYearsUntilRetirement) || input.workYearsUntilRetirement < 0)
  ) {
    errors.push("은퇴까지 남은 근무 연수는 0년 이상이어야 해요");
  }

  return { valid: errors.length === 0, errors };
}
