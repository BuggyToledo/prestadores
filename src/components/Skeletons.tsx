import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-control bg-slate-200/80', className)}
      aria-hidden
    />
  );
}

export function ProviderCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-card border border-brand-border bg-brand-card p-5 shadow-card',
        className
      )}
      role="status"
      aria-label="Carregando prestador"
    >
      <div className="flex gap-4">
        <Bone className="h-16 w-16 shrink-0 rounded-card" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-24" />
          <Bone className="h-5 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
      </div>
      <Bone className="h-12 w-full" />
    </div>
  );
}

export function ProviderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-shell space-y-6 px-4 py-8" role="status" aria-label="Carregando perfil">
      <Bone className="aspect-[2.5/1] w-full rounded-card md:aspect-[4/1]" />
      <div className="flex gap-4">
        <Bone className="h-28 w-28 rounded-card" />
        <div className="flex-1 space-y-3 pt-4">
          <Bone className="h-6 w-48" />
          <Bone className="h-8 w-2/3" />
          <Bone className="h-4 w-40" />
        </div>
      </div>
      <Bone className="h-32 w-full rounded-card" />
      <Bone className="h-24 w-full rounded-card" />
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Carregando categorias">
      {Array.from({ length: 8 }).map((_, i) => (
        <Bone key={i} className="aspect-square w-full rounded-card" />
      ))}
    </div>
  );
}
