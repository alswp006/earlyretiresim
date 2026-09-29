import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// 벤더(.d.ts) 모양 그대로의 목: ListRow는 children을 버리고 left/contents/right만 렌더,
// Chip은 그룹 컨테이너(글자를 직접 넣으면 안 됨) — 개별 칩은 ChipItem.
vi.mock("@toss/tds-mobile", () => {
  const h = React.createElement;
  return {
    Paragraph: {
      Text: ({ children, typography }: any) => h("span", { "data-typography": typography }, children),
    },
    Spacing: ({ size }: any) => h("div", { "data-spacing": size }),
    ListRow: Object.assign(
      ({ left, contents, right }: any) => h("div", { role: "listitem" }, left, contents, right),
      {
        Texts: ({ top, bottom }: any) => h("span", null, top, bottom),
      },
    ),
    Chip: ({ children }: any) => h("div", { "data-chip-group": "true" }, children),
    ChipItem: ({ children }: any) => h("button", { "data-chip-item": "true" }, children),
  };
});

import { ScenarioCompare } from "@/components/ScenarioCompare";
import type { ScenarioResult } from "@/lib/types";

const source = readFileSync(resolve(__dirname, "../components/ScenarioCompare.tsx"), "utf8");

const reached = (over: Partial<ScenarioResult> = {}): ScenarioResult => ({
  savingsRate: 40,
  monthlySaving: 1_600_000,
  targetAsset: 500_000_000,
  monthsToFire: 150,
  retireAge: 42.4,
  series: [],
  ...over,
});
const unreached = (): ScenarioResult =>
  reached({ savingsRate: 5, monthsToFire: null, retireAge: null });

function renderCompare(current: ScenarioResult, boosted: ScenarioResult, mode: any = "both") {
  return render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ScenarioCompare, { current, boosted, mode }),
    ),
  );
}

describe("[개선] TDS 컴포넌트 2곳을 벤더 모양대로 고치기", () => {
  it("AC-1/2: ListRow 값이 슬롯으로 렌더된다 (children 버려짐 없음)", () => {
    renderCompare(reached(), reached({ savingsRate: 50, monthsToFire: 100, retireAge: 38 }));
    const current = screen.getByTestId("scenario-card-current");
    expect(within(current).getByText("40%")).toBeInTheDocument();
    expect(within(current).getByText("42세")).toBeInTheDocument();
    expect(within(current).getByText("12년 6개월")).toBeInTheDocument();
    expect(within(current).getByText("₩1,600,000")).toBeInTheDocument();
    expect(within(current).getByText("저축률")).toBeInTheDocument();
    expect(within(current).getByText("은퇴 나이")).toBeInTheDocument();
    expect(within(current).getByText("필요 기간")).toBeInTheDocument();
    expect(within(current).getByText("월 저축액")).toBeInTheDocument();
  });

  it("AC-1/2: 미달성 카드에서도 저축률 행이 슬롯으로 보인다", () => {
    renderCompare(unreached(), reached(), "boostedOnly");
    const current = screen.getByTestId("scenario-card-current");
    expect(within(current).getByText("5%")).toBeInTheDocument();
    expect(within(current).getByText("저축률")).toBeInTheDocument();
    expect(within(current).queryByText("은퇴 나이")).toBeNull();
  });

  it("AC-1: 소스에서 ListRow 여는 태그가 자식 내용을 갖지 않는다", () => {
    expect(source).not.toMatch(/<ListRow\b[^>]*>\s*<Paragraph/);
    expect(source).toMatch(/contents=|left=|right=/);
  });

  it("AC-5/6: '달성 어려움'은 Chip 그룹 안의 ChipItem으로 렌더된다", () => {
    renderCompare(unreached(), reached(), "boostedOnly");
    const current = screen.getByTestId("scenario-card-current");
    const item = within(current).getByText("달성 어려움");
    expect(item.getAttribute("data-chip-item")).toBe("true");
    expect(item.parentElement?.getAttribute("data-chip-group")).toBe("true");
    expect(within(current).getByText("50년 내 미달성")).toBeInTheDocument();
  });

  it("AC-5/6: 소스가 Chip에 글자를 직접 넣지 않는다", () => {
    expect(source).toMatch(/ChipItem/);
    expect(source).not.toMatch(/<Chip\b[^>]*>\s*[^<\s{]/);
    expect(source).not.toMatch(/<Chip\b[^>]*>\s*\{/);
  });

  it("AC-3/7: TDS에 as any / as unknown as 캐스트를 쓰지 않는다", () => {
    expect(source).not.toMatch(/as any/);
    expect(source).not.toMatch(/as unknown as/);
  });

  it("AC-4/8: 공용 목의 ListRow는 벤더처럼 children을 렌더하지 않는다", () => {
    const mocks = readFileSync(resolve(__dirname, "./__helpers__/mocks.ts"), "utf8");
    expect(mocks).not.toMatch(/contents \?\? children/);
    expect(mocks).toMatch(/ChipItem/);
  });
});
