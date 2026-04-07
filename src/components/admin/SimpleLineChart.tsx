interface LineDatum {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: LineDatum[];
}

export default function SimpleLineChart({ data }: SimpleLineChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-black/60">No data available</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const chartWidth = 100;
  const chartHeight = 50;

  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 0 : (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - (item.value / max) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPath = `${points} ${chartWidth},${chartHeight} 0,${chartHeight}`;

  return (
    <div>
      <svg viewBox="0 0 100 56" className="h-44 w-full">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <line x1="0" y1="50" x2="100" y2="50" stroke="#00000022" strokeWidth="0.4" />
        <line x1="0" y1="25" x2="100" y2="25" stroke="#00000016" strokeWidth="0.3" />
        <polygon points={areaPath} fill="url(#lineFill)" />
        <polyline fill="none" stroke="#15803d" strokeWidth="2.4" points={points} />
        {data.map((item, index) => {
          const x = data.length === 1 ? 0 : (index / (data.length - 1)) * chartWidth;
          const y = chartHeight - (item.value / max) * chartHeight;
          return <circle key={`${item.label}-${index}`} cx={x} cy={y} r="1.8" fill="#14532d" />;
        })}
      </svg>
      <div className="mt-2 grid grid-cols-6 gap-1 text-center text-xs text-black/70">
        {data.map((item, index) => (
          <span key={`${item.label}-${index}`}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}
