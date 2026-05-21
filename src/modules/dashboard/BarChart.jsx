
const W = 600;
const H = 220;
const PADDING = { top: 20, right: 20, bottom: 36, left: 44 };
const GROUP_GAP = 20;

export default function BarChart({ data }) {
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const totals = data.map(d =>
    (Number(d.vendas) || 0) + (Number(d.estoque) || 0) + (Number(d.emCaminhoes) || 0)
  );
  const maxVal = Math.max(1, ...totals);
  const barW = chartW / data.length - GROUP_GAP;

  const scaleH = (v) => Math.max(0, (Number(v) / maxVal) * chartH);

  const yTicks = 4;
  const tickStep = maxVal / yTicks;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(65% 0.19 38)" />
          <stop offset="100%" stopColor="oklch(54% 0.2 38)" />
        </linearGradient>
        <linearGradient id="gradEstoque" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(68% 0.16 148)" />
          <stop offset="100%" stopColor="oklch(55% 0.16 148)" />
        </linearGradient>
        <linearGradient id="gradCaminhoes" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(65% 0.17 260)" />
          <stop offset="100%" stopColor="oklch(52% 0.17 260)" />
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
                {v.toFixed(v < 10 ? 1 : 0)}
              </text>
            </g>
          );
        })}

        {/* Stacked bars: estoque (bottom) → caminhoes (middle) → vendas (top) */}
        {data.map((d, i) => {
          const vendas      = Number(d.vendas)      || 0;
          const estoque     = Number(d.estoque)     || 0;
          const emCaminhoes = Number(d.emCaminhoes) || 0;
          const total       = vendas + estoque + emCaminhoes;
          const hV  = scaleH(vendas);
          const hE  = scaleH(estoque);
          const hC  = scaleH(emCaminhoes);
          const gx  = i * (barW + GROUP_GAP) + GROUP_GAP / 2;

          return (
            <g key={i}>
              {/* Estoque — base */}
              {hE > 0 && (
                <rect
                  x={gx} y={chartH - hE}
                  width={barW} height={hE}
                  fill="url(#gradEstoque)"
                  rx={3}
                >
                  <title>Estoque {d.label}: {estoque.toFixed(1)} mi</title>
                </rect>
              )}
              {/* Caminhões — meio */}
              {hC > 0 && (
                <rect
                  x={gx} y={chartH - hE - hC}
                  width={barW} height={hC}
                  fill="url(#gradCaminhoes)"
                  rx={hE > 0 ? 0 : 3}
                >
                  <title>Em Caminhões {d.label}: {emCaminhoes.toFixed(1)} mi</title>
                </rect>
              )}
              {/* Vendas — topo */}
              {hV > 0 && (
                <rect
                  x={gx} y={chartH - hE - hC - hV}
                  width={barW} height={hV}
                  fill="url(#gradVendas)"
                  rx={(hE > 0 || hC > 0) ? 0 : 3}
                >
                  <title>Vendas {d.label}: {vendas.toFixed(1)} mi</title>
                </rect>
              )}
              {/* Total label on top */}
              {total > 0 && (
                <text
                  x={gx + barW / 2}
                  y={chartH - hE - hC - hV - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="oklch(75% 0.01 38)"
                  fontFamily="Syne, system-ui, sans-serif"
                  fontWeight={600}
                >
                  {total.toFixed(1)}
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
      <g transform={`translate(${W - PADDING.right - 190}, ${PADDING.top - 2})`}>
        <rect x={0}   y={0} width={10} height={10} fill="url(#gradVendas)"    rx={2} />
        <text x={14}  y={9} fontSize={10} fill="oklch(57% 0.013 38)" fontFamily="Syne, system-ui">Vendas</text>
        <rect x={68}  y={0} width={10} height={10} fill="url(#gradCaminhoes)" rx={2} />
        <text x={82}  y={9} fontSize={10} fill="oklch(57% 0.013 38)" fontFamily="Syne, system-ui">Galpão</text>
        <rect x={155} y={0} width={10} height={10} fill="url(#gradEstoque)"   rx={2} />
        <text x={169} y={9} fontSize={10} fill="oklch(57% 0.013 38)" fontFamily="Syne, system-ui">Estoque</text>
      </g>
    </svg>
  );
}
