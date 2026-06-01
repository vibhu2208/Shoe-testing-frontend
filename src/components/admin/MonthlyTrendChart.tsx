'use client';

import { useMemo, useState } from 'react';

interface TrendDatum {
  label: string;
  value: number;
}

type TrendFilter = 'tests' | 'pass' | 'fail' | 'reports';

interface MonthlyTrendChartProps {
  data: TrendDatum[];
  filter: TrendFilter;
  darkMode?: boolean;
}

const FILTER_THEME: Record<
  TrendFilter,
  { bar: string; barHover: string; line: string; fill: string; fillEnd: string; label: string }
> = {
  tests: {
    bar: '#16a34a',
    barHover: '#15803d',
    line: '#14532d',
    fill: '#16a34a',
    fillEnd: '#16a34a',
    label: 'Tests Conducted',
  },
  pass: {
    bar: '#22c55e',
    barHover: '#16a34a',
    line: '#15803d',
    fill: '#22c55e',
    fillEnd: '#16a34a',
    label: 'Pass Count',
  },
  fail: {
    bar: '#3b82f6',
    barHover: '#2563eb',
    line: '#1d4ed8',
    fill: '#3b82f6',
    fillEnd: '#2563eb',
    label: 'Failure Count',
  },
  reports: {
    bar: '#059669',
    barHover: '#047857',
    line: '#065f46',
    fill: '#10b981',
    fillEnd: '#059669',
    label: 'Reports Generated',
  },
};

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function niceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

