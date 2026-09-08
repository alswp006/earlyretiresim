import { useState } from "react";
import { Top, Paragraph, Spacing, Toast } from "@toss/tds-mobile";
import { useLocation, useNavigate } from "react-router-dom";

import { ScreenScaffold } from "@/components/ScreenScaffold";
import { SubmitFooter, ButtonStack } from "@/components/BottomCTA";
import { EmptyState } from "@/components/StateView";
import { Card } from "@/components/Card";
import { SummaryHero } from "@/components/SummaryHero";
import { MiniBar } from "@/components/MiniBar";
import { AssetChart } from "@/components/AssetChart";
import { RewardGate } from "@/components/RewardGate";
import { ScenarioCompare } from "@/components/ScenarioCompare";
import {
  calcTargetAsset,
  simulate,
  calcBoostedScenario,
  calcProgressPercent,
  getCompareMode,
} from "@/lib/fire";
import { buildShareText, copyToClipboard } from "@/lib/share";
import { formatCurrency } from "@/lib/utils";
import type { FireInput, RouteState, ScenarioResult, CompareMode } from "@/lib/types";

interface ComputedResult {
  targetAsset: number;
  current: ScenarioResult;
  boosted: ScenarioResult;
  progressPercent: number;
  compareMode: CompareMode;
}

function computeResult(input: FireInput): ComputedResult {
  const targetAsset = calcTargetAsset(input.monthlyExpense);
  const current = simulate(
    input.age,
    input.netWorth,
    input.monthlyIncome,
    input.monthlyExpense,
    targetAsset,
    input.annualReturnRate,
  );
  const boosted = calcBoostedScenario(current, input.monthlyIncome, targetAsset, input.age, input.annualReturnRate);
  const progressPercent = calcProgressPercent(input.netWorth, targetAsset);
  const compareMode = getCompareMode(current, boosted);

  return { targetAsset, current, boosted, progressPercent, compareMode };
}

function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const state = location.state as RouteState | null;

  let computed: ComputedResult | null = null;
  let input: FireInput | null = null;
  if (state?.input) {
    try {
      input = state.input;
      computed = computeResult(state.input);
    } catch {
      computed = null;
    }
  }

  if (!input || !computed) {
    return (
      <ScreenScaffold
        top={<Top title={<Top.TitleParagraph>결과</Top.TitleParagraph>} />}
        bottom={<SubmitFooter label="다시 입력하기" onClick={() => navigate("/")} />}
      >
        <EmptyState
          title="결과를 불러오지 못했어요"
          description="입력값을 다시 확인해 주세요"
        />
      </ScreenScaffold>
    );
  }

  const { targetAsset, current, boosted, progressPercent, compareMode } = computed;
  const fireInput = input;

  async function handleCopy() {
    const text = buildShareText({ current }, { age: fireInput.age, monthlyExpense: fireInput.monthlyExpense });
    const ok = await copyToClipboard(text);
    setToast(ok ? "결과를 복사했어요" : "복사에 실패했어요. 다시 시도해주세요");
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>결과</Top.TitleParagraph>} />}>
      <RewardGate slotId="result-unlock">
        <SummaryHero
          label="예상 은퇴 나이"
          value={
            current.monthsToFire !== null && current.retireAge !== null ? (
              <Paragraph.Text typography="t1">
                {`${Math.round(current.retireAge)}세 (${formatDuration(current.monthsToFire)} 후)`}
              </Paragraph.Text>
            ) : (
              <Paragraph.Text typography="t3">
                현재 조건으로는 50년 내 목표 달성이 어려워요
              </Paragraph.Text>
            )
          }
          caption={`목표 자산 ${formatCurrency(targetAsset)}`}
        />
        <Spacing size={16} />

        <Card>
          <Paragraph.Text typography="st12">{`진행률 ${progressPercent}%`}</Paragraph.Text>
          <Spacing size={8} />
          <MiniBar ratio={progressPercent / 100} />
        </Card>
        <Spacing size={16} />

        <Card>
          <Paragraph.Text typography="st5">자산 증가 추이</Paragraph.Text>
          <Spacing size={8} />
          <AssetChart series={current.series} targetAsset={targetAsset} />
        </Card>
        <Spacing size={16} />

        <ScenarioCompare current={current} boosted={boosted} mode={compareMode} />
        <Spacing size={96} />

        <ButtonStack
          primary={{ label: "결과 복사하기", onClick: handleCopy }}
          secondary={{ label: "다시 계산하기", onClick: () => navigate("/") }}
        />

        <Toast open={!!toast} text={toast ?? ""} position="bottom" onClose={() => setToast(null)} />
      </RewardGate>
    </ScreenScaffold>
  );
}
