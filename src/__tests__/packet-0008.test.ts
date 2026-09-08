import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { screen, fireEvent, act } from "@testing-library/react";

import { mockTds, mockAppsInToss, mockRouter, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import type { FireInput } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Result는 RewardGate로 게이팅된다(packet-0007과 동일 패턴) — TossRewardAd를
// 컨트롤 가능한 스텁으로 목킹해 "시청 완료" 시점을 테스트에서 발화시킨다.
// mockAll()의 mockTossRewardAd()는 onReward(다른 prop명)를 기대해 RewardGate의
// 실제 onRewarded와 매치되지 않으므로 여기서는 개별 목을 쓴다.
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

import App from "@/App";
import Home from "@/pages/Home";
import Result from "@/pages/Result";
import { TossAds } from "@apps-in-toss/web-framework";

const VALID_INPUT: FireInput = {
  age: 30,
  monthlyIncome: 3200000,
  monthlyExpense: 2160000,
  netWorth: 50000000,
  annualReturnRate: 0.06,
};

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("나이"), { target: { value: String(VALID_INPUT.age) } });
  fireEvent.change(screen.getByLabelText("월 실수령액"), {
    target: { value: String(VALID_INPUT.monthlyIncome) },
  });
  fireEvent.change(screen.getByLabelText("월 지출"), {
    target: { value: String(VALID_INPUT.monthlyExpense) },
  });
  fireEvent.change(screen.getByLabelText("현재 순자산"), {
    target: { value: String(VALID_INPUT.netWorth) },
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
  vi.unstubAllEnvs();
  // @ts-expect-error test-only cleanup
  delete navigator.clipboard;
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  (TossAds.attachBanner as unknown as { isSupported: () => boolean }).isSupported = () => true;
});

describe("배너 광고 & 라우팅 연결", () => {
  it("AC-1[P0]: '/'는 Home 화면(나이 입력 필드)을 렌더한다", () => {
    renderWithRouter(React.createElement(App), { initialEntries: ["/"] });
    expect(screen.getByLabelText("나이")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("AC-1[P0]: '/result'는 Result 화면을 렌더하고, 알 수 없는 경로('/unknown')는 '/'로 replace 리다이렉트된다", () => {
    const { unmount } = renderWithRouter(React.createElement(App), {
      initialEntries: ["/result"],
    });
    expect(screen.getByText("결과를 불러오지 못했어요")).toBeInTheDocument();
    unmount();

    renderWithRouter(React.createElement(App), { initialEntries: ["/unknown-path"] });
    expect(screen.getByLabelText("나이")).toBeInTheDocument();
  });

  it("AC-2[P0]: Home 하단에 VITE_TOSS_AD_GROUP_ID를 adGroupId로 갖는 AdSlot 배너가 렌더된다", () => {
    vi.stubEnv("VITE_TOSS_AD_GROUP_ID", "home-bottom-banner");

    renderWithRouter(React.createElement(Home));

    const adSlot = document.querySelector("[data-ad-group-id]");
    expect(adSlot).not.toBeNull();
    expect(adSlot?.getAttribute("data-ad-group-id")).toBe("home-bottom-banner");
  });

  it("AC-2: 배너 로드 미지원(실패) 환경에서도 에러 문구·console.error 없이 조용히 렌더된다", () => {
    (TossAds.attachBanner as unknown as { isSupported: () => boolean }).isSupported = () => false;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithRouter(React.createElement(Home));

    expect(screen.queryByText(/광고를 불러올 수 없/)).not.toBeInTheDocument();
    expect(screen.queryByText(/광고 오류/)).not.toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("AC-3[P0]: 오프라인(navigator.onLine=false) 상태로 Home에 진입해도 흰 화면 없이 입력 UI가 표시된다", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithRouter(React.createElement(Home));

    expect(screen.getByLabelText("나이")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /계산/ })).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("AC-4[P0]: main.tsx는 앵커 주석으로 보호된 원본 그대로다 (TDSMobileAITProvider/BrowserRouter 배선 유지)", () => {
    const mainTsxPath = path.resolve(__dirname, "../main.tsx");
    const content = fs.readFileSync(mainTsxPath, "utf-8");
    const anchorMarker = ["@AI", "ANCHOR"].join(":");

    expect(content).toContain(anchorMarker);
    expect(content).toContain("TDSMobileAITProvider");
    expect(content).toContain("<BrowserRouter");
    expect(content).toContain("<App />");
  });

  it("AC-5[P0]: 입력→계산→결과→복사 전체 플로우에서 console.error가 0건이다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    const homeRender = renderWithRouter(React.createElement(Home));
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /계산/ }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [navPath, navOptions] = mockNavigate.mock.calls[0];
    expect(navPath).toBe("/result");
    const routeState = (navOptions as { state: { input: FireInput } }).state;
    expect(routeState.input).toEqual(VALID_INPUT);
    homeRender.unmount();

    renderWithRouter(React.createElement(Result), {
      initialEntries: [{ pathname: "/result", state: routeState }],
    });
    await revealGate();

    fireEvent.click(screen.getByRole("button", { name: /결과 복사하기/ }));
    expect(await screen.findByText("결과를 복사했어요")).toBeInTheDocument();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("AC-6[P0]: Home/Result/App 소스에 외부 도메인 이탈(window.open, href=http)이나 외부 로깅 SDK import가 없다", () => {
    const files = ["../pages/Home.tsx", "../pages/Result.tsx", "../App.tsx"].map((rel) =>
      fs.readFileSync(path.resolve(__dirname, rel), "utf-8"),
    );

    for (const src of files) {
      expect(src).not.toMatch(/window\.open\(/);
      expect(src).not.toMatch(/href=["']https?:\/\//);
      expect(src).not.toMatch(/window\.location\.href\s*=\s*["']https?:\/\//);
      expect(src).not.toMatch(/amplitude|google-analytics|react-ga|mixpanel/i);
    }
  });

  it("AC-6: 렌더된 Home/Result DOM에 http(s) 링크를 가리키는 <a> 태그가 없다", async () => {
    const { container: homeContainer, unmount } = renderWithRouter(React.createElement(Home));
    expect(homeContainer.querySelectorAll('a[href^="http"]')).toHaveLength(0);
    unmount();

    const { container: resultContainer } = renderWithRouter(React.createElement(Result), {
      initialEntries: [{ pathname: "/result", state: { input: VALID_INPUT } }],
    });
    await revealGate();
    expect(resultContainer.querySelectorAll('a[href^="http"]')).toHaveLength(0);
  });
});
