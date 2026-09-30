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

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBanners.map((banner) => {
          const content = (
            <div className="relative group overflow-hidden rounded-3xl border border-amber-200/80 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
              {/* Imagem do Banner */}
              <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] max-h-52 overflow-hidden bg-slate-900">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                {/* Tag Publicidade */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Publicidade</span>
                </div>

                {/* Título e Ação */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 pointer-events-none">
                  <p className="text-white text-xs sm:text-sm font-bold line-clamp-1 drop-shadow-md">
                    {banner.title}
                  </p>
                  {banner.linkUrl && (
                    <span className="shrink-0 bg-amber-500 group-hover:bg-amber-400 text-slate-950 text-[11px] font-bold px-3 py-1 rounded-xl shadow-md transition-colors flex items-center gap-1 pointer-events-auto">
                      <span>Saiba mais</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
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
                className="block focus:outline-none"
              >
                {content}
              </a>
            );
          }

          return <div key={banner.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
