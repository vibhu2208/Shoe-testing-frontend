interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-black">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-black/60">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
