import { useMemo, useState, type FocusEvent } from "react";
import { Top, Paragraph, Spacing, ListRow, TextField, Chip, ChipItem, Toast } from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { useNavigate, type NavigateFunction } from "react-router-dom";

import { ScreenScaffold } from "@/components/ScreenScaffold";
import { SubmitFooter } from "@/components/BottomCTA";
import { EmptyState } from "@/components/StateView";
import { AdSlot } from "@/components/AdSlot";
import { safeGet, safeSet } from "@/lib/storage";
import { sanitizeNumeric, validateEmpty, validateInput } from "@/lib/validation";
import { calcSavingsRate } from "@/lib/fire";
import { formatNumber } from "@/lib/utils";
import { STORAGE_KEY, type FireInput, type RouteState } from "@/lib/types";

type FieldKey = "age" | "monthlyIncome" | "monthlyExpense" | "netWorth";

// TextField placeholder에 항목명을 함께 넣는다 — line variant의 플로팅 라벨은 빈 칸+비포커스에서
// 숨으므로, 빈 칸만 보이는 첫 화면에서 어느 칸이 소득이고 지출인지 구분돼야 한다.
const FIELDS: { key: FieldKey; label: string; placeholder: string }[] = [
  { key: "age", label: "나이", placeholder: "나이 (예: 32)" },
  { key: "monthlyIncome", label: "월 실수령액", placeholder: "월 실수령액 (예: 3,200,000)" },
  { key: "monthlyExpense", label: "월 지출", placeholder: "월 지출 (예: 2,160,000)" },
  { key: "netWorth", label: "현재 순자산", placeholder: "현재 순자산 (예: 50,000,000)" },
];

const RATE_OPTIONS: { value: 0.04 | 0.06 | 0.08; label: string }[] = [
  { value: 0.04, label: "4%" },
  { value: 0.06, label: "6%" },
  { value: 0.08, label: "8%" },
];

function fireTickHaptic() {
  try {
    Promise.resolve(generateHapticFeedback({ type: "tickWeak" })).catch(() => {});
  } catch {
    // WebView 밖(브라우저/검수자 PC/jsdom)에서는 throw — 무시
  }
}

function loadSavedInput(): FireInput | null {
  return safeGet<FireInput>(STORAGE_KEY);
}

/**
 * Home → Result: 계산 완료 후 결과 화면으로 이동한다.
 * Result 화면은 입력값(FireInput)을 받아 화면에서 직접 계산하는 구조라
 * (packet 0002/0007), 여기서 넘기는 값은 계산 결과가 아니라 계산에 쓰인 입력값이다.
 */
export function navigateToResult(navigate: NavigateFunction, input: FireInput): void {
  navigate("/result", { state: { input } satisfies RouteState });
}

