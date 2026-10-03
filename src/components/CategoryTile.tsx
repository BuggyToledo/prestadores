import Link from 'next/link';
import { CategoryIcon } from '@/components/CategoryIcon';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  slug: string;
  icon?: string | null;
  count: number;
  selected?: boolean;
  href?: string;
};

export function CategoryTile({ name, slug, icon, count, selected, href }: Props) {
  return (
    <Link
      href={href ?? `/categoria/${slug}`}
      className={cn(
        'group flex min-h-touch flex-col justify-between rounded-card border p-4 shadow-card transition-all hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
        selected
          ? 'border-brand-amber bg-brand-amber text-brand-navy ring-2 ring-brand-amber/40'
          : 'border-brand-border bg-brand-card hover:border-brand-amber/50'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-control transition-transform group-hover:scale-105',
            selected ? 'bg-brand-navy text-brand-amber' : 'bg-brand-amber-light text-brand-amber-dark'
          )}
        >
          <CategoryIcon name={icon} className="h-6 w-6" aria-hidden />
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            selected ? 'bg-brand-navy/15 text-brand-navy' : 'bg-slate-100 text-brand-muted'
          )}
        >
          {count}
        </span>
      </div>
      <h3
        className={cn(
          'text-sm font-bold leading-snug',
          selected ? 'text-brand-navy' : 'text-brand-navy group-hover:text-brand-amber-dark'
        )}
      >
        {name}
      </h3>
    </Link>
  );
}
