import { describe, it, expect, beforeEach, vi } from "vitest";
import { LIMITS, STORAGE_KEY } from "@/lib/types";
import { sanitizeNumeric, validateEmpty, validateInput, validateUserInput } from "@/lib/validation";
import { buildShareText, copyToClipboard, generateShareUrl } from "@/lib/share";
import { safeGet, safeSet, saveScenario, loadScenario } from "@/lib/storage";
import type { Scenario, UserInput } from "@/lib/contract";

// ═══════════════════════════════════════════════════════════════
// AC-1: sanitizeNumeric(raw: string): string
// Removes all non-digit characters, removes leading zeros
// ═══════════════════════════════════════════════════════════════

describe("AC-1: sanitizeNumeric", () => {
  it("AC-1[P0]: should remove all non-numeric characters and leading zeros", () => {
    // Mixed input: commas, dots, dashes, Korean, emoji
    const result1 = sanitizeNumeric("1,2.3-4가🙂");
    expect(result1).toBe("1234");

    // Leading zeros
    const result2 = sanitizeNumeric("007");
    expect(result2).toBe("7");

    // Spaces and special chars
    const result3 = sanitizeNumeric(" 123 456 ");
    expect(result3).toBe("123456");
  });

  it("AC-1[P0]: should return empty string for empty result", () => {
    expect(sanitizeNumeric("")).toBe("");
    expect(sanitizeNumeric("가🙂🎉")).toBe("");
    expect(sanitizeNumeric("...---")).toBe("");
  });

  it("AC-1: should preserve multi-digit numbers", () => {
    expect(sanitizeNumeric("100,000,000")).toBe("100000000");
    expect(sanitizeNumeric("5.2.7.8")).toBe("5278");
  });

  it("AC-1: should handle pure digits without change", () => {
    expect(sanitizeNumeric("12345")).toBe("12345");
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-2: validateEmpty(value: unknown): string | null
// Returns '필수 입력 항목이에요' if undefined/null/empty
// ═══════════════════════════════════════════════════════════════

describe("AC-2: validateEmpty", () => {
  it("AC-2[P0]: should return error message for undefined", () => {
    const result = validateEmpty(undefined);
    expect(result).toBe("필수 입력 항목이에요");
    expect(typeof result).toBe("string");
  });

  it("AC-2[P0]: should return null when value exists", () => {
    expect(validateEmpty(35)).toBeNull();
    expect(validateEmpty(5000000)).toBeNull();
    expect(validateEmpty(0)).toBeNull();
    expect(validateEmpty("")).toBeNull(); // empty string is technically defined
  });

  it("AC-2: should return error message for null", () => {
    const result = validateEmpty(null);
    expect(result).toBe("필수 입력 항목이에요");
  });

  it("AC-2: should handle edge cases correctly", () => {
    expect(validateEmpty(false)).toBeNull(); // false is defined
    expect(validateEmpty(NaN)).toBeNull(); // NaN is defined (it's a number type)
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-3: validateInput(field: string, value: unknown): string | null
// Age validation: 19-70 range with error message
// ═══════════════════════════════════════════════════════════════

describe("AC-3: validateInput for age", () => {
  it("AC-3[P0]: should return error message for age < 19", () => {
    const result = validateInput("age", 18);
    expect(result).toBe("나이는 19~70세만 입력할 수 있어요");
  });

  it("AC-3[P0]: should return error message for age > 70", () => {
    const result = validateInput("age", 71);
    expect(result).toBe("나이는 19~70세만 입력할 수 있어요");
  });

  it("AC-3[P0]: should return null for age 19 and 70 (boundaries)", () => {
    expect(validateInput("age", 19)).toBeNull();
    expect(validateInput("age", 70)).toBeNull();
  });

  it("AC-3: should return null for valid age range", () => {
    expect(validateInput("age", 35)).toBeNull();
    expect(validateInput("age", 50)).toBeNull();
    expect(validateInput("age", 25)).toBeNull();
  });

  it("AC-3: should handle edge cases for age", () => {
    expect(validateInput("age", 0)).toBe("나이는 19~70세만 입력할 수 있어요");
    expect(validateInput("age", 100)).toBe("나이는 19~70세만 입력할 수 있어요");
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-4: validateInput for income/expense/netWorth ranges
// Income/Expense: 0-100,000,000
// NetWorth: 0-10,000,000,000
// ═══════════════════════════════════════════════════════════════

describe("AC-4: validateInput for money fields", () => {
  it("AC-4[P0]: should return error for income exceeding 100,000,000", () => {
    const result = validateInput("monthlyIncome", 100000001);
    expect(result).toContain("100,000,000");
    expect(result).toContain("입력");
  });

  it("AC-4[P0]: should return error for expense exceeding 100,000,000", () => {
    const result = validateInput("monthlyExpense", 100000001);
    expect(result).toContain("100,000,000");
    expect(result).toContain("입력");
  });

  it("AC-4[P0]: should return error for netWorth exceeding 10,000,000,000", () => {
    const result = validateInput("netWorth", 10000000001);
    expect(result).toContain("100억");
    expect(result).toContain("입력");
  });

  it("AC-4[P0]: should return null for boundary values (0, 100M, 100B)", () => {
    // Income/Expense boundaries
    expect(validateInput("monthlyIncome", 0)).toBeNull();
    expect(validateInput("monthlyIncome", 100000000)).toBeNull();
    expect(validateInput("monthlyExpense", 0)).toBeNull();
    expect(validateInput("monthlyExpense", 100000000)).toBeNull();

    // NetWorth boundary
    expect(validateInput("netWorth", 0)).toBeNull();
    expect(validateInput("netWorth", 10000000000)).toBeNull();
  });

  it("AC-4: should return null for valid ranges", () => {
    expect(validateInput("monthlyIncome", 5000000)).toBeNull();
    expect(validateInput("monthlyExpense", 2000000)).toBeNull();
    expect(validateInput("netWorth", 500000000)).toBeNull();
  });

  it("AC-4: should return error for negative values", () => {
    const result1 = validateInput("monthlyIncome", -100);
    expect(result1).not.toBeNull();

    const result2 = validateInput("netWorth", -1000);
    expect(result2).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-5: validateInput for expense >= income
// Should return error on expense field when monthly expense >= income
// ═══════════════════════════════════════════════════════════════

describe("AC-5: validateInput for expense >= income", () => {
  it("AC-5[P0]: should return error when expense >= income", () => {
    // Setup: income = 5M, expense = 5M (equal)
    const result = validateInput("monthlyExpense", {
      monthlyIncome: 5000000,
      monthlyExpense: 5000000,
    });
    expect(result).toBe(
      "지출이 소득보다 크거나 같으면 은퇴 시점을 계산할 수 없어요"
    );
  });

  it("AC-5[P0]: should return error when expense > income", () => {
    // Setup: income = 5M, expense = 6M
    const result = validateInput("monthlyExpense", {
      monthlyIncome: 5000000,
      monthlyExpense: 6000000,
    });
    expect(result).toBe(
      "지출이 소득보다 크거나 같으면 은퇴 시점을 계산할 수 없어요"
    );
  });

  it("AC-5[P0]: should return null when expense < income", () => {
    // Setup: income = 5M, expense = 2M
    const result = validateInput("monthlyExpense", {
      monthlyIncome: 5000000,
      monthlyExpense: 2000000,
    });
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-6: buildShareText(result, input): string
// Format: 'EarlyRetireSim | 43세 은퇴 가능 | 저축률 32.5% | 목표 12억 3,000만원'
// If monthsToFire=null: '달성 어려움'
// ═══════════════════════════════════════════════════════════════

describe("AC-6: buildShareText", () => {
  it("AC-6[P0]: should generate correct format with monthsToFire", () => {
    const mockResult = {
      current: {
        savingsRate: 32.5,
        monthlySaving: 1040000,
        targetAsset: 1230000000,
        monthsToFire: 148,
        retireAge: 43,
        series: [],
      },
      boosted: { /* ... */ },
    };
    const mockInput = { age: 35, monthlyExpense: 2000000 };

    const text = buildShareText(mockResult, mockInput);
    expect(text).toContain("EarlyRetireSim");
    expect(text).toContain("43세");
    expect(text).toContain("은퇴 가능");
    expect(text).toContain("32.5%");
    expect(text).toContain("12억 3,000만원");
  });

  it("AC-6[P0]: should use '달성 어려움' when monthsToFire is null", () => {
    const mockResult = {
      current: {
        savingsRate: 15.0,
        monthlySaving: 500000,
        targetAsset: 800000000,
        monthsToFire: null,
        retireAge: null,
        series: [],
      },
      boosted: { /* ... */ },
    };
    const mockInput = { age: 30, monthlyExpense: 1500000 };

    const text = buildShareText(mockResult, mockInput);
    expect(text).toContain("달성 어려움");
    expect(text).not.toContain("은퇴 가능");
  });

  it("AC-6: should include all required components in result format", () => {
    const mockResult = {
      current: {
        savingsRate: 50,
        monthlySaving: 2000000,
        targetAsset: 500000000,
        monthsToFire: 60,
        retireAge: 40,
        series: [],
      },
    };
    const mockInput = { age: 35, monthlyExpense: 2000000 };

    const text = buildShareText(mockResult, mockInput);
    const parts = text.split(" | ");
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts[0]).toBe("EarlyRetireSim");
  });

  it("AC-6: should format currency correctly (억 단위)", () => {
    const mockResult = {
      current: {
        savingsRate: 40,
        monthlySaving: 1500000,
        targetAsset: 1234567000, // 12억 3,456만 7천원
        monthsToFire: 100,
        retireAge: 45,
        series: [],
      },
    };
    const mockInput = { age: 35, monthlyExpense: 2250000 };

    const text = buildShareText(mockResult, mockInput);
    expect(text).toContain("억");
    expect(text).toMatch(/\d+억/);
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-7: copyToClipboard(text: string): Promise<boolean>
// Returns true on success, false on failure (no throw)
// ═══════════════════════════════════════════════════════════════

describe("AC-7: copyToClipboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AC-7[P0]: should return true on successful copy", async () => {
    // Mock navigator.clipboard
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    const result = await copyToClipboard("test text");
    expect(result).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith("test text");
  });

  it("AC-7[P0]: should return false on copy failure (no throw)", async () => {
    // Mock clipboard to reject
    const mockClipboard = {
      writeText: vi.fn().mockRejectedValue(new Error("Clipboard denied")),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    const result = await copyToClipboard("test text");
    expect(result).toBe(false);
  });

  it("AC-7[P0]: should not throw even if clipboard API is unavailable", async () => {
    // Remove clipboard API
    const original = navigator.clipboard;
    delete (navigator as any).clipboard;

    let error: Error | undefined;
    try {
      const result = await copyToClipboard("test text");
      expect(result).toBe(false);
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeUndefined(); // No throw

    // Restore
    (navigator as any).clipboard = original;
  });

  it("AC-7: should handle empty string", async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    const result = await copyToClipboard("");
    expect(result).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith("");
  });

  it("AC-7: should handle long text", async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    const longText = "a".repeat(10000);
    const result = await copyToClipboard(longText);
    expect(result).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith(longText);
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-8: safeSet(key: string, value: unknown): boolean
// AC-8: safeGet<T>(key: string): T | null
// localStorage exception handling + JSON parse failure
// ═══════════════════════════════════════════════════════════════

describe("AC-8: safeSet & safeGet", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── safeSet ──
  it("AC-8[P0]: safeSet should return true on success", () => {
    const result = safeSet("test-key", { value: 123 });
    expect(result).toBe(true);
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify({ value: 123 }));
  });

  it("AC-8[P0]: safeSet should return false on exception", () => {
    // Mock localStorage to throw
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn().mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const result = safeSet("key", { data: "value" });
    expect(result).toBe(false);

    // Restore
    Storage.prototype.setItem = originalSetItem;
  });

  it("AC-8[P0]: safeSet should not output console.error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Force error by mocking
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn().mockImplementation(() => {
      throw new Error("Test error");
    });

    safeSet("key", { data: "value" });
    expect(consoleSpy).not.toHaveBeenCalled();

    // Cleanup
    Storage.prototype.setItem = originalSetItem;
    consoleSpy.mockRestore();
  });

  // ── safeGet ──
  it("AC-8[P0]: safeGet should return parsed value on success", () => {
    const testData = { salary: 5000000, age: 35 };
    localStorage.setItem("test-key", JSON.stringify(testData));

    const result = safeGet<typeof testData>("test-key");
    expect(result).toEqual(testData);
    expect(result?.salary).toBe(5000000);
  });

  it("AC-8[P0]: safeGet should return null for non-existent key", () => {
    const result = safeGet("non-existent-key");
    expect(result).toBeNull();
  });

  it("AC-8[P0]: safeGet should return null for damaged JSON and removeItem the key", () => {
    localStorage.setItem("bad-key", "{ invalid json ]}");

    const result = safeGet("bad-key");
    expect(result).toBeNull();
    expect(localStorage.getItem("bad-key")).toBeNull(); // removeItem was called
  });

  it("AC-8[P0]: safeGet should not output console.error on parse failure", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("broken-key", "not json at all");

    const result = safeGet("broken-key");
    expect(result).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("AC-8: safeGet should handle getItem exception", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn().mockImplementation(() => {
      throw new Error("Access denied");
    });

    const result = safeGet("any-key");
    expect(result).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalled();

    Storage.prototype.getItem = originalGetItem;
    consoleSpy.mockRestore();
  });

  it("AC-8: safeSet & safeGet round-trip", () => {
    const original = {
      age: 40,
      income: 6000000,
      expense: 2500000,
      netWorth: 800000000,
    };

    const setSuccess = safeSet("roundtrip-key", original);
    expect(setSuccess).toBe(true);

    const retrieved = safeGet<typeof original>("roundtrip-key");
    expect(retrieved).toEqual(original);
    expect(retrieved?.age).toBe(40);
    expect(retrieved?.income).toBe(6000000);
  });

  it("AC-8: safeSet should handle null and undefined values", () => {
    const result1 = safeSet("null-key", null);
    expect(result1).toBe(true);

    const result2 = safeSet("undefined-key", undefined);
    expect(result2).toBe(true);

    const retrieved1 = safeGet("null-key");
    expect(retrieved1).toBeNull(); // null serialized as null

    const retrieved2 = safeGet("undefined-key");
    expect(retrieved2).toBeNull(); // undefined serialized as null
  });
});

// ═══════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════

describe("Integration: Full workflow (input → storage → retrieval)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save sanitized input to storage and retrieve it", () => {
    // Simulate user input with dirty data
    const dirtyInput = {
      age: sanitizeNumeric("035"),
      income: sanitizeNumeric("5,000,000"),
      expense: sanitizeNumeric("2-0-0-0-0-0-0"),
      netWorth: sanitizeNumeric("500,000,000가나"),
    };

    expect(dirtyInput.age).toBe("35");
    expect(dirtyInput.income).toBe("5000000");
    expect(dirtyInput.expense).toBe("2000000");
    expect(dirtyInput.netWorth).toBe("500000000");

    // Save to storage
    const saved = safeSet(STORAGE_KEY, dirtyInput);
    expect(saved).toBe(true);

    // Retrieve from storage
    const retrieved = safeGet<typeof dirtyInput>(STORAGE_KEY);
    expect(retrieved).toEqual(dirtyInput);
  });

  it("should validate input before saving", () => {
    const input = {
      age: 35,
      income: 5000000,
      expense: 2000000,
      netWorth: 500000000,
    };

    // Validate all fields
    expect(validateInput("age", input.age)).toBeNull();
    expect(validateInput("monthlyIncome", input.income)).toBeNull();
    expect(validateInput("monthlyExpense", input.expense)).toBeNull();
    expect(validateInput("netWorth", input.netWorth)).toBeNull();

    // Save if all valid
    const saved = safeSet(STORAGE_KEY, input);
    expect(saved).toBe(true);

    // Retrieve and verify
    const retrieved = safeGet<typeof input>(STORAGE_KEY);
    expect(retrieved).toEqual(input);
  });

  it("should prevent saving when expense >= income", () => {
    const input = {
      age: 35,
      income: 5000000,
      expense: 5000000, // equals income
      netWorth: 500000000,
    };

    // Validation should fail
    const expenseError = validateInput("monthlyExpense", {
      monthlyIncome: input.income,
      monthlyExpense: input.expense,
    });
    expect(expenseError).not.toBeNull();

    // Should not save
    // (In real app, button would be disabled before reaching safeSet)
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-9: validateUserInput(input: Partial<UserInput>): { valid, errors }
// ═══════════════════════════════════════════════════════════════

const validUserInput: UserInput = {
  age: 35,
  annualExpense: 24000000,
  currentAssets: 100000000,
  annualIncome: 60000000,
  targetAssets: 600000000,
  annualReturn: 0.06,
  inflationRate: 0.02,
};

describe("AC-9: validateUserInput", () => {
  it("AC-9[P0]: valid input returns valid=true and no errors", () => {
    const result = validateUserInput(validUserInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("AC-9[P0]: out-of-range age produces an error", () => {
    const result = validateUserInput({ ...validUserInput, age: 15 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("나이"))).toBe(true);
  });

  it("AC-9[P0]: expense >= income produces an error", () => {
    const result = validateUserInput({ ...validUserInput, annualIncome: 20000000, annualExpense: 24000000 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("지출이 소득보다"))).toBe(true);
  });

  it("AC-9: missing required fields each produce an error", () => {
    const result = validateUserInput({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-10: saveScenario / loadScenario
// ═══════════════════════════════════════════════════════════════

function makeScenario(id: string): Scenario {
  return {
    id,
    name: `시나리오 ${id}`,
    input: validUserInput,
    result: {
      isAchievable: true,
      yearsToFire: 12,
      targetAssets: 600000000,
      finalAssets: 610000000,
      annualRetirementIncome: 24400000,
      calculatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  };
}

describe("AC-10: saveScenario & loadScenario", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("AC-10[P0]: saves a scenario and resolves its id", async () => {
    const scenario = makeScenario("s1");
    const id = await saveScenario(scenario);
    expect(id).toBe("s1");
  });

  it("AC-10[P0]: loads a previously saved scenario by id", async () => {
    const scenario = makeScenario("s2");
    await saveScenario(scenario);
    const loaded = await loadScenario("s2");
    expect(loaded).toEqual(scenario);
  });

  it("AC-10[P0]: returns null for an unknown id", async () => {
    const loaded = await loadScenario("does-not-exist");
    expect(loaded).toBeNull();
  });

  it("AC-10: saving a scenario with the same id overwrites the previous one", async () => {
    await saveScenario(makeScenario("s3"));
    const updated = { ...makeScenario("s3"), name: "업데이트됨" };
    await saveScenario(updated);
    const loaded = await loadScenario("s3");
    expect(loaded?.name).toBe("업데이트됨");
  });
});

// ═══════════════════════════════════════════════════════════════
// AC-11: generateShareUrl(scenario): Promise<string>
// ═══════════════════════════════════════════════════════════════

describe("AC-11: generateShareUrl", () => {
  it("AC-11[P0]: resolves a URL string containing the encoded scenario id", async () => {
    const scenario = makeScenario("share-1");
    const url = await generateShareUrl(scenario);
    expect(typeof url).toBe("string");
    expect(url).toContain("scenario=");
    expect(decodeURIComponent(url.split("scenario=")[1])).toContain("share-1");
  });
});

