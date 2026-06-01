interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
}

export default function DonutChart({ data, size = 160 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-black/60">No data available</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#00000012" strokeWidth="12" />
          {data.map((segment, i) => {
            const pct = segment.value / total;
            const dash = pct * circumference;
            const circle = (
              <circle
                key={`${segment.label}-${i}`}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-black">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-black/50">Total Tests</span>
        </div>
      </div>
      <div className="w-full flex-1 space-y-2">
        {data.map((segment, i) => (
          <div key={`${segment.label}-${i}`} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate text-black/70">{segment.label}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-semibold tabular-nums text-black">{segment.value}</span>
              <span className="text-xs text-black/50">{Math.round((segment.value / total) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
