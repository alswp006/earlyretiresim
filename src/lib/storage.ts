import type { Scenario } from "@/lib/contract";

const SCENARIOS_KEY = "ers:scenarios";
const MAX_SCENARIOS = 20;

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}

export function safeSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeGet<T>(key: string): T | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

export function safeRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Result: 시나리오 저장, 반환 ID (계약: src/lib/contract.ts saveScenarioFn) */
export async function saveScenario(scenario: Scenario): Promise<string> {
  const list = safeGet<Scenario[]>(SCENARIOS_KEY) ?? [];
  const next = [...list.filter((s) => s.id !== scenario.id), scenario];
  const trimmed = next.length > MAX_SCENARIOS ? next.slice(next.length - MAX_SCENARIOS) : next;
  safeSet(SCENARIOS_KEY, trimmed);
  return scenario.id;
}

/** Result, App: 저장된 시나리오 로드 (계약: src/lib/contract.ts loadScenarioFn) */
export async function loadScenario(id: string): Promise<Scenario | null> {
  const list = safeGet<Scenario[]>(SCENARIOS_KEY) ?? [];
  return list.find((s) => s.id === id) ?? null;
}
