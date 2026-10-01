'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  target?: string;
  position: string;
  isActive: boolean;
  order: number;
}

interface BannerDisplayProps {
  banners: BannerItem[];
  position: 'HERO_TOP' | 'MIDDLE' | 'SIDEBAR' | 'FOOTER';
  className?: string;
}

/** Alturas / proporções por posição — sempre ocupando 100% da largura do container. */
function frameClasses(position: BannerDisplayProps['position']): string {
  switch (position) {
    case 'HERO_TOP':
      return 'min-h-[140px] sm:min-h-[180px] md:min-h-[220px] aspect-[21/6] sm:aspect-[21/5]';
    case 'MIDDLE':
      return 'min-h-[120px] sm:min-h-[160px] md:min-h-[200px] aspect-[21/6] sm:aspect-[21/5]';
    case 'FOOTER':
      return 'min-h-[110px] sm:min-h-[140px] md:min-h-[180px] aspect-[21/6] sm:aspect-[24/5]';
    case 'SIDEBAR':
      return 'min-h-[220px] aspect-[4/5] sm:aspect-[3/4]';
    default:
      return 'min-h-[140px] aspect-[21/5]';
  }
}

export function BannerDisplay({ banners, position, className = '' }: BannerDisplayProps) {
  const filteredBanners = banners
    .filter((b) => b.isActive && b.position === position)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (filteredBanners.length === 0) {
    return null;
  }

  const handleBannerClick = (bannerId: string) => {
    try {
      fetch(`/api/banners/${bannerId}/click`, { method: 'POST' }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const isSidebar = position === 'SIDEBAR';

  return (
    <div className={`w-full ${className}`} data-banner-position={position}>
      <div className={`flex flex-col gap-4 ${isSidebar ? '' : 'w-full'}`}>
        {filteredBanners.map((banner) => {
          const frame = (
            <div
              className={`relative group w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-slate-900 shadow-sm hover:shadow-lg transition-shadow duration-300 ${frameClasses(position)}`}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                loading="lazy"
              />

              {/* Vinheta leve só na base — não cobre o anúncio inteiro */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3 z-10">
                <span className="inline-block bg-black/55 text-white/90 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md backdrop-blur-sm">
                  Publicidade
                </span>
              </div>

              {(banner.title || banner.linkUrl) && (
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-3">
                  {banner.title ? (
                    <p className="text-white text-sm sm:text-base font-semibold line-clamp-1 drop-shadow-md">
                      {banner.title}
                    </p>
                  ) : (
                    <span />
                  )}
                  {banner.linkUrl && (
                    <span className="shrink-0 inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-lg shadow-md group-hover:bg-amber-300 transition-colors">
                      Saiba mais
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )}
            </div>
          );

          if (banner.linkUrl) {
            return (
              <a
                key={banner.id}
                href={banner.linkUrl}
                target={banner.target || '_blank'}
                rel="noopener noreferrer"
                onClick={() => handleBannerClick(banner.id)}
                className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-2xl sm:rounded-3xl"
                aria-label={banner.title || 'Banner publicitário'}
              >
                {frame}
              </a>
            );
          }

          return (
            <div key={banner.id} className="w-full">
              {frame}
            </div>
          );
        })}
      </div>
    </div>
  );
}
