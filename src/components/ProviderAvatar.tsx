import Image from 'next/image';
import { CategoryIcon } from '@/components/CategoryIcon';
import { categoryToneClass, getInitials, providerDisplayName } from '@/lib/design';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  displayName?: string | null;
  logoUrl?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE = {
  sm: { box: 'h-12 w-12', text: 'text-sm', icon: 'h-5 w-5', px: 48 },
  md: { box: 'h-16 w-16', text: 'text-lg', icon: 'h-7 w-7', px: 64 },
  lg: { box: 'h-24 w-24 sm:h-28 sm:w-28', text: 'text-2xl', icon: 'h-10 w-10', px: 112 },
} as const;

export function ProviderAvatar({
  name,
  displayName,
  logoUrl,
  categoryName,
  categoryIcon,
  size = 'md',
  className,
}: Props) {
  const label = providerDisplayName({ name, displayName });
  const s = SIZE[size];
  const tone = categoryToneClass(categoryName);

  if (logoUrl) {
    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-card border border-brand-border bg-brand-card shadow-card',
          s.box,
          className
        )}
      >
        <Image
          src={logoUrl}
          alt={`Logo de ${label}`}
          width={s.px}
          height={s.px}
          className="h-full w-full object-cover"
          unoptimized={logoUrl.startsWith('data:')}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-card border border-brand-border shadow-card',
        s.box,
        tone,
        className
      )}
      aria-hidden={false}
      role="img"
      aria-label={`Avatar de ${label}`}
    >
      <span className={cn('font-bold leading-none', s.text)}>{getInitials(label)}</span>
      {categoryIcon ? (
        <CategoryIcon name={categoryIcon} className={cn('opacity-80', s.icon)} aria-hidden />
      ) : null}
    </div>
  );
}
