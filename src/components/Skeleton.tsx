export function Skeleton({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div className={`skeleton-breathe relative overflow-hidden bg-ink-700/60 ${className ?? ''}`} style={{ animationDelay: `${delay}s` }}>
      <div className="skeleton-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-paper-100/[0.09]" style={{ animationDelay: `${delay}s` }} />
    </div>
  );
}

export function SkeletonCircle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`skeleton-breathe relative overflow-hidden bg-ink-700/60 rounded-full ${className ?? ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="skeleton-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-paper-100/[0.09]" style={{ animationDelay: `${delay}s` }} />
    </div>
  );
}

function waveDelay(index: number) {
  return (index % 6) * 0.12;
}

export function RowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex items-center gap-3 bg-ink-800 border border-ink-700 border-l-2 border-l-ink-700 px-4 py-3">
      <SkeletonCircle className="w-11 h-11 shrink-0" delay={delay} />
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-1/2" delay={delay} />
        <Skeleton className="h-2.5 w-1/3" delay={delay} />
      </div>
      <Skeleton className="h-3 w-14 shrink-0" delay={delay} />
    </div>
  );
}

export function RowSkeletonGrid({ count, className }: { count: number; className?: string }) {
  return (
    <div className={className ?? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
      {Array.from({ length: count }, (_, i) => (
        <RowSkeleton key={i} delay={waveDelay(i)} />
      ))}
    </div>
  );
}

export function CardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-ink-800 border border-ink-700 border-t-2 border-t-ink-700 overflow-hidden">
      <Skeleton className="aspect-[21/9] w-full" delay={delay} />
      <div className="px-5 pb-5">
        <SkeletonCircle className="w-16 h-16 -mt-8 mb-3 border-4 border-ink-900" delay={delay} />
        <Skeleton className="h-5 w-2/3 mb-2.5" delay={delay} />
        <Skeleton className="h-2.5 w-1/3 mb-4" delay={delay} />
        <div className="flex items-center justify-between pt-3 border-t border-ink-700">
          <Skeleton className="h-2.5 w-12" delay={delay} />
          <Skeleton className="h-2.5 w-16" delay={delay} />
        </div>
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count, className }: { count: number; className?: string }) {
  return (
    <div className={className ?? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} delay={waveDelay(i)} />
      ))}
    </div>
  );
}

export function StatBlockSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-ink-700 px-3 py-3 sm:px-5 sm:py-4">
      <Skeleton className="h-2.5 w-16 mb-2.5" delay={delay} />
      <Skeleton className="h-5 w-10" delay={delay} />
    </div>
  );
}

export function DetailHeroSkeleton() {
  return (
    <section className="bg-ink-900 border-b border-ink-700">
      <Skeleton className="aspect-[21/6] sm:aspect-[21/5] w-full" />
      <div className="max-w-6xl mx-auto px-6 pb-10">
        <SkeletonCircle className="relative w-28 h-28 sm:w-32 sm:h-32 -mt-14 sm:-mt-16 border-4 border-ink-900" />
        <div className="flex items-end justify-between gap-4 flex-wrap mt-5">
          <div>
            <Skeleton className="h-8 w-56 mb-3" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function CompactHeroSkeleton() {
  return (
    <section className="bg-ink-900 border-b border-ink-700">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <SkeletonCircle className="w-14 h-14 shrink-0" />
          <div>
            <Skeleton className="h-2.5 w-20 mb-2.5" />
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-ink-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-700">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="divide-y divide-ink-800">
        {Array.from({ length: rows }, (_, i) => {
          const delay = waveDelay(i);
          return (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5">
              <Skeleton className="h-3 w-4" delay={delay} />
              <SkeletonCircle className="w-6 h-6 shrink-0" delay={delay} />
              <Skeleton className="h-3 flex-1" delay={delay} />
              <Skeleton className="h-3 w-6" delay={delay} />
              <Skeleton className="h-3 w-6" delay={delay} />
              <Skeleton className="h-3 w-6" delay={delay} />
              <Skeleton className="h-3 w-6" delay={delay} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TableSkeletonGrid({ count, className }: { count: number; className?: string }) {
  return (
    <div className={className ?? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'}>
      {Array.from({ length: count }, (_, i) => (
        <TableSkeleton key={i} />
      ))}
    </div>
  );
}

export function BracketSkeleton() {
  const columns = [8, 4, 2, 1];
  return (
    <div className="flex gap-10 overflow-x-auto pb-4">
      {columns.map((count, colIndex) => (
        <div key={colIndex} className="flex flex-col justify-around gap-4 shrink-0" style={{ width: 176 }}>
          {Array.from({ length: count }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" delay={waveDelay(colIndex + i)} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TextCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-ink-800 border border-ink-700 border-t-2 border-t-ink-700 px-5 py-4">
      <Skeleton className="h-4 w-1/2 mb-3" delay={delay} />
      <Skeleton className="h-3 w-full mb-2" delay={delay} />
      <Skeleton className="h-3 w-2/3" delay={delay} />
    </div>
  );
}

export function TextCardSkeletonList({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <TextCardSkeleton key={i} delay={waveDelay(i)} />
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 px-6">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <Skeleton className="h-2.5 w-24 mb-2.5" delay={waveDelay(i)} />
          <Skeleton className="h-11 w-full" delay={waveDelay(i)} />
        </div>
      ))}
    </div>
  );
}

export function PlayerHeroSkeleton() {
  return (
    <section className="bg-ink-900 border-b border-ink-700">
      <div className="max-w-4xl mx-auto px-6 pt-8 sm:pt-10 pb-10 flex flex-col items-center text-center">
        <SkeletonCircle className="w-28 h-28 sm:w-32 sm:h-32" />
        <Skeleton className="h-8 w-56 mt-5 mb-3" />
        <Skeleton className="h-2.5 w-32" />
      </div>
    </section>
  );
}
