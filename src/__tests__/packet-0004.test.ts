import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { screen } from "@testing-library/react";

import { mockAll } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { formatCurrency } from "@/lib/utils";
import type { ScenarioResult, CompareMode } from "@/lib/types";

import { AssetChart } from "@/components/AssetChart";
import { ScenarioCompare } from "@/components/ScenarioCompare";

mockAll();

// ═══════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════

const seriesBoth: { year: number; asset: number }[] = [
  { year: 1, asset: 100000000 },
  { year: 5, asset: 500000000 },
  { year: 10, asset: 900000000 },
  { year: 15, asset: 1230000000 },
];

const current: ScenarioResult = {
  savingsRate: 32.5,
  monthlySaving: 1040000,
  targetAsset: 1230000000,
  monthsToFire: 180,
  retireAge: 43,
  series: seriesBoth,
};

const boosted: ScenarioResult = {
  savingsRate: 42.5,
  monthlySaving: 1350000,
  targetAsset: 1230000000,
  monthsToFire: 142,
  retireAge: 39,
  series: seriesBoth,
};

const currentNoFire: ScenarioResult = {
  savingsRate: 20,
  monthlySaving: 500000,
  targetAsset: 800000000,
  monthsToFire: null,
  retireAge: null,
  series: [],
};

const boostedWithFire: ScenarioResult = {
  savingsRate: 30,
  monthlySaving: 750000,
  targetAsset: 800000000,
  monthsToFire: 200,
  retireAge: 45,
  series: seriesBoth,
};

const currentNull: ScenarioResult = {
  savingsRate: 10,
  monthlySaving: 200000,
  targetAsset: 900000000,
  monthsToFire: null,
  retireAge: null,
  series: [],
};

const boostedNull: ScenarioResult = {
  savingsRate: 20,
  monthlySaving: 400000,
  targetAsset: 900000000,
  monthsToFire: null,
  retireAge: null,
  series: [],
};

const cappedCurrent: ScenarioResult = {
  savingsRate: 90,
  monthlySaving: 3000000,
  targetAsset: 900000000,
  monthsToFire: 96,
  retireAge: 40,
  series: seriesBoth,
};

const cappedBoosted: ScenarioResult = {
  savingsRate: 90,
  monthlySaving: 3000000,
  targetAsset: 900000000,
  monthsToFire: 96,
  retireAge: 40,
  series: seriesBoth,
};

function renderCompare(c: ScenarioResult, b: ScenarioResult, mode: CompareMode) {
  return renderWithRouter(React.createElement(ScenarioCompare, { current: c, boosted: b, mode }));
}

// ═══════════════════════════════════════════════════════════════
// AC-1: AssetChart — responsive SVG + asset curve path + dashed target line
// ═══════════════════════════════════════════════════════════════

