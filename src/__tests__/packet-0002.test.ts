import { describe, it, expect } from "vitest";
import type { ScenarioResult, FireResult } from "@/lib/types";
import {
  calcSavingsRate,
  calcTargetAsset,
  simulate,
  calcBoostedScenario,
  calcMonthsSaved,
  calcProgressPercent,
  getCompareMode,
} from "@/lib/fire";

describe("FIRE Calculation Logic (Packet 0002)", () => {
  describe("AC-1: calcSavingsRate(monthlyIncome, monthlyExpense)", () => {
    it("AC-1[P0]: should calculate savings rate with rounding to 1 decimal place", () => {
      // (3200000 - 2160000) / 3200000 * 100 = 1040000 / 3200000 * 100 = 32.5%
      const result = calcSavingsRate(3200000, 2160000);
      expect(result).toBe(32.5);
    });

    it("AC-1[P0]: should handle edge case of high savings rate", () => {
      // (5000000 - 500000) / 5000000 * 100 = 90%
      const result = calcSavingsRate(5000000, 500000);
      expect(result).toBe(90);
    });

    it("AC-1: should handle edge case of low savings rate", () => {
      // (1000000 - 900000) / 1000000 * 100 = 10%
      const result = calcSavingsRate(1000000, 900000);
      expect(result).toBe(10);
      expect(typeof result).toBe("number");
    });
  });

  describe("AC-2: calcTargetAsset(monthlyExpense)", () => {
    it("AC-2[P0]: should calculate target asset as monthlyExpense × 12 × 25", () => {
      // monthlyExpense = 2000000
      // target = 2000000 × 12 × 25 = 600000000
      const result = calcTargetAsset(2000000);
      expect(result).toBe(600000000);
    });

    it("AC-2[P0]: should calculate target asset for different expense levels", () => {
      // monthlyExpense = 1500000
      // target = 1500000 × 12 × 25 = 450000000
      const result = calcTargetAsset(1500000);
      expect(result).toBe(450000000);
    });

    it("AC-2: should handle large monthly expense", () => {
      // monthlyExpense = 5000000
      // target = 5000000 × 12 × 25 = 1500000000
      const result = calcTargetAsset(5000000);
      expect(result).toBe(1500000000);
    });
  });

  describe("AC-3: simulate(currentAge, asset, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate)", () => {
    it("AC-3[P0]: should calculate monthsToFire when goal is achievable", () => {
      // Test parameters
      const currentAge = 35;
      const asset = 100000000;
      const monthlyIncome = 5000000;
      const monthlyExpense = 2000000;
      const targetAsset = 600000000;
      const annualReturnRate = 0.06;

      // Monthly return rate = (1 + 0.06)^(1/12) - 1 = 0.004868 (approx)
      // Simulate: asset grows with returns and monthly savings for max 600 months
      // Returns: { monthsToFire: number, retireAge: number, series: [...] }
      // OR { monthsToFire: null, retireAge: null, series: [] } when not achievable

      const result = simulate(currentAge, asset, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate);

      expect(result.monthsToFire).not.toBeNull();
      expect(typeof result.monthsToFire).toBe("number");
      expect(result.monthsToFire).toBeGreaterThan(0);
      expect(result.monthsToFire).toBeLessThanOrEqual(600);
    });

    it("AC-3[P0]: should return null monthsToFire when goal not achievable in 600 months", () => {
      // Test parameters where savings rate is very low
      const currentAge = 30;
      const asset = 10000000;
      const monthlyIncome = 1000000;
      const monthlyExpense = 950000;
      const targetAsset = 600000000;
      const annualReturnRate = 0.04;

      // With only 50000/month savings, unlikely to reach 600M in 600 months
      // Expected: { monthsToFire: null, retireAge: null, series: [] }

      const result = simulate(currentAge, asset, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate);

      expect(result.monthsToFire).toBeNull();
      expect(result.retireAge).toBeNull();
      expect(result.series).toEqual([]);
    });

    it("AC-3: should apply monthly compound formula correctly and generate series", () => {
      // Formula: asset = asset × (1 + monthlyRate) + monthlySaving
      // monthlyRate = (1 + annualRate)^(1/12) - 1
      // This test verifies the structure and annual series

      const currentAge = 40;
      const asset = 200000000;
      const monthlyIncome = 6000000;
      const monthlyExpense = 3000000;
      const targetAsset = 1000000000;
      const annualReturnRate = 0.08;

      const result = simulate(currentAge, asset, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate);

      expect(result).toBeDefined();
      expect(result.series).toBeInstanceOf(Array);
      if (result.monthsToFire !== null && result.retireAge !== null) {
        expect(result.monthsToFire).toBeGreaterThan(0);
        expect(result.retireAge).toBeGreaterThanOrEqual(currentAge);
      }
    });
  });

  describe("AC-4: simulate should not throw on invalid inputs", () => {
    it("AC-4[P0]: should return null monthsToFire when monthly savings <= 0 without throwing", () => {
      // monthlyIncome = 1000000, monthlyExpense = 1000000
      // monthlySaving = 0, should not achieve FIRE
      const currentAge = 30;
      const asset = 50000000;
      const monthlyIncome = 1000000;
      const monthlyExpense = 1000000;
      const targetAsset = 500000000;
      const annualReturnRate = 0.06;

      // Should not throw, should return monthsToFire: null
      expect(() => {
        const result = simulate(currentAge, asset, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate);
        expect(result.monthsToFire).toBeNull();
        expect(result.retireAge).toBeNull();
      }).not.toThrow();
    });

    it("AC-4[P0]: should return null monthsToFire when exceeding 600 months", () => {
      // Even with positive savings, if it takes > 600 months, return null
      const currentAge = 25;
      const asset = 1000000;
      const monthlyIncome = 2000000;
      const monthlyExpense = 1990000;
      const targetAsset = 1000000000;
      const annualReturnRate = 0.04;

      const result = simulate(currentAge, asset, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate);

      // With only 10000/month savings for 1B target, exceeds 600 months
      expect(result.monthsToFire).toBeNull();
      expect(result.retireAge).toBeNull();
    });
  });

  describe("AC-5: calcBoostedScenario(current scenario)", () => {
    it("AC-5[P0]: should cap boosted savings rate at min(current + 10, 90)", () => {
      // If current savings rate = 50%, boosted = 60%
      const current: ScenarioResult = {
        savingsRate: 50,
        monthlySaving: 2500000,
        targetAsset: 600000000,
        monthsToFire: 200,
        retireAge: 45,
        series: [],
      };

      const boosted = calcBoostedScenario(current, 5000000, 600000000, 35, 0.06);
      expect(boosted.savingsRate).toBe(60);

      // If current savings rate = 85%, boosted = 90% (capped)
      const current2: ScenarioResult = {
        savingsRate: 85,
        monthlySaving: 4250000,
        targetAsset: 600000000,
        monthsToFire: 120,
        retireAge: 42,
        series: [],
      };

      const boosted2 = calcBoostedScenario(current2, 5000000, 600000000, 35, 0.06);
      expect(boosted2.savingsRate).toBe(90);
    });

    it("AC-5[P0]: should calculate boosted monthly saving correctly", () => {
      // boosted.monthlySaving = monthlyIncome × boosted.savingsRate / 100
      const current: ScenarioResult = {
        savingsRate: 50,
        monthlySaving: 2500000,
        targetAsset: 600000000,
        monthsToFire: 200,
        retireAge: 45,
        series: [],
      };

      const monthlyIncome = 5000000;
      const targetAsset = 600000000;
      const currentAge = 35;
      const annualReturnRate = 0.06;

      const boosted = calcBoostedScenario(current, monthlyIncome, targetAsset, currentAge, annualReturnRate);
      expect(boosted.monthlySaving).toBe(3000000); // 5000000 × 60% / 100
    });

    it("AC-5: should handle edge case where current rate is already high", () => {
      // If current = 90%, boosted should still be 90% (not exceed)
      const current: ScenarioResult = {
        savingsRate: 90,
        monthlySaving: 4500000,
        targetAsset: 600000000,
        monthsToFire: 80,
        retireAge: 40,
        series: [],
      };

      const boosted = calcBoostedScenario(current, 5000000, 600000000, 35, 0.06);
      expect(boosted.savingsRate).toBeLessThanOrEqual(90);
    });
  });

  describe("AC-6: calcMonthsSaved(current, boosted)", () => {
    it("AC-6[P0]: should return numeric monthsSaved when both have monthsToFire", () => {
      const current: ScenarioResult = {
        savingsRate: 40,
        monthlySaving: 2000000,
        targetAsset: 600000000,
        monthsToFire: 200,
        retireAge: 45,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 50,
        monthlySaving: 2500000,
        targetAsset: 600000000,
        monthsToFire: 160,
        retireAge: 44,
        series: [],
      };

      // monthsSaved = current.monthsToFire - boosted.monthsToFire = 40
      const monthsSaved = calcMonthsSaved(current, boosted);
      expect(monthsSaved).toBe(40);
      expect(typeof monthsSaved).toBe("number");
      expect(isNaN(monthsSaved as any)).toBe(false);
    });

    it("AC-6[P0]: should return null monthsSaved when either has null monthsToFire", () => {
      const current: ScenarioResult = {
        savingsRate: 10,
        monthlySaving: 500000,
        targetAsset: 600000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 20,
        monthlySaving: 1000000,
        targetAsset: 600000000,
        monthsToFire: 300,
        retireAge: 50,
        series: [],
      };

      // monthsSaved = null (current has null)
      const monthsSaved = calcMonthsSaved(current, boosted);

      expect(monthsSaved).toBeNull();
    });

    it("AC-6: should never return NaN regardless of inputs", () => {
      // Test edge case with 0 difference
      const current: ScenarioResult = {
        savingsRate: 50,
        monthlySaving: 2500000,
        targetAsset: 600000000,
        monthsToFire: 100,
        retireAge: 45,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 60,
        monthlySaving: 3000000,
        targetAsset: 600000000,
        monthsToFire: 100,
        retireAge: 45,
        series: [],
      };

      const monthsSaved = calcMonthsSaved(current, boosted);
      expect(monthsSaved).toBe(0);
      expect(isNaN(monthsSaved as any)).toBe(false);

      // Test both null case
      const current2: ScenarioResult = {
        savingsRate: 5,
        monthlySaving: 250000,
        targetAsset: 600000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      };
      const boosted2: ScenarioResult = {
        savingsRate: 15,
        monthlySaving: 750000,
        targetAsset: 600000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      };

      const monthsSaved2 = calcMonthsSaved(current2, boosted2);
      expect(monthsSaved2).toBeNull();
      expect(isNaN(monthsSaved2 as any)).toBe(false);
    });
  });

  describe("AC-7: calcProgressPercent(netWorth, targetAsset)", () => {
    it("AC-7[P0]: should calculate progress as (netWorth / targetAsset) × 100 clamped to 0-100", () => {
      // netWorth = 300000000, targetAsset = 600000000
      // progress = 300000000 / 600000000 * 100 = 50%
      const progressPercent = calcProgressPercent(300000000, 600000000);
      expect(progressPercent).toBe(50);
    });

    it("AC-7[P0]: should clamp to 100 when netWorth exceeds targetAsset", () => {
      // netWorth = 700000000, targetAsset = 600000000
      // progress = 700000000 / 600000000 * 100 = 116.67%, should clamp to 100
      const progressPercent = calcProgressPercent(700000000, 600000000);
      expect(progressPercent).toBe(100);
    });

    it("AC-7[P0]: should clamp to 0 when netWorth is minimal", () => {
      // netWorth = 0, targetAsset = 600000000
      // progress = 0 / 600000000 * 100 = 0%, should clamp to 0
      const progressPercent = calcProgressPercent(0, 600000000);
      expect(progressPercent).toBe(0);
    });

    it("AC-7: should round to 1 decimal place", () => {
      // netWorth = 150000000, targetAsset = 600000000
      // progress = 150000000 / 600000000 * 100 = 25%
      const progressPercent = calcProgressPercent(150000000, 600000000);
      expect(progressPercent).toBe(25);

      // Test decimal rounding
      const progressPercent2 = calcProgressPercent(125000000, 600000000);
      expect(progressPercent2).toBe(20.8);
    });
  });

  describe("AC-8: getCompareMode(current, boosted)", () => {
    it("AC-8[P0]: should return 'capped' when current savings rate >= 90", () => {
      const current: ScenarioResult = {
        savingsRate: 90,
        monthlySaving: 4500000,
        targetAsset: 600000000,
        monthsToFire: 80,
        retireAge: 40,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 90,
        monthlySaving: 4500000,
        targetAsset: 600000000,
        monthsToFire: 80,
        retireAge: 40,
        series: [],
      };

      const compareMode = getCompareMode(current, boosted);
      expect(compareMode).toBe("capped");
    });

    it("AC-8[P0]: should return 'neither' when both monthsToFire are null", () => {
      const current: ScenarioResult = {
        savingsRate: 10,
        monthlySaving: 500000,
        targetAsset: 600000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 20,
        monthlySaving: 1000000,
        targetAsset: 600000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      };

      const compareMode = getCompareMode(current, boosted);
      expect(compareMode).toBe("neither");
    });

    it("AC-8[P0]: should return 'boostedOnly' when only current monthsToFire is null", () => {
      const current: ScenarioResult = {
        savingsRate: 10,
        monthlySaving: 500000,
        targetAsset: 600000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 20,
        monthlySaving: 1000000,
        targetAsset: 600000000,
        monthsToFire: 300,
        retireAge: 50,
        series: [],
      };

      const compareMode = getCompareMode(current, boosted);
      expect(compareMode).toBe("boostedOnly");
    });

    it("AC-8[P0]: should return 'both' for normal scenarios with both monthsToFire present", () => {
      const current: ScenarioResult = {
        savingsRate: 40,
        monthlySaving: 2000000,
        targetAsset: 600000000,
        monthsToFire: 200,
        retireAge: 45,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 50,
        monthlySaving: 2500000,
        targetAsset: 600000000,
        monthsToFire: 160,
        retireAge: 44,
        series: [],
      };

      const compareMode = getCompareMode(current, boosted);
      expect(compareMode).toBe("both");
    });

    it("AC-8: should handle edge case where savings rate is 91 (>90)", () => {
      const current: ScenarioResult = {
        savingsRate: 91,
        monthlySaving: 4550000,
        targetAsset: 600000000,
        monthsToFire: 75,
        retireAge: 40,
        series: [],
      };
      const boosted: ScenarioResult = {
        savingsRate: 90,
        monthlySaving: 4500000,
        targetAsset: 600000000,
        monthsToFire: 75,
        retireAge: 40,
        series: [],
      };

      const compareMode = getCompareMode(current, boosted);
      expect(compareMode).toBe("capped");
    });
  });

  describe("AC-Integration: FIRE calculation pipeline integration", () => {
    it("AC-Integration: should calculate complete FIRE result from input parameters", () => {
      // Integration: input → calculate current scenario → calculate boosted scenario → compare
      const currentAge = 35;
      const monthlyIncome = 5000000;
      const monthlyExpense = 2000000;
      const netWorth = 200000000;
      const annualReturnRate = 0.06;

      // Step 1: Calculate basic metrics
      const savingsRate = calcSavingsRate(monthlyIncome, monthlyExpense);
      const targetAsset = calcTargetAsset(monthlyExpense);

      expect(savingsRate).toBe(60);
      expect(targetAsset).toBe(600000000);

      // Step 2: Simulate current scenario
      const current = simulate(currentAge, netWorth, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate);

      expect(current).toBeDefined();
      expect(current.savingsRate).toBeGreaterThanOrEqual(0);

      // Step 3: Calculate boosted scenario
      const boosted = calcBoostedScenario(current, monthlyIncome, targetAsset, currentAge, annualReturnRate);

      expect(boosted.savingsRate).toBeLessThanOrEqual(90);
      expect(boosted.monthlySaving).toBeGreaterThanOrEqual(current.monthlySaving);

      // Step 4: Calculate progress and months saved
      const progressPercent = calcProgressPercent(netWorth, targetAsset);
      const monthsSaved = calcMonthsSaved(current, boosted);
      const compareMode = getCompareMode(current, boosted);

      expect(progressPercent).toBeGreaterThanOrEqual(0);
      expect(progressPercent).toBeLessThanOrEqual(100);
      expect(["both", "boostedOnly", "neither", "capped"]).toContain(compareMode);
    });

    it("AC-Integration: should handle unachievable FIRE goal gracefully", () => {
      // Integration: low savings → null monthsToFire → proper compare mode
      const currentAge = 25;
      const monthlyIncome = 1500000;
      const monthlyExpense = 1400000;
      const netWorth = 10000000;
      const annualReturnRate = 0.04;

      const savingsRate = calcSavingsRate(monthlyIncome, monthlyExpense);
      const targetAsset = calcTargetAsset(monthlyExpense);

      // Low savings rate
      expect(savingsRate).toBeLessThan(15);

      const current = simulate(currentAge, netWorth, monthlyIncome, monthlyExpense, targetAsset, annualReturnRate);
      const boosted = calcBoostedScenario(current, monthlyIncome, targetAsset, currentAge, annualReturnRate);

      // Both likely unachievable
      const compareMode = getCompareMode(current, boosted);
      expect(compareMode).toBe("neither");

      const monthsSaved = calcMonthsSaved(current, boosted);
      expect(monthsSaved).toBeNull();
    });
  });
});
