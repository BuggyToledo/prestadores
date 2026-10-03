import Image from 'next/image';
import { isSafeHttpUrl } from '@/lib/design';
import { cn } from '@/lib/utils';
import type { BannerSlotItem } from '@/components/BannerSlot';

type Props = {
  banner: BannerSlotItem;
  className?: string;
};

/**
 * Card nativo de publicidade (1× na listagem).
 * Sem banner ativo + imageUrl → null (sem placeholder/texto).
 */
export function SponsoredInlineCard({ banner, className }: Props) {
  if (!banner?.isActive || !banner.imageUrl) return null;
  if (banner.position && banner.position !== 'MIDDLE') return null;
  const safeLink = isSafeHttpUrl(banner.linkUrl) ? banner.linkUrl : null;

  const inner = (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border border-brand-border bg-brand-navy-mid shadow-card',
        className
      )}
    >
      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full bg-brand-navy/85 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-amber">
          Publicidade
        </span>
      </div>
      <div className="relative aspect-[2.5/1] w-full md:aspect-[4/1]">
        <Image
          src={banner.imageUrl}
          alt={banner.title || 'Publicidade'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          unoptimized={banner.imageUrl.startsWith('data:')}
        />
      </div>
      {banner.title ? (
        <p className="truncate px-3 py-2 text-xs font-semibold text-white/90">{banner.title}</p>
      ) : null}
    </div>
  );

  if (safeLink) {
    return (
      <a
        href={safeLink}
        target={banner.target === '_self' ? '_self' : '_blank'}
        rel="noopener noreferrer sponsored"
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
        aria-label={`Publicidade: ${banner.title}`}
      >
        {inner}
      </a>
    );
  }

  return <div aria-label="Publicidade">{inner}</div>;
}
