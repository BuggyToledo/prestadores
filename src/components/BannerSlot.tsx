import Image from 'next/image';
import { isSafeHttpUrl } from '@/lib/design';
import { cn } from '@/lib/utils';

export type BannerSlotItem = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  target?: string | null;
  position: string;
  isActive: boolean;
  order: number;
};

type Props = {
  banners: BannerSlotItem[];
  position: 'HERO_TOP' | 'MIDDLE' | 'SIDEBAR' | 'FOOTER';
  className?: string;
};

/**
 * Rótulo "Publicidade". Aspecto ~4:1 desktop / ~2.5:1 mobile.
 * Sem banner ativo → null (sem placeholder).
 */
export function BannerSlot({ banners, position, className }: Props) {
  const active = banners
    .filter((b) => b.isActive && b.position === position && b.imageUrl)
    .sort((a, b) => a.order - b.order);

  if (active.length === 0) return null;

  return (
    <section className={cn('w-full', className)} aria-label="Publicidade">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-brand-navy/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-amber">
          Publicidade
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-1">
        {active.map((banner) => {
          const safeLink = isSafeHttpUrl(banner.linkUrl) ? banner.linkUrl : null;
          const inner = (
            <div className="relative w-full overflow-hidden rounded-card border border-brand-border bg-brand-navy-mid shadow-card aspect-[2.5/1] md:aspect-[4/1]">
              <Image
                src={banner.imageUrl}
                alt={banner.title || 'Banner publicitário'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
                unoptimized={banner.imageUrl.startsWith('data:')}
              />
            </div>
          );

          return (
            <li key={banner.id}>
              {safeLink ? (
                <a
                  href={safeLink}
                  target={banner.target === '_self' ? '_self' : '_blank'}
                  rel="noopener noreferrer sponsored"
                  className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
                  aria-label={`Publicidade: ${banner.title}`}
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
