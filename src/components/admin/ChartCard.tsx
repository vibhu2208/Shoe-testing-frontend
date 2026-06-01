interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  darkMode?: boolean;
}

export default function ChartCard({ title, subtitle, children, darkMode = false }: ChartCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        darkMode ? 'border-gray-800 bg-gray-900' : 'border-black/10 bg-white'
      }`}
    >
      <div className="mb-4">
        <h3 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-black'}`}>{title}</h3>
        {subtitle ? (
          <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-black/60'}`}>{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
