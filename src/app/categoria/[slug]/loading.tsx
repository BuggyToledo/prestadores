import { ProviderCardSkeleton } from '@/components/Skeletons';

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8 sm:px-6" role="status" aria-label="Carregando resultados">
      <div className="mb-6 flex gap-4">
        <div className="h-16 w-16 animate-pulse rounded-card bg-slate-200/80" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200/80" />
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200/80" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-slate-200/80" />
        </div>
      </div>
      <div className="mb-6 h-14 animate-pulse rounded-control bg-slate-200/80" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProviderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
