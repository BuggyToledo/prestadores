'use client';

import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

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

export function BannerDisplay({ banners, position, className = '' }: BannerDisplayProps) {
  const filteredBanners = banners.filter(
    (b) => b.isActive && b.position === position
  );

  if (filteredBanners.length === 0) {
    return null;
  }

  const handleBannerClick = (bannerId: string) => {
    try {
      fetch(`/api/banners/${bannerId}/click`, { method: 'POST' }).catch(() => {});
    } catch {}
  };

  const isSingle = filteredBanners.length === 1;

  return (
    <div className={`w-full ${className}`}>
      <div
        className={
          isSingle
            ? 'w-full'
            : filteredBanners.length === 2
            ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
        }
      >
        {filteredBanners.map((banner) => {
          const content = (
            <div className="relative group overflow-hidden rounded-3xl border border-amber-200/90 shadow-md hover:shadow-2xl transition-all duration-300 bg-slate-900">
              {/* Container da Imagem com dimensões generosas e full-width */}
              <div
                className={`relative w-full overflow-hidden flex items-center justify-center ${
                  isSingle
                    ? 'h-52 sm:h-72 md:h-80 lg:h-96'
                    : 'h-48 sm:h-60 md:h-64'
                }`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                {/* Tag Publicidade */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Publicidade</span>
                </div>

                {/* Título e Ação */}
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4 pointer-events-none">
                  <p className="text-white text-sm sm:text-base md:text-lg font-bold line-clamp-1 drop-shadow-md">
                    {banner.title}
                  </p>
                  {banner.linkUrl && (
                    <span className="shrink-0 bg-amber-500 group-hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 pointer-events-auto">
                      <span>Saiba mais</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );

          if (banner.linkUrl) {
            const safeHref =
              banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://')
                ? banner.linkUrl
                : null;
            if (!safeHref) {
              return (
                <div key={banner.id} className="w-full">
                  {content}
                </div>
              );
            }
            return (
              <a
                key={banner.id}
                href={safeHref}
                target={banner.target || '_blank'}
                rel="noopener noreferrer"
                onClick={() => handleBannerClick(banner.id)}
                className="block focus:outline-none w-full"
              >
                {content}
              </a>
            );
          }

          return (
            <div key={banner.id} className="w-full">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
