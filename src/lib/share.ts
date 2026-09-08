import type { FireInput, ScenarioResult } from "@/lib/types";
import type { Scenario } from "@/lib/contract";

export interface ShareResultInput {
  current: ScenarioResult;
  boosted?: Partial<ScenarioResult>;
}

function formatEok(amount: number): string {
  const eok = Math.floor(amount / 100000000);
  const manwon = Math.round((amount % 100000000) / 10000);
  if (manwon === 0) return `${eok}억원`;
  return `${eok}억 ${manwon.toLocaleString("ko-KR")}만원`;
}

export function buildShareText(
  result: ShareResultInput,
  _input: Pick<FireInput, "age" | "monthlyExpense">
): string {
  const { current } = result;
  const status =
    current.monthsToFire === null || current.retireAge === null
      ? "달성 어려움"
      : `${Math.round(current.retireAge)}세 은퇴 가능`;
  const rate = Number(current.savingsRate.toFixed(1));
  const target = formatEok(current.targetAsset);

  return `EarlyRetireSim | ${status} | 저축률 ${rate}% | 목표 ${target}`;
}

/** Result: 공유 링크 생성 (계약: src/lib/contract.ts generateShareUrlFn) */
export async function generateShareUrl(scenario: Scenario): Promise<string> {
  const encoded = encodeURIComponent(JSON.stringify(scenario));
  const base =
    typeof window !== "undefined" && window.location
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  return `${base}#/result?scenario=${encoded}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator?.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
