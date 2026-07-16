export default function Skeleton({ className = '' }) {
  return <div className={`animate-skeleton rounded-lg bg-ink/[0.06] ${className}`} />;
}

export function SkeletonRows({ rows = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
