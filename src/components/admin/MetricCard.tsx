import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  comparison?: string;
  accent?: 'green' | 'blue';
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  comparison,
  accent = 'green',
  onClick,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const iconBg = accent === 'blue' ? 'bg-blue-100' : 'bg-green-100';
  const iconColor = accent === 'blue' ? 'text-blue-700' : 'text-green-700';

  const className = `w-full rounded-xl border border-black/10 bg-white p-4 text-left shadow-sm transition-shadow ${
    onClick ? 'cursor-pointer hover:border-green-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700' : 'hover:shadow-md'
  }`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-black/60">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-black lg:text-3xl">{value}</p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-700" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={`text-xs font-semibold ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}
                {trend}%
              </span>
              {comparison && <span className="text-xs text-black/50">{comparison}</span>}
            </div>
          )}
          {subtitle && !trend ? <p className="mt-1 text-xs text-black/50">{subtitle}</p> : null}
        </div>
        <div className={`shrink-0 rounded-lg ${iconBg} p-2.5`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