export default function Home() {
  const navigate = useNavigate();
  const saved = useMemo(loadSavedInput, []);

  const [values, setValues] = useState<Record<FieldKey, string>>(() => ({
    age: saved ? String(saved.age) : "",
    monthlyIncome: saved ? String(saved.monthlyIncome) : "",
    monthlyExpense: saved ? String(saved.monthlyExpense) : "",
    netWorth: saved ? String(saved.netWorth) : "",
  }));
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    age: false,
    monthlyIncome: false,
    monthlyExpense: false,
    netWorth: false,
  });
  const [annualReturnRate, setAnnualReturnRate] = useState<0.04 | 0.06 | 0.08>(
    saved?.annualReturnRate ?? 0.06,
  );
  const [saveFailed, setSaveFailed] = useState(false);

  // 콘솔에서 발급받은 광고 그룹 ID. 미설정이면 배너 자체를 렌더하지 않는다(빈 영역 방지).
  const adGroupId = import.meta.env.VITE_TOSS_AD_GROUP_ID as string | undefined;

  const hasAnyValue = FIELDS.some((f) => values[f.key] !== "");

  const expenseBusinessError =
    values.monthlyIncome !== "" && values.monthlyExpense !== ""
      ? validateInput("monthlyExpense", {
          monthlyIncome: Number(values.monthlyIncome),
          monthlyExpense: Number(values.monthlyExpense),
        })
      : null;
  const anyEmpty = FIELDS.some((f) => values[f.key] === "");
  const isValid = !anyEmpty && !expenseBusinessError;

  const showSummary = values.monthlyIncome !== "" && values.monthlyExpense !== "" && !expenseBusinessError;
  const savingsRate = showSummary
    ? calcSavingsRate(Number(values.monthlyIncome), Number(values.monthlyExpense))
    : 0;
  const monthlySaving = showSummary
    ? Number(values.monthlyIncome) - Number(values.monthlyExpense)
    : 0;

  function fieldError(key: FieldKey): string | null {
    if (key === "monthlyExpense" && expenseBusinessError) return expenseBusinessError;
    if (touched[key] && values[key] === "") return validateEmpty(undefined);
    return null;
  }

  function handleChange(key: FieldKey, raw: string) {
    // 나이는 정수만 의미가 있다 — "1.5"를 sanitizeNumeric에 그대로 넣으면 소수점만 지워져
    // "15"로 뒤바뀐다(입력값 왜곡, 아무 경고도 없음). 소수점 이하는 버리고 정수부만 취한다.
    const nextRaw = key === "age" ? raw.split(".")[0] : raw;
    setValues((prev) => ({ ...prev, [key]: sanitizeNumeric(nextRaw) }));
  }

  function handleBlur(key: FieldKey) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    try {
      e.target.scrollIntoView({ block: "center" });
    } catch {
      // 구형 WebView는 scrollIntoView 옵션 미지원 가능 — 무시
    }
  }

  function handleSelectRate(rate: 0.04 | 0.06 | 0.08) {
    setAnnualReturnRate(rate);
    fireTickHaptic();
  }

  function handleSubmit() {
    if (!isValid) return;
    const input: FireInput = {
      age: Number(values.age),
      monthlyIncome: Number(values.monthlyIncome),
      monthlyExpense: Number(values.monthlyExpense),
      netWorth: Number(values.netWorth),
      annualReturnRate,
    };
    const ok = safeSet(STORAGE_KEY, input);
    setSaveFailed(!ok);
    navigateToResult(navigate, input);
  }

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>조기은퇴 시뮬레이터</Top.TitleParagraph>} />}
      bottom={<SubmitFooter label="은퇴 나이 계산하기" onClick={handleSubmit} disabled={!isValid} />}
    >
      {!hasAnyValue && (
        <EmptyState
          title="아직 계산 기록이 없어요"
          description="월 소득과 지출을 입력하면 은퇴 가능 나이를 알려드려요"
        />
      )}

      {FIELDS.map((field) => (
        <div key={field.key}>
          <TextField
            variant="line"
            label={field.label}
            aria-label={field.label}
            placeholder={field.placeholder}
            inputMode="numeric"
            enterKeyHint={field.key === "netWorth" ? "done" : "next"}
            value={values[field.key] === "" ? "" : formatNumber(Number(values[field.key]))}
            onChange={(e) => handleChange(field.key, e.target.value)}
            onFocus={handleFocus}
            onBlur={() => handleBlur(field.key)}
            hasError={Boolean(fieldError(field.key))}
            help={fieldError(field.key)}
          />
          <Spacing size={16} />
        </div>
      ))}

      <Paragraph.Text typography="st12">기대 연수익률</Paragraph.Text>
      <Spacing size={8} />
      {/* 인접 칩 오탭 방지 — 탭 영역 사이 간격을 넓게(large) */}
      <Chip kind="select" margin="large">
        {RATE_OPTIONS.map((option) => (
          <ChipItem
            key={option.value}
            selected={annualReturnRate === option.value}
            onClick={() => handleSelectRate(option.value)}
          >
            {option.label}
          </ChipItem>
        ))}
      </Chip>

      <Spacing size={16} />

      {showSummary && (
        <ListRow
          border="none"
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="저축률 요약"
              bottom={`저축률 ${savingsRate}% · 월 저축 ${formatNumber(monthlySaving)}원`}
            />
          }
        />
      )}

      <Spacing size={12} />

      {/* 하단 배너 — WebView 밖이거나 로드 실패면 AdSlot이 조용히 빈 노드로 남는다(에러 박스·안내 문구 없음). */}
      {adGroupId ? <AdSlot adGroupId={adGroupId} /> : null}

      {/* 하단 고정 CTA(FixedBottomCTA)에 콘텐츠가 가리지 않도록 확보하는 여백 */}
      <div style={{ height: "calc(var(--toss-safe-area-bottom, 0px) + 88px)" }} />

      <Toast
        open={saveFailed}
        text="계산 기록을 저장하지 못했어요"
        position="bottom"
        onClose={() => setSaveFailed(false)}
      />
    </ScreenScaffold>
  );
}
