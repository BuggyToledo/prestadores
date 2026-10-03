import { ShieldCheck } from 'lucide-react';
import { trustBadgeLabel, type TrustTier } from '@/lib/design';
import { cn } from '@/lib/utils';

type Props = {
  trustTier?: TrustTier;
  className?: string;
};

/** Só renderiza para documentado / oficial. */
export function TrustBadge({ trustTier, className }: Props) {
  const label = trustBadgeLabel(trustTier);
  if (!label) return null;

  const isOfficial = trustTier === 'oficial';

  return (
    <span
      className={cn(
        'inline-flex min-h-touch items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
        isOfficial
          ? 'bg-brand-amber-light text-brand-navy'
          : 'bg-sky-100 text-sky-900',
        className
      )}
    >
      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