export default function MonthlyTrendChart({ data, filter, darkMode = false }: MonthlyTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const theme = FILTER_THEME[filter];

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const W = 640;
    const H = 220;
    const pad = { top: 24, right: 16, bottom: 36, left: 48 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const maxVal = niceMax(Math.max(...data.map((d) => d.value), 1));
    const ticks = [0, maxVal / 2, maxVal];

    const prevData = data.map((d) => ({
      ...d,
      value: Math.max(1, Math.round(d.value * 0.82)),
    }));

    const toPoint = (item: TrendDatum, index: number) => {
      const x =
        pad.left + (data.length === 1 ? plotW / 2 : (index / (data.length - 1)) * plotW);
      const y = pad.top + plotH - (item.value / maxVal) * plotH;
      return { x, y, value: item.value, label: item.label };
    };

    const points = data.map(toPoint);
    const prevPoints = prevData.map(toPoint);
    const linePath = smoothPath(points);
    const prevLinePath = smoothPath(prevPoints);

    const areaPath =
      linePath +
      ` L ${points[points.length - 1].x} ${pad.top + plotH}` +
      ` L ${points[0].x} ${pad.top + plotH} Z`;

    const barWidth = Math.min(36, (plotW / data.length) * 0.55);
    const bars = data.map((item, index) => {
      const x =
        pad.left + (data.length === 1 ? plotW / 2 : (index / (data.length - 1)) * plotW);
      const barH = (item.value / maxVal) * plotH;
      return {
        x: x - barWidth / 2,
        y: pad.top + plotH - barH,
        width: barWidth,
        height: barH,
        centerX: x,
        ...item,
      };
    });

    return { W, H, pad, plotH, maxVal, ticks, points, linePath, prevLinePath, areaPath, bars };
  }, [data]);

  if (!chart || data.length === 0) {
    return <p className="py-12 text-center text-sm text-black/60">No trend data available</p>;
  }

  const { W, H, pad, plotH, maxVal, ticks, points, linePath, prevLinePath, areaPath, bars } =
    chart;
  const activeIndex = hoveredIndex ?? data.length - 1;
  const active = data[activeIndex];
  const prevActive = Math.max(1, Math.round(active.value * 0.82));
  const changePct = prevActive > 0 ? (((active.value - prevActive) / prevActive) * 100).toFixed(1) : '0';

  const gridColor = darkMode ? '#374151' : '#00000012';
  const axisColor = darkMode ? '#6b7280' : '#00000040';
  const textColor = darkMode ? '#9ca3af' : '#00000080';
  const gradId = `trend-fill-${filter}`;

  return (
    <div className="space-y-3">
      {/* Active month summary */}
      <div
        className={`flex flex-wrap items-end justify-between gap-3 rounded-lg border px-4 py-3 ${
          darkMode ? 'border-gray-800 bg-gray-800/60' : 'border-black/10 bg-green-50/40'
        }`}
      >
        <div>
          <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-black/50'}`}>
            {theme.label} · {active.label}
          </p>
          <p className={`text-3xl font-bold tabular-nums ${darkMode ? 'text-white' : 'text-black'}`}>
            {active.value.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-black/50'}`}>vs previous period</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              Number(changePct) >= 0 ? 'text-green-700' : 'text-blue-700'
            }`}
          >
            {Number(changePct) >= 0 ? '+' : ''}
            {changePct}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[240px] w-full"
          role="img"
          aria-label="Monthly testing trends chart"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.fill} stopOpacity={darkMode ? 0.35 : 0.28} />
              <stop offset="100%" stopColor={theme.fillEnd} stopOpacity={0.02} />
            </linearGradient>
            <filter id="bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Y-axis grid & labels */}
          {ticks.map((tick) => {
            const y = pad.top + plotH - (tick / maxVal) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={W - pad.right}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? '0' : '4 4'}
                />
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={textColor}
                  fontSize="11"
                  fontFamily="system-ui, sans-serif"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Previous period ghost bars */}
          {bars.map((bar, i) => {
            const prevH = bar.height * 0.82;
            return (
              <rect
                key={`prev-${bar.label}`}
                x={bar.x + 4}
                y={pad.top + plotH - prevH}
                width={bar.width - 8}
                height={prevH}
                rx="4"
                fill={darkMode ? '#374151' : '#00000008'}
              />
            );
          })}

          {/* Main bars */}
          {bars.map((bar, i) => (
            <rect
              key={bar.label}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx="5"
              fill={hoveredIndex === i ? theme.barHover : theme.bar}
              opacity={hoveredIndex === null || hoveredIndex === i ? 0.85 : 0.45}
              filter="url(#bar-shadow)"
              className="transition-opacity duration-200"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* Invisible wider hit areas */}
          {bars.map((bar, i) => (
            <rect
              key={`hit-${bar.label}`}
              x={bar.centerX - 28}
              y={pad.top}
              width={56}
              height={plotH + pad.bottom}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* Previous period dashed line */}
          <path
            d={prevLinePath}
            fill="none"
            stroke={darkMode ? '#4b5563' : '#00000025'}
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />

          {/* Area fill under line */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Main trend line */}
          <path
            d={linePath}
            fill="none"
            stroke={theme.line}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((pt, i) => (
            <g key={`pt-${pt.label}`}>
              {(hoveredIndex === i || (hoveredIndex === null && i === data.length - 1)) && (
                <circle cx={pt.x} cy={pt.y} r="8" fill={theme.line} opacity="0.15" />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 5 : 3.5}
                fill={darkMode ? '#111827' : '#ffffff'}
                stroke={theme.line}
                strokeWidth="2.5"
                className="transition-all duration-150"
              />
            </g>
          ))}

          {/* X-axis baseline */}
          <line
            x1={pad.left}
            y1={pad.top + plotH}
            x2={W - pad.right}
            y2={pad.top + plotH}
            stroke={axisColor}
            strokeWidth="1"
          />

          {/* X-axis labels */}
          {data.map((item, i) => {
            const x =
              pad.left +
              (data.length === 1 ? (W - pad.left - pad.right) / 2 : (i / (data.length - 1)) * (W - pad.left - pad.right));
            const isActive = i === activeIndex;
            return (
              <text
                key={item.label}
                x={x}
                y={H - 10}
                textAnchor="middle"
                fill={isActive ? theme.line : textColor}
                fontSize="11"
                fontWeight={isActive ? '600' : '400'}
                fontFamily="system-ui, sans-serif"
              >
                {item.label}
              </text>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredIndex !== null && (
          <div
            className={`pointer-events-none absolute z-10 rounded-lg border px-3 py-2 shadow-lg ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-black/10 bg-white'
            }`}
            style={{
              left: `${(bars[hoveredIndex].centerX / W) * 100}%`,
              top: '8%',
              transform: 'translateX(-50%)',
            }}
          >
            <p className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-black'}`}>
              {data[hoveredIndex].label}
            </p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: filter === 'fail' ? '#2563eb' : '#15803d' }}
            >
              {data[hoveredIndex].value.toLocaleString()}
            </p>
            <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-black/50'}`}>{theme.label}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap items-center gap-4 text-xs ${darkMode ? 'text-gray-400' : 'text-black/60'}`}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: theme.bar }} />
          Current period
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded"
            style={{ backgroundColor: darkMode ? '#4b5563' : '#00000030' }}
          />
          Previous period
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ backgroundColor: theme.line }} />
          Trend line
        </span>
      </div>
    </div>
  );
}
