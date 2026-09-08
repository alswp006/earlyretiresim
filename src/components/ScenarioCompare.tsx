import { Chip, ListRow, Paragraph, Spacing } from "@toss/tds-mobile";

import type { CompareMode, ScenarioResult } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/Card";

function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

function ScenarioCard({
  title,
  scenario,
  testId,
}: {
  title: string;
  scenario: ScenarioResult;
  testId: string;
}) {
  const { monthsToFire, retireAge, monthlySaving } = scenario;

  return (
    <Card testId={testId} style={{ flex: 1 }}>
      <Paragraph.Text typography="st5">{title}</Paragraph.Text>
      <Spacing size={8} />
      {monthsToFire === null || retireAge === null ? (
        <>
          <Chip kind="action">달성 어려움</Chip>
          <Spacing size={8} />
          <Paragraph.Text typography="st13">50년 내 미달성</Paragraph.Text>
        </>
      ) : (
        <>
          <ListRow border="none">
            <Paragraph.Text typography="st12">은퇴 나이</Paragraph.Text>
            <Paragraph.Text typography="t5">{`${Math.round(retireAge)}세`}</Paragraph.Text>
          </ListRow>
          <ListRow border="none">
            <Paragraph.Text typography="st12">필요 기간</Paragraph.Text>
            <Paragraph.Text typography="t5">{formatDuration(monthsToFire)}</Paragraph.Text>
          </ListRow>
          <ListRow border="none">
            <Paragraph.Text typography="st12">월 저축액</Paragraph.Text>
            <Paragraph.Text typography="t5">{formatCurrency(monthlySaving)}</Paragraph.Text>
          </ListRow>
        </>
      )}
    </Card>
  );
}

export function ScenarioCompare({
  current,
  boosted,
  mode,
}: {
  current: ScenarioResult;
  boosted: ScenarioResult;
  mode: CompareMode;
}) {
  const diffMonths =
    current.monthsToFire !== null && boosted.monthsToFire !== null
      ? current.monthsToFire - boosted.monthsToFire
      : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 12 }}>
        <ScenarioCard title="현재" scenario={current} testId="scenario-card-current" />
        <ScenarioCard title="저축률 +10%p" scenario={boosted} testId="scenario-card-boosted" />
      </div>
      <Spacing size={16} />
      {mode === "both" && diffMonths !== null && (
        <Paragraph.Text typography="st13">
          저축률 10%p만 올려도 {formatDuration(diffMonths)} 빨라져요
        </Paragraph.Text>
      )}
      {mode === "boostedOnly" && boosted.retireAge !== null && (
        <Paragraph.Text typography="st13">
          저축률을 10%p 올리면 {Math.round(boosted.retireAge)}세에 은퇴할 수 있어요
        </Paragraph.Text>
      )}
      {mode === "neither" && (
        <Paragraph.Text typography="st13">
          지출을 줄이거나 소득을 늘리면 목표에 닿을 수 있어요
        </Paragraph.Text>
      )}
      {mode === "capped" && (
        <Paragraph.Text typography="st13">이미 저축률 상한(90%)에 도달했어요</Paragraph.Text>
      )}
    </div>
  );
}
