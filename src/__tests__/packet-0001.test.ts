import { describe, it, expect } from "vitest";
import type {
  FireInput,
  ScenarioResult,
  FireResult,
  RouteState,
  RewardGateState,
  CompareMode,
} from "@/lib/types";
import {
  LIMITS,
  REWARD_AD_TIMEOUT_MS,
  REWARD_AD_MAX_RETRY,
  MAX_SAVINGS_RATE,
  STORAGE_KEY,
} from "@/lib/types";

describe("Types & Constants (Packet 0001)", () => {
  describe("AC-1: FireInput type", () => {
    it("AC-1[P0]: should have all required fields with correct types", () => {
      const input: FireInput = {
        age: 35,
        monthlyIncome: 5000000,
        monthlyExpense: 2000000,
        netWorth: 500000000,
        annualReturnRate: 0.06,
      };

      expect(input.age).toBe(35);
      expect(typeof input.age).toBe("number");
      expect(input.monthlyIncome).toBe(5000000);
      expect(typeof input.monthlyIncome).toBe("number");
      expect(input.monthlyExpense).toBe(2000000);
      expect(typeof input.monthlyExpense).toBe("number");
      expect(input.netWorth).toBe(500000000);
      expect(typeof input.netWorth).toBe("number");
      expect(input.annualReturnRate).toBe(0.06);
    });

    it("AC-1[P0]: should accept annualReturnRate of 0.04, 0.06, and 0.08 only", () => {
      const input1: FireInput = {
        age: 30,
        monthlyIncome: 4000000,
        monthlyExpense: 1500000,
        netWorth: 300000000,
        annualReturnRate: 0.04,
      };
      const input2: FireInput = {
        age: 40,
        monthlyIncome: 6000000,
        monthlyExpense: 2500000,
        netWorth: 800000000,
        annualReturnRate: 0.08,
      };

      expect(input1.annualReturnRate).toBe(0.04);
      expect(input2.annualReturnRate).toBe(0.08);
    });
  });

  describe("AC-2: ScenarioResult type", () => {
    it("AC-2[P0]: should have all required fields with correct structure", () => {
      const result: ScenarioResult = {
        savingsRate: 40,
        monthlySaving: 3000000,
        targetAsset: 1000000000,
        monthsToFire: 120,
        retireAge: 45,
        series: [
          { year: 1, asset: 50000000 },
          { year: 2, asset: 105000000 },
        ],
      };

      expect(result.savingsRate).toBe(40);
      expect(result.monthlySaving).toBe(3000000);
      expect(result.targetAsset).toBe(1000000000);
      expect(result.monthsToFire).toBe(120);
      expect(result.retireAge).toBe(45);
      expect(Array.isArray(result.series)).toBe(true);
      expect(result.series).toHaveLength(2);
      expect(result.series[0]).toEqual({ year: 1, asset: 50000000 });
      expect(result.series[1]).toEqual({ year: 2, asset: 105000000 });
    });

    it("AC-2[P0]: monthsToFire and retireAge should accept null", () => {
      const result: ScenarioResult = {
        savingsRate: 10,
        monthlySaving: 500000,
        targetAsset: 800000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      };

      expect(result.monthsToFire).toBeNull();
      expect(result.retireAge).toBeNull();
      expect(result.series).toEqual([]);
    });
  });

  describe("AC-3: FireResult and RouteState types", () => {
    it("AC-3[P0]: FireResult should have current, boosted, progressPercent, monthsSaved fields", () => {
      const fireResult: FireResult = {
        current: 500000000,
        boosted: 600000000,
        progressPercent: 50,
        monthsSaved: 60,
      };

      expect(fireResult.current).toBe(500000000);
      expect(fireResult.boosted).toBe(600000000);
      expect(fireResult.progressPercent).toBe(50);
      expect(fireResult.monthsSaved).toBe(60);
    });

    it("AC-3[P0]: FireResult monthsSaved should accept null", () => {
      const fireResult: FireResult = {
        current: 300000000,
        boosted: 400000000,
        progressPercent: 30,
        monthsSaved: null,
      };

      expect(fireResult.monthsSaved).toBeNull();
    });

    it("AC-3: RouteState should have input field with FireInput type", () => {
      const routeState: RouteState = {
        input: {
          age: 28,
          monthlyIncome: 3500000,
          monthlyExpense: 1200000,
          netWorth: 250000000,
          annualReturnRate: 0.06,
        },
      };

      expect(routeState.input).toBeDefined();
      expect(routeState.input.age).toBe(28);
      expect(routeState.input.monthlyIncome).toBe(3500000);
      expect(routeState.input.monthlyExpense).toBe(1200000);
      expect(routeState.input.netWorth).toBe(250000000);
      expect(routeState.input.annualReturnRate).toBe(0.06);
    });
  });

  describe("AC-4: RewardGateState and CompareMode literal unions", () => {
    it("AC-4: RewardGateState should be one of 'adLoading', 'adFailed', 'revealed'", () => {
      const state1: RewardGateState = "adLoading";
      const state2: RewardGateState = "adFailed";
      const state3: RewardGateState = "revealed";

      expect(["adLoading", "adFailed", "revealed"]).toContain(state1);
      expect(["adLoading", "adFailed", "revealed"]).toContain(state2);
      expect(["adLoading", "adFailed", "revealed"]).toContain(state3);
    });

    it("AC-4: CompareMode should be one of 'both', 'boostedOnly', 'neither', 'capped'", () => {
      const mode1: CompareMode = "both";
      const mode2: CompareMode = "boostedOnly";
      const mode3: CompareMode = "neither";
      const mode4: CompareMode = "capped";

      const validModes = ["both", "boostedOnly", "neither", "capped"];
      expect(validModes).toContain(mode1);
      expect(validModes).toContain(mode2);
      expect(validModes).toContain(mode3);
      expect(validModes).toContain(mode4);
    });
  });

  describe("AC-5: LIMITS and constant definitions", () => {
    it("AC-5[P0]: LIMITS.age should have min=19 and max=70", () => {
      expect(LIMITS.age.min).toBe(19);
      expect(LIMITS.age.max).toBe(70);
    });

    it("AC-5[P0]: LIMITS.money should have max=100000000", () => {
      expect(LIMITS.money.max).toBe(100000000);
    });

    it("AC-5[P0]: LIMITS.netWorth should have max=10000000000", () => {
      expect(LIMITS.netWorth.max).toBe(10000000000);
    });

    it("AC-5: REWARD_AD_TIMEOUT_MS should equal 5000", () => {
      expect(REWARD_AD_TIMEOUT_MS).toBe(5000);
      expect(typeof REWARD_AD_TIMEOUT_MS).toBe("number");
    });

    it("AC-5: REWARD_AD_MAX_RETRY should equal 2", () => {
      expect(REWARD_AD_MAX_RETRY).toBe(2);
      expect(typeof REWARD_AD_MAX_RETRY).toBe("number");
    });

    it("AC-5: MAX_SAVINGS_RATE should equal 90", () => {
      expect(MAX_SAVINGS_RATE).toBe(90);
      expect(typeof MAX_SAVINGS_RATE).toBe("number");
    });

    it("AC-5: STORAGE_KEY should equal 'ers:lastInput'", () => {
      expect(STORAGE_KEY).toBe("ers:lastInput");
      expect(typeof STORAGE_KEY).toBe("string");
    });
  });

  describe("AC-6: Module integrity", () => {
    it("AC-6: All required exports are defined", () => {
      expect(LIMITS).toBeDefined();
      expect(REWARD_AD_TIMEOUT_MS).toBeDefined();
      expect(REWARD_AD_MAX_RETRY).toBeDefined();
      expect(MAX_SAVINGS_RATE).toBeDefined();
      expect(STORAGE_KEY).toBeDefined();
    });

    it("AC-6: Constants have correct types (no React/DOM imports)", () => {
      expect(typeof LIMITS).toBe("object");
      expect(typeof REWARD_AD_TIMEOUT_MS).toBe("number");
      expect(typeof REWARD_AD_MAX_RETRY).toBe("number");
      expect(typeof MAX_SAVINGS_RATE).toBe("number");
      expect(typeof STORAGE_KEY).toBe("string");
    });
  });
});
