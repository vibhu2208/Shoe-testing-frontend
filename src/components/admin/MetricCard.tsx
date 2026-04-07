import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
}

export default function MetricCard({ title, value, subtitle, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-black/70">{title}</p>
          <p className="mt-2 text-3xl font-bold text-black">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-black/60">{subtitle}</p> : null}
        </div>
        <div className="rounded-lg bg-green-100 p-2.5">
          <Icon className="h-5 w-5 text-green-700" />
        </div>
      </div>
    </div>
  );
}
