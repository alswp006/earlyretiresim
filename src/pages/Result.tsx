import { useEffect, useState } from "react";
import { Top, Paragraph, Spacing, Toast, Button, Asset } from "@toss/tds-mobile";
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
import { logClick, logImpression } from "@/lib/analytics";
import { requestReviewOnce } from "@/lib/review";
import { buildShareText, copyToClipboard, shareApp } from "@/lib/share";
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

/** 게이트가 열려 결과가 실제로 보일 때만 마운트된다 — 노출 로그와 리뷰 요청을 여기서 한 번씩 보낸다. */
function ResultSeen() {
  useEffect(() => {
    logImpression("result_hero");
    // 결과를 읽을 시간을 준 뒤에 묻는다 — 진입 즉시 팝업이 결과를 가리지 않게.
    const timer = setTimeout(() => requestReviewOnce(), 3000);
    return () => clearTimeout(timer);
  }, []);
  return null;
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
        <div style={{ minHeight: "60dvh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <EmptyState
            icon={<Asset.ContentIcon name="icon-warning-circle" alt="" style={{ width: 48, height: 48 }} />}
            title="결과를 불러오지 못했어요"
            description="입력값을 다시 확인해 주세요"
          />
        </div>
      </ScreenScaffold>
    );
  }

  const { targetAsset, current, boosted, progressPercent, compareMode } = computed;
  const fireInput = input;

  async function handleShare() {
    logClick("share_result");
    const text = buildShareText({ current }, { age: fireInput.age, monthlyExpense: fireInput.monthlyExpense });
    const ok = await shareApp({ message: text });
    if (!ok) setToast("공유하지 못했어요. 결과 복사하기를 이용해 주세요");
  }

  async function handleCopy() {
    logClick("copy_result");
    const text = buildShareText({ current }, { age: fireInput.age, monthlyExpense: fireInput.monthlyExpense });
    const ok = await copyToClipboard(text);
    setToast(ok ? "결과를 복사했어요" : "복사에 실패했어요. 다시 시도해주세요");
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>결과</Top.TitleParagraph>} />}>
      <RewardGate slotId="result-unlock">
        <ResultSeen />
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
        <Spacing size={16} />

        <Button variant="weak" display="block" onClick={handleShare}>
          결과 공유하기
        </Button>
        <Spacing size={96} />

        <ButtonStack
          primary={{ label: "결과 복사하기", onClick: handleCopy }}
          secondary={{
            label: "다시 계산하기",
            onClick: () => {
              logClick("recalculate");
              navigate("/");
            },
          }}
        />

        <Toast open={!!toast} text={toast ?? ""} position="bottom" onClose={() => setToast(null)} />
      </RewardGate>
    </ScreenScaffold>
  );
}
