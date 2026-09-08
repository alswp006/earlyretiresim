import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";

import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter, seedLocalStorage } from "@/__tests__/__helpers__/test-utils";
import { STORAGE_KEY } from "@/lib/types";
import type { FireInput } from "@/lib/types";

mockAll();

import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import * as storageModule from "@/lib/storage";
import Home from "@/pages/Home";

// ═══════════════════════════════════════════════════════════════
// Fixtures — 저축률 32.5% · 월 저축 1,040,000원 (프로젝트 전역 관례 수치, packet-0004와 동일)
// ═══════════════════════════════════════════════════════════════

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

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Home 입력 화면", () => {
  it("AC-1[P0]: TextField 4개가 나이→월 실수령액→월 지출→현재 순자산 순으로 variant·aria-label·inputMode=numeric을 갖는다", () => {
    renderWithRouter(React.createElement(Home));

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(4);

    const labels = inputs.map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual(["나이", "월 실수령액", "월 지출", "현재 순자산"]);

    inputs.forEach((el) => {
      expect(["box", "line", "big", "hero"]).toContain(el.getAttribute("data-variant"));
      expect(el.getAttribute("inputmode")).toBe("numeric");
    });
  });

  it("AC-1: 각 필드는 placeholder를 가진다 (빈 회색 박스 방지)", () => {
    renderWithRouter(React.createElement(Home));
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((el) => {
      expect(el.getAttribute("placeholder")).toBeTruthy();
    });
  });

  it("AC-2[P0]: 숫자만 남기고 천 단위 콤마로 포맷된다(3200000→3,200,000)", () => {
    renderWithRouter(React.createElement(Home));
    const income = screen.getByLabelText("월 실수령액") as HTMLInputElement;

    fireEvent.change(income, { target: { value: "3200000" } });
    expect(income.value).toBe("3,200,000");
  });

  it("AC-2: 소수점·마이너스·한글·이모지는 화면에 남지 않는다", () => {
    renderWithRouter(React.createElement(Home));
    const income = screen.getByLabelText("월 실수령액") as HTMLInputElement;

    fireEvent.change(income, { target: { value: "12,345.6-가나🙂" } });
    expect(income.value).toBe("123,456");
    expect(income.value).not.toMatch(/[.\-가나🙂]/);
  });

  it("AC-3[P0]: 소득·지출 유효 입력 시 '저축률 32.5% · 월 저축 1,040,000원' 요약이 표시된다", () => {
    renderWithRouter(React.createElement(Home));
    fillValidForm();

    expect(screen.getByText(/저축률 32\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/월 저축 1,040,000원/)).toBeInTheDocument();
  });

  it("AC-4[P0]: 수익률 Chip 3개 중 6%가 기본 선택, 하나만 선택되며 탭 시 tickWeak 햅틱이 발생한다", () => {
    renderWithRouter(React.createElement(Home));

    const chip4 = screen.getByRole("button", { name: "4%" });
    const chip6 = screen.getByRole("button", { name: "6%" });
    const chip8 = screen.getByRole("button", { name: "8%" });

    expect(chip6).toHaveAttribute("aria-pressed", "true");
    expect(chip4).toHaveAttribute("aria-pressed", "false");
    expect(chip8).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(chip8);

    expect(chip8).toHaveAttribute("aria-pressed", "true");
    expect(chip6).toHaveAttribute("aria-pressed", "false");
    expect(generateHapticFeedback).toHaveBeenCalledWith({ type: "tickWeak" });
  });

  it("AC-5[P0]: 필드가 하나라도 비어 있으면 계산 버튼이 disabled다", () => {
    renderWithRouter(React.createElement(Home));
    const submit = screen.getByRole("button", { name: /계산/ });
    expect(submit).toBeDisabled();
  });

  it("AC-5[P0]: 지출≥소득이면 버튼이 disabled고 지출 필드에 에러가 표시된다", () => {
    renderWithRouter(React.createElement(Home));

    fireEvent.change(screen.getByLabelText("나이"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("월 실수령액"), { target: { value: "2000000" } });
    fireEvent.change(screen.getByLabelText("월 지출"), { target: { value: "2000000" } });
    fireEvent.change(screen.getByLabelText("현재 순자산"), { target: { value: "50000000" } });

    const submit = screen.getByRole("button", { name: /계산/ });
    expect(submit).toBeDisabled();
    expect(
      screen.getByText("지출이 소득보다 크거나 같으면 은퇴 시점을 계산할 수 없어요"),
    ).toBeInTheDocument();
  });

  it("AC-6[P0]: 포커스 아웃된 빈 필드는 에러를 표시하고, 값을 입력하면 즉시 사라진다", () => {
    renderWithRouter(React.createElement(Home));

    const age = screen.getByLabelText("나이");
    fireEvent.focus(age);
    fireEvent.blur(age);
    expect(screen.getByText("필수 입력 항목이에요")).toBeInTheDocument();

    fireEvent.change(age, { target: { value: "30" } });
    expect(screen.queryByText("필수 입력 항목이에요")).not.toBeInTheDocument();
  });

  it("AC-6[P0]: 나이에 소수점 입력 시 뒷자리를 이어붙이지 않고 정수부만 취한다", () => {
    renderWithRouter(React.createElement(Home));

    const age = screen.getByLabelText("나이");
    fireEvent.change(age, { target: { value: "1.5" } });
    expect(age).toHaveValue("1");
  });

  it("AC-7[P0]: 저장값이 없으면 Empty State('아직 계산 기록이 없어요 · ...')를 표시한다", () => {
    renderWithRouter(React.createElement(Home));

    expect(screen.getByText(/아직 계산 기록이 없어요/)).toBeInTheDocument();
    expect(
      screen.getByText(/월 소득과 지출을 입력하면 은퇴 가능 나이를 알려드려요/),
    ).toBeInTheDocument();
  });

  it("AC-7[P0]: 저장값이 있으면 입력이 복원된다", () => {
    seedLocalStorage({ [STORAGE_KEY]: VALID_INPUT });

    renderWithRouter(React.createElement(Home));

    expect((screen.getByLabelText("나이") as HTMLInputElement).value).toBe("30");
    expect((screen.getByLabelText("월 실수령액") as HTMLInputElement).value).toBe("3,200,000");
    expect((screen.getByLabelText("월 지출") as HTMLInputElement).value).toBe("2,160,000");
    expect((screen.getByLabelText("현재 순자산") as HTMLInputElement).value).toBe("50,000,000");
  });

  it("AC-8[P0]: 계산 버튼 탭 시 safeSet을 시도하고, 실패해도 Toast 1회 표시 후 navigate는 진행된다", () => {
    vi.spyOn(storageModule, "safeSet").mockReturnValue(false);

    renderWithRouter(React.createElement(Home));
    fillValidForm();

    const submit = screen.getByRole("button", { name: /계산/ });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    expect(storageModule.safeSet).toHaveBeenCalledWith(STORAGE_KEY, expect.any(Object));
    expect(screen.getAllByText("계산 기록을 저장하지 못했어요")).toHaveLength(1);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/result", { state: { input: VALID_INPUT } });
  });

  it("AC-8: safeSet이 성공하면 Toast 없이 navigate가 진행된다", () => {
    vi.spyOn(storageModule, "safeSet").mockReturnValue(true);

    renderWithRouter(React.createElement(Home));
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /계산/ }));

    expect(screen.queryByText("계산 기록을 저장하지 못했어요")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/result", { state: { input: VALID_INPUT } });
  });

  it("AC-9[P0]: TextField 포커스 시 scrollIntoView({block:'center'})가 호출된다", () => {
    const scrollSpy = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollSpy;

    renderWithRouter(React.createElement(Home));
    fireEvent.focus(screen.getByLabelText("나이"));

    expect(scrollSpy).toHaveBeenCalledWith({ block: "center" });
  });
});
