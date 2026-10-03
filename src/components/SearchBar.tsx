'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, LayoutGrid, ArrowRight } from 'lucide-react';
import { HOME_REGIONS, type HomeRegionId } from '@/lib/regions';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
  initialSearch?: string;
  initialCategory?: string;
  initialRegion?: string;
  showRegionFilter?: boolean;
  availableRegionIds?: readonly HomeRegionId[] | readonly string[];
  id?: string;
  className?: string;
}

export function SearchBar({
  categories = [],
  initialSearch = '',
  initialCategory = '',
  initialRegion = '',
  showRegionFilter = true,
  availableRegionIds,
  id = 'busca',
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [region, setRegion] = useState(initialRegion);

  const regionOptions = showRegionFilter
    ? HOME_REGIONS.filter((r) => (availableRegionIds ? availableRegionIds.includes(r.id) : true))
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('categoria', category);
    if (showRegionFilter && region) params.set('regiao', region);
    const qs = params.toString();
    router.push(qs ? `/?${qs}#prestadores` : '/#prestadores');
  };

  return (
    <form
      id={id}
      onSubmit={handleSearch}
      className={cn(
        'rounded-card border border-brand-border bg-brand-card p-3 shadow-lift sm:p-4',
        className
      )}
      role="search"
      aria-label="Buscar prestadores"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className={cn('relative', showRegionFilter ? 'md:col-span-5' : 'md:col-span-6')}>
          <label htmlFor="search-q" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Serviço ou empresa
          </label>
          <div className="pointer-events-none absolute bottom-3 left-3.5 text-brand-amber-ink">
            <Search className="h-4 w-4" aria-hidden />
          </div>
          <input
            id="search-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: eletricista, dedetização…"
            className="min-h-touch w-full rounded-control border border-brand-border bg-brand-surface py-3 pl-10 pr-3 text-sm font-medium text-brand-navy placeholder:text-brand-muted focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>

        <div className={cn('relative', showRegionFilter ? 'md:col-span-3' : 'md:col-span-4')}>
          <label htmlFor="search-cat" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Categoria
          </label>
          <div className="pointer-events-none absolute bottom-3 left-3.5 text-brand-amber-ink">
            <LayoutGrid className="h-4 w-4" aria-hidden />
          </div>
          <select
            id="search-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-touch w-full appearance-none rounded-control border border-brand-border bg-brand-surface py-3 pl-10 pr-8 text-sm font-medium text-brand-navy focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {showRegionFilter ? (
          <div className="relative md:col-span-2">
            <label htmlFor="search-region" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-brand-muted">
              Região
            </label>
            <div className="pointer-events-none absolute bottom-3 left-3.5 text-brand-amber-ink">
              <MapPin className="h-4 w-4" aria-hidden />
            </div>
            <select
              id="search-region"
              value={regionOptions.some((r) => r.id === region) ? region : ''}
              onChange={(e) => setRegion(e.target.value)}
              className="min-h-touch w-full appearance-none rounded-control border border-brand-border bg-brand-surface py-3 pl-10 pr-8 text-sm font-medium text-brand-navy focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
            >
              <option value="">Todas</option>
              {regionOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy shadow-card transition-colors hover:bg-brand-amber-dark hover:text-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
          >
            Buscar
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}
