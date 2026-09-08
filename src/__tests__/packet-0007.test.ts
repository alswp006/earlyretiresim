import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, fireEvent, act } from "@testing-library/react";

import { mockTds, mockAppsInToss, mockRouter, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { formatCurrency } from "@/lib/utils";
import { REWARD_AD_TIMEOUT_MS, type FireInput, type RouteState } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Result은 RewardGate로 결과를 게이팅한다. RewardGate 자체는 TossRewardAd의
// onRewarded 신호만으로 revealed 전이하므로, 여기서는 TossRewardAd를 컨트롤
// 가능한 스텁으로 목킹해 "시청 완료" 시점을 테스트에서 임의로 발화시킨다.
// (packet-0005의 RewardGate 테스트와 동일 패턴 — mockAll()의 mockTossRewardAd()는
// children을 즉시 렌더해 adLoading 단계를 관찰할 수 없게 만들므로 쓰지 않는다.)
// ─────────────────────────────────────────────────────────────

interface CapturedTossRewardAdProps {
  onRewarded?: () => void;
}

const tossRewardAdCalls: CapturedTossRewardAdProps[] = [];

vi.mock("@/components/TossRewardAd", () => ({
  TossRewardAd: (props: CapturedTossRewardAdProps) => {
    tossRewardAdCalls.push(props);
    return null;
  },
}));

mockTds();
mockAppsInToss();
mockRouter();

import Result from "@/pages/Result";

// ═══════════════════════════════════════════════════════════════
// Fixtures — 실제 src/lib/fire.ts 로직으로 미리 계산한 값(node로 검증됨)
// ═══════════════════════════════════════════════════════════════

// age=30, 월소득 420만, 월지출 200만, 순자산 1억, 연수익률 6%
// → targetAsset=600,000,000 / monthsToFire=133(11년 1개월) / retireAge≈41.08→41세
// → progressPercent = 100,000,000/600,000,000*100 = 16.7
const baseInput: FireInput = {
  age: 30,
  monthlyIncome: 4200000,
  monthlyExpense: 2000000,
  netWorth: 100000000,
  annualReturnRate: 0.06,
};

// 월소득(200만) < 월지출(220만) → monthlySaving<=0 → current.monthsToFire=null
// boosted도 savingsRate min(-10+10,90)=0 → monthlySaving=0 → boosted.monthsToFire=null
// → getCompareMode === 'neither'
const bothFailInput: FireInput = {
  age: 35,
  monthlyIncome: 2000000,
  monthlyExpense: 2200000,
  netWorth: 5000000,
  annualReturnRate: 0.06,
};

function renderResult(state?: RouteState | null) {
  return renderWithRouter(React.createElement(Result), {
    initialEntries: state === undefined ? ["/result"] : [{ pathname: "/result", state }],
  });
}

async function revealGate() {
  const latest = tossRewardAdCalls[tossRewardAdCalls.length - 1];
  await act(async () => {
    latest?.onRewarded?.();
  });
}

beforeEach(() => {
  tossRewardAdCalls.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error test-only cleanup of a stub we may have defined
  delete navigator.clipboard;
});

describe("Result 결과 화면", () => {
  it("AC-1[P0]: 광고 시청 전에는 은퇴 나이·그래프·시나리오 텍스트가 DOM에 존재하지 않는다", () => {
    const { container } = renderResult({ input: baseInput });

    expect(screen.queryByText("41세 (11년 1개월 후)")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("scenario-card-current")).toHaveLength(0);
  });

  it("AC-2[P0]: 계산 중 Spinner+'계산 중이에요'가 표시되고, 완료(시청) 시 결과 영역으로 전환된다", async () => {
    renderResult({ input: baseInput });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("계산 중이에요")).toBeInTheDocument();

    await revealGate();

    expect(screen.queryByText("계산 중이에요")).not.toBeInTheDocument();
    expect(screen.getByText("41세 (11년 1개월 후)")).toBeInTheDocument();
  });

  it("AC-3[P0]: 히어로 카드에 은퇴 나이('41세 (11년 1개월 후)')와 목표자산(formatCurrency) 형식이 표시된다", async () => {
    const { container } = renderResult({ input: baseInput });
    await revealGate();

    expect(screen.getByText("41세 (11년 1개월 후)")).toBeInTheDocument();
    expect(container.textContent).toContain("목표 자산");
    expect(container.textContent).toContain(formatCurrency(600000000));
  });

  it("AC-4[P0]: 진행률이 '진행률 16.7%' 텍스트와 0~100% 범위의 progressbar로 표시된다", async () => {
    renderResult({ input: baseInput });
    await revealGate();

    expect(screen.getByText(/진행률 16\.7%/)).toBeInTheDocument();
    const bars = screen.getAllByRole("progressbar");
    const valuenow = Number(bars[bars.length - 1].getAttribute("aria-valuenow"));
    expect(valuenow).toBeGreaterThanOrEqual(0);
    expect(valuenow).toBeLessThanOrEqual(100);
  });

  it("AC-4[P0]: 순자산이 목표를 초과해도 진행률은 100%로 클램프된다", async () => {
    renderResult({ input: { ...baseInput, netWorth: 900000000 } });
    await revealGate();

    expect(screen.getByText(/진행률 100%/)).toBeInTheDocument();
    const bars = screen.getAllByRole("progressbar");
    expect(bars[bars.length - 1].getAttribute("aria-valuenow")).toBe("100");
  });

  it("AC-5[P0]: monthsToFire===null이면 '현재 조건으로는 50년 내 목표 달성이 어려워요'를 표시하고 크래시하지 않는다", async () => {
    renderResult({ input: bothFailInput });
    await revealGate();

    expect(
      screen.getByText("현재 조건으로는 50년 내 목표 달성이 어려워요"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^\d+세 \(/)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("scenario-card-current")).toHaveLength(1);
  });

  it("AC-6[P0]: mode='neither'에서 ScenarioCompare에 차이 문구가 렌더되지 않는다", async () => {
    renderResult({ input: bothFailInput });
    await revealGate();

    expect(screen.queryByText(/빨라져요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/은퇴할 수 있어요/)).not.toBeInTheDocument();
    expect(
      screen.getByText("지출을 줄이거나 소득을 늘리면 목표에 닿을 수 있어요"),
    ).toBeInTheDocument();
  });

  it("AC-7[P0]: '결과 복사하기' 성공 시 Toast '결과를 복사했어요'가 표시된다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderResult({ input: baseInput });
    await revealGate();

    fireEvent.click(screen.getByRole("button", { name: /결과 복사하기/ }));

    expect(await screen.findByText("결과를 복사했어요")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("AC-7[P0]: '결과 복사하기' 실패 시 Toast '복사에 실패했어요. 다시 시도해주세요'가 표시되고 화면은 유지된다", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderResult({ input: baseInput });
    await revealGate();

    fireEvent.click(screen.getByRole("button", { name: /결과 복사하기/ }));

    expect(
      await screen.findByText("복사에 실패했어요. 다시 시도해주세요"),
    ).toBeInTheDocument();
    // 화면 상태 유지 — 결과 히어로 텍스트가 그대로 남아있다(다른 화면으로 전환되지 않음)
    expect(screen.getByText("41세 (11년 1개월 후)")).toBeInTheDocument();
  });

  it("AC-8[P0]: route state가 없으면 에러 폴백과 '다시 입력하기' 버튼(→'/')이 표시된다", () => {
    renderResult(undefined);

    expect(screen.getByText("결과를 불러오지 못했어요")).toBeInTheDocument();
    const backButton = screen.getByRole("button", { name: /다시 입력하기/ });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("AC-8[P0]: 계산 예외(손상된 state)에도 크래시 없이 에러 폴백을 표시한다", () => {
    expect(() =>
      renderResult({ input: null } as unknown as RouteState),
    ).not.toThrow();

    expect(screen.getByText("결과를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다시 입력하기/ })).toBeInTheDocument();
  });

  it("AC-9[P0]: 오프라인(광고 미응답)에서도 5초 후 폴백이 뜨고 '결과 보기'로 결과를 열람할 수 있다", async () => {
    vi.useFakeTimers();

    renderResult({ input: baseInput });

    act(() => {
      vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS);
    });

    expect(screen.getByText(/광고를 불러올 수 없어요/)).toBeInTheDocument();
    const viewResultButton = screen.getByRole("button", { name: "결과 보기" });

    act(() => {
      fireEvent.click(viewResultButton);
    });

    expect(screen.getByText("41세 (11년 1개월 후)")).toBeInTheDocument();
    expect(screen.queryByText(/광고를 불러올 수 없어요/)).not.toBeInTheDocument();
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);

    vi.useRealTimers();
  });
});
