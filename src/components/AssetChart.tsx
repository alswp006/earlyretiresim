/**
 * 자산 증가 그래프 — 인라인 SVG 라인 차트(자산 곡선) + 목표자산 점선.
 *
 * D3/차트 라이브러리 금지(번들 제한) → 의존성 0인 인라인 SVG. 색은 adaptive 토큰만.
 */
const WIDTH = 320;
const HEIGHT = 180;
const PADDING = 8;

export function AssetChart({
  series,
  targetAsset,
}: {
  series: { year: number; asset: number }[];
  targetAsset: number;
}) {
  const values = series.map((p) => p.asset);
  const maxValue = Math.max(targetAsset, ...values, 1);
  const minValue = Math.min(0, ...values);
  const span = maxValue - minValue || 1;

  const toY = (asset: number) =>
    HEIGHT - PADDING - ((asset - minValue) / span) * (HEIGHT - PADDING * 2);
  const toX = (index: number) =>
    series.length <= 1 ? WIDTH / 2 : PADDING + (index / (series.length - 1)) * (WIDTH - PADDING * 2);

  const linePath =
    series.length >= 2
      ? series
          .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.asset).toFixed(1)}`)
          .join(" ")
      : "";

  const targetY = toY(targetAsset);

  return (
    <svg
      width="100%"
      height="180"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="목표 자산까지의 자산 증가 추이 그래프"
    >
      <line
        x1={0}
        y1={targetY}
        x2={WIDTH}
        y2={targetY}
        stroke="var(--adaptiveGrey400)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="var(--adaptiveBlue500)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
