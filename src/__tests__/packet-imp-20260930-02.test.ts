import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, p), "utf8");
const home = read("../pages/Home.tsx");
const result = read("../pages/Result.tsx");
const shareLib = read("../lib/share.ts");
const pages = home + "\n" + result;

/** 호출부의 첫 인자 문자열 리터럴들을 뽑는다 (변수·템플릿 문자열은 매칭되지 않는다). */
function literalNames(src: string, fn: string): string[] {
  const re = new RegExp(`\\b${fn}\\(\\s*"([^"]+)"`, "g");
  return [...src.matchAll(re)].map((m) => m[1]);
}
/** 첫 인자가 리터럴이 아닌 호출 개수. */
function nonLiteralCalls(src: string, fn: string): number {
  const all = [...src.matchAll(new RegExp(`\\b${fn}\\(`, "g"))].length;
  return all - literalNames(src, fn).length;
}

describe("[개선] 행동 로그·리뷰·공유 3가지 추가", () => {
  it("AC-1: Home·Result에 logClick이 3곳 이상, 두 화면 모두에 들어간다", () => {
    expect(literalNames(pages, "logClick").length).toBeGreaterThanOrEqual(3);
    expect(literalNames(home, "logClick").length).toBeGreaterThanOrEqual(1);
    expect(literalNames(result, "logClick").length).toBeGreaterThanOrEqual(1);
    expect(pages).toMatch(/import\s*\{[^}]*\blogClick\b[^}]*\}\s*from\s*"@\/lib\/analytics"/);
  });

  it("AC-2: 결과 노출에 logImpression이 1곳 이상 있고 Result에 있다", () => {
    expect(literalNames(result, "logImpression").length).toBeGreaterThanOrEqual(1);
    expect(result).toMatch(/import\s*\{[^}]*\blogImpression\b[^}]*\}\s*from\s*"@\/lib\/analytics"/);
  });

  it("AC-3: 로그 이름은 고정 snake_case 리터럴이다 (변수·템플릿 금지)", () => {
    for (const fn of ["logClick", "logImpression"]) {
      expect(nonLiteralCalls(pages, fn)).toBe(0);
      for (const name of literalNames(pages, fn)) {
        expect(name).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      }
    }
    const clicks = literalNames(pages, "logClick");
    expect(new Set(clicks).size).toBe(clicks.length);
  });

  it("AC-4: 새 래퍼·새 의존성 없이 기존 @/lib/analytics만 쓴다", () => {
    expect(pages).not.toMatch(/from\s*"(?:@apps-in-toss\/web-framework)"[^;]*Analytics/);
    expect(pages).not.toMatch(/Analytics\.(click|impression|screen)\(/);
    expect(pages).not.toMatch(/from\s*"(?:react-ga|amplitude|@amplitude)[^"]*"/);
    expect(read("../lib/analytics.ts")).toContain("export function logClick");
    expect(read("../lib/analytics.ts")).toContain("export function logImpression");
  });

  it("AC-5: requestReviewOnce()는 Result에서 정확히 1곳 호출된다 (성공을 본 뒤)", () => {
    expect(result).toMatch(/import\s*\{[^}]*\brequestReviewOnce\b[^}]*\}\s*from\s*"@\/lib\/review"/);
    expect([...result.matchAll(/\brequestReviewOnce\(/g)]).toHaveLength(1);
    expect(home).not.toMatch(/requestReviewOnce\(/);
  });

  it("AC-6: 리뷰 요청은 진입 직후(빈 마운트 effect)·오류 분기에서 호출되지 않는다", () => {
    const idx = result.indexOf("requestReviewOnce(");
    expect(idx).toBeGreaterThan(-1);
    // 호출 직전 문맥에 오류·빈 상태 분기가 없어야 한다
    const before = result.slice(Math.max(0, idx - 300), idx);
    expect(before).not.toMatch(/catch\s*(\(|\{)|onError|EmptyState|\.error\b/);
    // 호출이 마운트 즉시 실행되는 `useEffect(() => { requestReviewOnce()` 형태가 아니다
    expect(result).not.toMatch(/useEffect\(\s*\(\)\s*=>\s*\{\s*requestReviewOnce\(/);
  });

  it("AC-7: 결과 화면에 shareApp({ ... })을 부르는 공유 버튼이 1곳 있다", () => {
    expect(result).toMatch(/import\s*\{[^}]*\bshareApp\b[^}]*\}\s*from\s*"@\/lib\/share"/);
    expect([...result.matchAll(/\bshareApp\(\s*\{/g)]).toHaveLength(1);
    expect(shareLib).toMatch(/export (async )?function shareApp\(/);
    expect(result).toMatch(/공유/);
  });

  it("AC-8: 공유 핸들러에 logClick이 shareApp과 함께 붙는다", () => {
    const shareAt = result.search(/\bshareApp\(\s*\{/);
    expect(shareAt).toBeGreaterThan(-1);
    const window = result.slice(Math.max(0, shareAt - 400), shareAt + 400);
    expect(window).toMatch(/logClick\(\s*"[a-z0-9_]*share[a-z0-9_]*"/);
    expect(literalNames(result, "logClick").some((n) => n.includes("share"))).toBe(true);
  });
});
