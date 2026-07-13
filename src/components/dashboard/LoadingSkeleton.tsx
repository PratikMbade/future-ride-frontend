interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`glass-card animate-pulse p-5 ${className}`}>
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-4 h-7 w-32 rounded bg-white/10" />
      <div className="mt-6 h-3 w-20 rounded bg-white/[0.08]" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`glass-card animate-pulse overflow-hidden p-0 ${className}`}>
      <div className="border-b border-white/10 px-5 py-3">
        <div className="h-3 w-32 rounded bg-white/10" />
      </div>
      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-3 flex-1 rounded bg-white/[0.08]" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton({
  rows = 6,
  className,
}: LoadingSkeletonProps) {
  return <TableSkeleton rows={rows} className={className} />;
}
