interface PipelineStage {
  label: string;
  count: number;
  percentage: number;
}

interface SamplePipelineProps {
  stages: PipelineStage[];
}

const STAGE_COLORS = [
  'bg-blue-600',
  'bg-blue-500',
  'bg-green-600',
  'bg-green-500',
  'bg-green-700',
  'bg-green-800',
];

export default function SamplePipeline({ stages }: SamplePipelineProps) {
  const total = stages.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full">
        {stages.map((stage, i) => (
          <div
            key={stage.label}
            className={`${STAGE_COLORS[i % STAGE_COLORS.length]} transition-all`}
            style={{ width: `${(stage.count / total) * 100}%` }}
            title={`${stage.label}: ${stage.count}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((stage, i) => (
          <div
            key={stage.label}
            className="rounded-lg border border-black/10 bg-white p-3 transition-colors hover:border-green-700/30 hover:bg-green-50/50"
          >
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[i % STAGE_COLORS.length]}`} />
              <span className="text-[11px] font-medium leading-tight text-black/60">{stage.label}</span>
            </div>
            <p className="text-xl font-bold tabular-nums text-black">{stage.count}</p>
            <p className="text-xs text-black/50">{stage.percentage}% of pipeline</p>
          </div>
        ))}
      </div>
    </div>
  );
}
