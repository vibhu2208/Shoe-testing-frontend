interface GaugeChartProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color?: string;
}

export default function GaugeChart({
  label,
  value,
  max = 100,
  unit = '%',
  color = '#15803d',
}: GaugeChartProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = 36;
  const circumference = Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center rounded-lg border border-black/10 bg-green-50/40 p-3">
      <svg viewBox="0 0 80 48" className="h-16 w-full">
        <path
          d="M 8 44 A 36 36 0 0 1 72 44"
          fill="none"
          stroke="#00000014"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 8 44 A 36 36 0 0 1 72 44"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <p className="-mt-1 text-lg font-bold tabular-nums text-black">
        {value}
        {unit}
      </p>
      <p className="text-center text-[11px] font-medium text-black/60">{label}</p>
    </div>
  );
}
