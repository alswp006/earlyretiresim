import { useMemo, useState, type FocusEvent } from "react";
import { Top, Paragraph, Spacing, ListRow, TextField, Chip, ChipItem, Toast } from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { useNavigate } from "react-router-dom";

import { ScreenScaffold } from "@/components/ScreenScaffold";
import { SubmitFooter } from "@/components/BottomCTA";
import { EmptyState } from "@/components/StateView";
import { safeGet, safeSet } from "@/lib/storage";
import { sanitizeNumeric, validateEmpty, validateInput } from "@/lib/validation";
import { calcSavingsRate } from "@/lib/fire";
import { formatNumber } from "@/lib/utils";
import { STORAGE_KEY, type FireInput, type RouteState } from "@/lib/types";

type FieldKey = "age" | "monthlyIncome" | "monthlyExpense" | "netWorth";

const FIELDS: { key: FieldKey; label: string; placeholder: string }[] = [
  { key: "age", label: "나이", placeholder: "예: 32" },
  { key: "monthlyIncome", label: "월 실수령액", placeholder: "예: 320만원" },
  { key: "monthlyExpense", label: "월 지출", placeholder: "예: 216만원" },
  { key: "netWorth", label: "현재 순자산", placeholder: "예: 5,000만원" },
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
    setValues((prev) => ({ ...prev, [key]: sanitizeNumeric(raw) }));
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
    navigate("/result", { state: { input } satisfies RouteState });
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
      <Chip kind="select">
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

      <Toast
        open={saveFailed}
        text="계산 기록을 저장하지 못했어요"
        position="bottom"
        onClose={() => setSaveFailed(false)}
      />
    </ScreenScaffold>
  );
}