describe("AC-1: AssetChart renders responsive SVG with curve + target line", () => {
  it("AC-1[P0]: renders width 100%/height 180 SVG with viewBox '0 0 320 180'", () => {
    const { container } = renderWithRouter(
      React.createElement(AssetChart, { series: seriesBoth, targetAsset: 1230000000 }),
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 320 180");
    expect(svg?.getAttribute("width")).toBe("100%");
    expect(svg?.getAttribute("height")).toBe("180");
  });

  it("AC-1[P0]: renders exactly one asset curve path and one dashed target line", () => {
    const { container } = renderWithRouter(
      React.createElement(AssetChart, { series: seriesBoth, targetAsset: 1230000000 }),
    );
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(1);
    const dashed = container.querySelectorAll("[stroke-dasharray]");
    expect(dashed.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-2: AssetChart — no crash on empty/single-item series, has role+aria-label
// ═══════════════════════════════════════════════════════════════

describe("AC-2: AssetChart handles empty/single-item series without crashing", () => {
  it("AC-2[P0]: renders without crashing for series length 0, with role='img' and aria-label", () => {
    const { container } = renderWithRouter(
      React.createElement(AssetChart, { series: [], targetAsset: 1230000000 }),
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBeTruthy();
  });

  it("AC-2[P0]: renders without crashing for series length 1", () => {
    const { container } = renderWithRouter(
      React.createElement(AssetChart, {
        series: [{ year: 1, asset: 100000000 }],
        targetAsset: 1230000000,
      }),
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("role")).toBe("img");
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-3: No hardcoded HEX colors in either file
// ═══════════════════════════════════════════════════════════════

describe("AC-3: no hardcoded HEX colors", () => {
  it("AC-3[P0]: AssetChart.tsx and ScenarioCompare.tsx contain zero HEX color literals", () => {
    const files = ["src/components/AssetChart.tsx", "src/components/ScenarioCompare.tsx"];
    for (const file of files) {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g);
      expect(hexMatches).toBeNull();
    }
    expect(files.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-4: ScenarioCompare — per-card retire age / months to fire / monthly saving,
//       null-case '달성 어려움' Chip + '50년 내 미달성'
// ═══════════════════════════════════════════════════════════════

describe("AC-4: ScenarioCompare card fields", () => {
  it("AC-4[P0]: shows retire age and formatCurrency-formatted monthly saving for both cards", () => {
    renderCompare(current, boosted, "both");
    expect(screen.getByText(/43세/)).toBeInTheDocument();
    expect(screen.getByText(/39세/)).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(1040000))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(1350000))).toBeInTheDocument();
  });

  it("AC-4[P0]: shows '달성 어려움' chip and '50년 내 미달성' when monthsToFire is null", () => {
    renderCompare(currentNull, boostedNull, "neither");
    const chips = screen.getAllByText("달성 어려움");
    expect(chips.length).toBe(2);
    const notReached = screen.getAllByText(/50년 내 미달성/);
    expect(notReached.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-5: mode='both' / 'boostedOnly' copy
// ═══════════════════════════════════════════════════════════════

describe("AC-5: ScenarioCompare mode='both'/'boostedOnly' copy", () => {
  it("AC-5[P0]: mode='both' shows the acceleration message with formatted duration (3년 2개월)", () => {
    renderCompare(current, boosted, "both");
    expect(screen.getByText(/저축률 10%p만 올려도 3년 2개월 빨라져요/)).toBeInTheDocument();
  });

  it("AC-5[P0]: mode='boostedOnly' shows the enabling message with boosted retireAge (45세)", () => {
    renderCompare(currentNoFire, boostedWithFire, "boostedOnly");
    expect(screen.getByText(/저축률을 10%p 올리면 45세에 은퇴할 수 있어요/)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-6: mode='neither' copy — no diff message, single guidance line
// ═══════════════════════════════════════════════════════════════

describe("AC-6: ScenarioCompare mode='neither' copy", () => {
  it("AC-6[P0]: shows no diff message and exactly the guidance line", () => {
    renderCompare(currentNull, boostedNull, "neither");
    expect(screen.queryByText(/빨라져요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/은퇴할 수 있어요/)).not.toBeInTheDocument();
    expect(
      screen.getByText("지출을 줄이거나 소득을 늘리면 목표에 닿을 수 있어요"),
    ).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-7: mode='capped' copy — single line only
// ═══════════════════════════════════════════════════════════════

describe("AC-7: ScenarioCompare mode='capped' copy", () => {
  it("AC-7[P0]: shows only the savings-rate-cap line", () => {
    renderCompare(cappedCurrent, cappedBoosted, "capped");
    expect(screen.getByText("이미 저축률 상한(90%)에 도달했어요")).toBeInTheDocument();
    expect(screen.queryByText(/빨라져요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/은퇴할 수 있어요/)).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-8: No 'NaN'/'undefined' leakage across all 4 modes + no TDS padding/margin overrides
// ═══════════════════════════════════════════════════════════════

describe("AC-8: no NaN/undefined leakage, no TDS style overrides", () => {
  it("AC-8[P0]: renders no 'NaN' or 'undefined' text across both/boostedOnly/neither/capped modes", () => {
    const cases: [ScenarioResult, ScenarioResult, CompareMode][] = [
      [current, boosted, "both"],
      [currentNoFire, boostedWithFire, "boostedOnly"],
      [currentNull, boostedNull, "neither"],
      [cappedCurrent, cappedBoosted, "capped"],
    ];
    for (const [c, b, mode] of cases) {
      const { container, unmount } = renderCompare(c, b, mode);
      expect(container.textContent).not.toMatch(/NaN/);
      expect(container.textContent).not.toMatch(/undefined/);
      unmount();
    }
  });

  it("AC-8[P0]: source files never pass a raw style= prop directly to a TDS component tag", () => {
    const files = ["src/components/AssetChart.tsx", "src/components/ScenarioCompare.tsx"];
    const tdsOverridePattern =
      /<(Button|ListRow|TextField|Chip|Paragraph\.Text|Switch|Top|FixedBottomCTA|BottomCTA)\b[^>]*\sstyle=/;
    for (const file of files) {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
      expect(tdsOverridePattern.test(content)).toBe(false);
    }
    expect(files.length).toBe(2);
  });
});
