
const W = 600;
const H = 200;
const PADDING = { top: 28, right: 20, bottom: 36, left: 36 };
const BAR_GAP = 18;

export default function FornosChart({ data }) {
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(1, ...data.map(d => Math.max(d.real, d.plano || 0)));
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
        <linearGradient id="gradFornos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(65% 0.19 38)" />
          <stop offset="100%" stopColor="oklch(52% 0.2 38)" />
        </linearGradient>
        <linearGradient id="gradFornosMiss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(76% 0.17 68)" />
          <stop offset="100%" stopColor="oklch(62% 0.17 68)" />
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
                stroke="oklch(23% 0.015 38)"
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
          const hR = scaleH(d.real);
          const gx = i * (barW + BAR_GAP) + BAR_GAP / 2;
          const metOk = d.plano == null || d.real >= d.plano;
          const hasData = d.real > 0;

          return (
            <g key={i}>
              {/* Bar */}
              {hasData && (
                <rect
                  x={gx} y={chartH - hR}
                  width={barW} height={hR}
                  fill={metOk ? 'url(#gradFornos)' : 'url(#gradFornosMiss)'}
                  rx={3}
                >
                  <title>{d.label}: {d.real} forno{d.real !== 1 ? 's' : ''}</title>
                </rect>
              )}

              {/* Planned target line */}
              {d.plano != null && d.plano > 0 && (
                <line
                  x1={gx - 3} y1={chartH - scaleH(d.plano)}
                  x2={gx + barW + 3} y2={chartH - scaleH(d.plano)}
                  stroke="oklch(65% 0.012 38)"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                >
                  <title>Plano {d.label}: {d.plano} fornos</title>
                </line>
              )}

              {/* Value label on top */}
              {hasData && (
                <text
                  x={gx + barW / 2}
                  y={chartH - hR - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fill="oklch(75% 0.01 38)"
                  fontFamily="Syne, system-ui, sans-serif"
                  fontWeight={700}
                >
                  {d.real}
                </text>
              )}

              {/* Day label */}
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
      <g transform={`translate(${W - PADDING.right - 170}, ${PADDING.top - 14})`}>
        <rect x={0} y={0} width={10} height={10} fill="url(#gradFornos)" rx={2} />
        <text x={14} y={9} fontSize={10} fill="oklch(57% 0.013 38)" fontFamily="Syne, system-ui">Fornos</text>
        <line x1={62} y1={5} x2={74} y2={5} stroke="oklch(65% 0.012 38)" strokeWidth={1.5} strokeDasharray="3 2" />
        <text x={78} y={9} fontSize={10} fill="oklch(57% 0.013 38)" fontFamily="Syne, system-ui">Meta do dia</text>
      </g>
    </svg>
  );
}
