interface BarDatum {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarDatum[];
}

export default function SimpleBarChart({ data }: SimpleBarChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-black/60">No data available</p>;
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const width = Math.max((item.value / max) * 100, 4);
        return (
          <div key={`${item.label}-${index}`}>
            <div className="mb-1 flex items-center justify-between text-xs text-black/70">
              <span>{item.label}</span>
              <span className="font-semibold text-black">{item.value}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-black/10">
              <div className="h-2.5 rounded-full bg-green-700" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
