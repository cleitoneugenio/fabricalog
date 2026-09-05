
const W = 600;
const H = 200;
const PADDING = { top: 28, right: 20, bottom: 36, left: 36 };
const BAR_GAP = 18;

export default function LuvasChart({ data }) {
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(1, ...data.map(d => d.pares));
  const barW = chartW / data.length - BAR_GAP;
  const scaleH = (v) => Math.max(0, (v / maxVal) * chartH);

  const yTicks = Math.min(maxVal, 4);
  const tickStep = maxVal / yTicks;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="gradLuvas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(68% 0.14 200)" />
          <stop offset="100%" stopColor="oklch(55% 0.14 200)" />
        </linearGradient>
      </defs>

      <g transform={`translate(${PADDING.left},${PADDING.top})`}>
        {/* Y grid lines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = tickStep * (yTicks - i);
          const y = chartH - scaleH(v);
          return (
            <g key={i}>
              <line
                x1={0} y1={y} x2={chartW} y2={y}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray={i === yTicks ? '0' : '3 3'}
              />
              <text
                x={-8} y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="oklch(57% 0.013 38)"
                fontFamily="Syne, system-ui, sans-serif"
              >
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const h = scaleH(d.pares);
          const gx = i * (barW + BAR_GAP) + BAR_GAP / 2;
          const hasData = d.pares > 0;

          return (
            <g key={i}>
              {hasData && (
                <rect
                  x={gx} y={chartH - h}
                  width={barW} height={h}
                  fill="url(#gradLuvas)"
                  rx={3}
                >
                  <title>{d.label}: {d.pares} par{d.pares !== 1 ? 'es' : ''}</title>
                </rect>
              )}

              {hasData && (
                <text
                  x={gx + barW / 2}
                  y={chartH - h - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fill="oklch(75% 0.01 38)"
                  fontFamily="Syne, system-ui, sans-serif"
                  fontWeight={700}
                >
                  {d.pares}
                </text>
              )}

              <text
                x={gx + barW / 2}
                y={chartH + 18}
                textAnchor="middle"
                fontSize={11}
                fill="oklch(57% 0.013 38)"
                fontFamily="Syne, system-ui, sans-serif"
                fontWeight={600}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Legend */}
      <g transform={`translate(${W - PADDING.right - 130}, ${PADDING.top - 14})`}>
        <rect x={0} y={0} width={10} height={10} fill="url(#gradLuvas)" rx={2} />
        <text x={14} y={9} fontSize={10} fill="oklch(57% 0.013 38)" fontFamily="Syne, system-ui">Pares de luvas</text>
      </g>
    </svg>
  );
}
