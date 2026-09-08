import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, fireEvent, act } from "@testing-library/react";

import { mockTds, mockAppsInToss, mockRouter } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { REWARD_AD_TIMEOUT_MS, REWARD_AD_MAX_RETRY } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// RewardGate는 TossRewardAd를 감싸되, 자체 5초 타이머(REWARD_AD_TIMEOUT_MS)로
// adLoading -> adFailed 전이를 소유한다. TossRewardAd의 onRewarded만 성공
// 신호로 사용하므로, 여기서는 TossRewardAd를 컨트롤 가능한 스텁으로 목킹해
// "시청 완료"를 테스트에서 임의 시점에 발화시킨다.
// (mockAll()의 mockTossRewardAd()는 children을 즉시 렌더해 adLoading/adFailed
//  전이를 테스트할 수 없게 만들므로 여기서는 쓰지 않는다.)
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

import { RewardGate } from "@/components/RewardGate";

function latestOnRewarded(): (() => void) | undefined {
  return tossRewardAdCalls[tossRewardAdCalls.length - 1]?.onRewarded;
}

describe("리워드 광고 게이트 (RewardGate)", () => {
  beforeEach(() => {
    tossRewardAdCalls.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("AC-1[P0]: revealed 상태 이전에는 children이 DOM에 존재하지 않는다", () => {
    renderWithRouter(
      React.createElement(
        RewardGate,
        { slotId: "result-unlock" },
        React.createElement("div", null, "결과 내용입니다"),
      ),
    );

    expect(screen.queryByText("결과 내용입니다")).not.toBeInTheDocument();
    // adLoading 단계이므로 progressbar(Spinner)는 있어야 한다
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("AC-2[P0]: adLoading에서 Spinner+'계산 중이에요' 표시, 5000ms 후 adFailed로 전이", () => {
    renderWithRouter(
      React.createElement(RewardGate, { slotId: "result-unlock" }, React.createElement("div", null, "결과 내용")),
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("계산 중이에요")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS);
    });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText(/광고를 불러올 수 없어요/)).toBeInTheDocument();
  });

  it("AC-3[P0]: 시청 완료 시 clearTimeout이 호출되고 폴백 UI가 표시되지 않는다", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    renderWithRouter(
      React.createElement(RewardGate, { slotId: "result-unlock" }, React.createElement("div", null, "결과 내용")),
    );

    act(() => {
      latestOnRewarded()?.();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(screen.getByText("결과 내용")).toBeInTheDocument();

    // 타이머가 정리됐으므로 5초가 더 지나도 폴백 문구가 나타나지 않는다
    act(() => {
      vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS);
    });
    expect(screen.queryByText(/광고를 불러올 수 없어요/)).not.toBeInTheDocument();
    expect(screen.getByText("결과 내용")).toBeInTheDocument();
  });

  it("AC-4[P0]: adFailed에서 안내 문구와 '다시 시도'·'결과 보기' 버튼 2개가 표시된다", () => {
    renderWithRouter(
      React.createElement(RewardGate, { slotId: "result-unlock" }, React.createElement("div", null, "결과 내용")),
    );

    act(() => {
      vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS);
    });

    expect(
      screen.getByText("광고를 불러올 수 없어요. 인터넷 연결을 확인해주세요"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeInTheDocument();
  });

  it(`AC-5[P0]: '다시 시도' 탭 시 adLoading으로 재전이하며 타이머를 재시작하고, ${REWARD_AD_MAX_RETRY}회 소진 후 disabled된다`, () => {
    renderWithRouter(
      React.createElement(RewardGate, { slotId: "result-unlock" }, React.createElement("div", null, "결과 내용")),
    );

    // 최초 실패
    act(() => {
      vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS);
    });
    expect(screen.getByRole("button", { name: "다시 시도" })).not.toBeDisabled();

    for (let attempt = 1; attempt <= REWARD_AD_MAX_RETRY; attempt++) {
      fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

      // 재시도 클릭 즉시 adLoading으로 전이 (Spinner 재표시, 타이머 재시작)
      expect(screen.getByRole("progressbar")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS);
      });
      // 다시 adFailed
      expect(screen.getByText(/광고를 불러올 수 없어요/)).toBeInTheDocument();
    }

    // REWARD_AD_MAX_RETRY(2)회 소진 후 버튼은 disabled
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeDisabled();
  });

  it("AC-6[P0]: '결과 보기' 탭 시 광고 없이 revealed로 전이해 children이 렌더된다", () => {
    renderWithRouter(
      React.createElement(RewardGate, { slotId: "result-unlock" }, React.createElement("div", null, "결과 내용")),
    );

    act(() => {
      vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS);
    });
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "결과 보기" }));

    expect(screen.getByText("결과 내용")).toBeInTheDocument();
    expect(screen.queryByText(/광고를 불러올 수 없어요/)).not.toBeInTheDocument();
  });

  it("AC-7[P0]: 언마운트 시 clearTimeout으로 타이머가 정리되어 setState 경고·console.error가 발생하지 않는다", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderWithRouter(
      React.createElement(RewardGate, { slotId: "result-unlock" }, React.createElement("div", null, "결과 내용")),
    );

    // adLoading 상태(타이머 대기 중)에서 바로 언마운트
    unmount();

    // 언마운트 후 원래 타이머가 발화했을 시점까지 시간을 흘려보낸다.
    // clearTimeout이 정리했다면 아무 콜백도 실행되지 않아야 하고,
    // 정리되지 않았다면 언마운트된 컴포넌트에 setState를 시도해 console.error가 찍힌다.
    act(() => {
      vi.advanceTimersByTime(REWARD_AD_TIMEOUT_MS + 1000);
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
