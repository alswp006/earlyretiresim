import { chromium } from "playwright";
import { spawn } from "node:child_process";

const preview = spawn("npx", ["vite", "preview", "--port", "4321", "--strictPort"], {
  cwd: "/home/minje/ai-factory-work/earlyretiresim-qtmj",
  stdio: ["ignore", "pipe", "pipe"],
});

await new Promise((resolve, reject) => {
  let out = "";
  const t = setTimeout(() => reject(new Error("preview server timeout: " + out)), 20000);
  preview.stdout.on("data", (d) => {
    out += d.toString();
    if (out.includes("Local:")) {
      clearTimeout(t);
      resolve();
    }
  });
  preview.stderr.on("data", (d) => (out += d.toString()));
});

const browser = await chromium.launch();

// --- Dark mode check ---
const darkCtx = await browser.newContext({ colorScheme: "dark", viewport: { width: 390, height: 844 } });
const darkPage = await darkCtx.newPage();
await darkPage.goto("http://localhost:4321/");
await darkPage.waitForTimeout(500);
const bg = await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor);
const rootBg = await darkPage.evaluate(() => getComputedStyle(document.getElementById("root")).backgroundColor);
console.log("dark mode body bg:", bg, "root bg:", rootBg);

// Seed storage + navigate to result to check dark-mode result screen
await darkPage.evaluate(() => {
  localStorage.setItem("ers:lastInput", JSON.stringify({ age: 27, monthlyIncome: 3200000, monthlyExpense: 2160000, netWorth: 20000000, annualReturnRate: 0.06 }));
});
await darkPage.goto("http://localhost:4321/");
await darkPage.waitForTimeout(300);
// fill form and submit to navigate with route state (simpler: type in fields)
const ageInput = darkPage.getByPlaceholder("나이 (예: 32)");
await ageInput.fill("27");
await darkPage.getByPlaceholder("월 실수령액 (예: 3,200,000)").fill("3200000");
await darkPage.getByPlaceholder("월 지출 (예: 2,160,000)").fill("2160000");
await darkPage.getByPlaceholder("현재 순자산 (예: 50,000,000)").fill("20000000");
await darkPage.waitForTimeout(200);
const summaryText = await darkPage.locator("body").innerText();
console.log("--- summary section includes 저축률? ---", summaryText.includes("저축률"));
await darkPage.getByRole("button", { name: /은퇴 나이 계산하기/ }).click();
await darkPage.waitForTimeout(800);
console.log("URL after submit:", darkPage.url());
const resultBg = await darkPage.evaluate(() => getComputedStyle(document.getElementById("root")).backgroundColor);
console.log("result dark bg:", resultBg);
await darkPage.screenshot({ path: "/tmp/result-dark.png", fullPage: true });

const bodyTextResult = await darkPage.locator("body").innerText();
console.log("--- contains 10%p 더 저축하면?", bodyTextResult.includes("10%p 더 저축하면"));
console.log("--- contains 저축률 (twice)?", (bodyTextResult.match(/저축률/g) || []).length);

// --- Age validation check ---
const lightCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const lightPage = await lightCtx.newPage();
await lightPage.goto("http://localhost:4321/");
await lightPage.waitForTimeout(300);
const ageInput2 = lightPage.getByPlaceholder("나이 (예: 32)");
await ageInput2.fill("999");
await lightPage.getByPlaceholder("월 실수령액 (예: 3,200,000)").fill("3200000");
await lightPage.getByPlaceholder("월 지출 (예: 2,160,000)").fill("2160000");
await lightPage.getByPlaceholder("현재 순자산 (예: 50,000,000)").fill("20000000");
await lightPage.waitForTimeout(200);
const ageValue = await ageInput2.inputValue();
console.log("age field value after typing 999:", ageValue);
const isDisabled = await lightPage.getByRole("button", { name: /은퇴 나이 계산하기/ }).isDisabled();
console.log("submit button disabled with age=999:", isDisabled);
const errorText = await lightPage.locator("body").innerText();
console.log("shows age range error:", errorText.includes("나이는"));
await lightPage.screenshot({ path: "/tmp/age-999.png", fullPage: true });

await browser.close();
preview.kill();
