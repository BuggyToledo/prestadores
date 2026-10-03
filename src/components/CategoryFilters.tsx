'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useId, useState, useTransition } from 'react';
import { Search, MapPin, ArrowUpDown, X, SlidersHorizontal } from 'lucide-react';
import { HOME_REGIONS, type HomeRegionId } from '@/lib/regions';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'nome', label: 'Nome A–Z' },
  { value: 'recentes', label: 'Mais recentes' },
] as const;

type Props = {
  categorySlug: string;
  /** Só regiões com prestadores nesta categoria (ids de HOME_REGIONS). */
  availableRegionIds?: readonly HomeRegionId[] | readonly string[];
  /** false quando cobertura de localização &lt; limiar (esconde seletor). */
  showRegionFilter?: boolean;
  className?: string;
};

/**
 * Desktop: busca + região + ordenação na mesma linha.
 * Mobile: barra compacta (busca + "Filtros") + bottom sheet — libera ~69% da viewport
 * em 360×640 (header 64 + sticky ~72 + BottomNav ~64).
 */
export function CategoryFilters({
  categorySlug,
  availableRegionIds,
  showRegionFilter = true,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const titleId = useId();

  const q0 = searchParams.get('q') || '';
  const regiao0 = searchParams.get('regiao') || '';
  const sort0 = searchParams.get('ordenacao') || 'nome';

  const [q, setQ] = useState(q0);
  const [regiao, setRegiao] = useState(regiao0);
  const [sort, setSort] = useState(sort0);

  useEffect(() => {
    setQ(q0);
    setRegiao(regiao0);
    setSort(sort0);
  }, [q0, regiao0, sort0]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const regionOptions = showRegionFilter
    ? HOME_REGIONS.filter((r) => (availableRegionIds ? availableRegionIds.includes(r.id) : true))
    : [];

  const pushParams = (next: {
    q?: string;
    regiao?: string;
    ordenacao?: string;
    clearKey?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('mais');

    const apply = (key: string, value?: string) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    };

    if (next.clearKey) {
      params.delete(next.clearKey);
      if (next.clearKey === 'q') setQ('');
      if (next.clearKey === 'regiao') setRegiao('');
      if (next.clearKey === 'ordenacao') {
        params.delete('ordenacao');
        setSort('nome');
      }
    } else {
      if ('q' in next) apply('q', next.q?.trim());
      if ('regiao' in next) apply('regiao', next.regiao);
      if ('ordenacao' in next) {
        if (!next.ordenacao || next.ordenacao === 'nome') params.delete('ordenacao');
        else params.set('ordenacao', next.ordenacao);
      }
    }

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const onSubmitSearch = (e: FormEvent) => {
    e.preventDefault();
    pushParams({ q, regiao, ordenacao: sort });
  };

  const applySheet = () => {
    pushParams({ q, regiao, ordenacao: sort });
    setSheetOpen(false);
  };

  const chips: Array<{ key: string; label: string; removeLabel: string }> = [];
  if (q0) {
    chips.push({ key: 'q', label: `Busca: ${q0}`, removeLabel: `Remover filtro ${q0}` });
  }
  if (regiao0 && showRegionFilter) {
    const regionLabel = HOME_REGIONS.find((r) => r.id === regiao0)?.label || regiao0;
    chips.push({
      key: 'regiao',
      label: `Região: ${regionLabel}`,
      removeLabel: `Remover filtro ${regionLabel}`,
    });
  }
  if (sort0 === 'recentes') {
    chips.push({
      key: 'ordenacao',
      label: 'Mais recentes',
      removeLabel: 'Remover filtro Mais recentes',
    });
  }

  const sheetFiltersActive = Boolean(regiao0 || sort0 === 'recentes');

  return (
    <div
      className={cn(
        'sticky top-16 z-30 -mx-4 border-b border-brand-border bg-brand-card/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 sm:py-3',
        isPending && 'opacity-80',
        className
      )}
    >
      {/* Mobile compacto: busca + Filtros */}
      <form
        onSubmit={onSubmitSearch}
        className="mx-auto flex max-w-shell items-center gap-2 md:hidden"
        role="search"
        aria-label={`Buscar em ${categorySlug}`}
      >
        <div className="relative min-w-0 flex-1">
          <label htmlFor="cat-q-mobile" className="sr-only">
            Buscar nesta categoria
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-ink"
            aria-hidden
          />
          <input
            id="cat-q-mobile"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="min-h-touch w-full rounded-control border border-brand-border bg-brand-surface py-2 pl-10 pr-3 text-sm font-medium text-brand-navy placeholder:text-brand-muted focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
        <button
          type="submit"
          className="sr-only"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            'inline-flex min-h-touch shrink-0 items-center gap-1.5 rounded-control border border-brand-border bg-brand-surface px-3 text-sm font-bold text-brand-navy hover:bg-brand-amber-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber',
            sheetFiltersActive && 'border-brand-amber bg-brand-amber-light'
          )}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filtros
          {sheetFiltersActive ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1 text-[10px] font-extrabold text-brand-navy">
              {[regiao0, sort0 === 'recentes'].filter(Boolean).length}
            </span>
          ) : null}
        </button>
      </form>

      {/* Desktop: linha completa */}
      <form
        onSubmit={onSubmitSearch}
        className="mx-auto hidden max-w-shell grid-cols-12 items-end gap-2 md:grid"
        role="search"
        aria-label={`Filtrar ${categorySlug}`}
      >
        <div className={showRegionFilter ? 'relative col-span-5' : 'relative col-span-7'}>
          <label htmlFor="cat-q" className="sr-only">
            Buscar nesta categoria
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-ink"
            aria-hidden
          />
          <input
            id="cat-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou serviço…"
            className="min-h-touch w-full rounded-control border border-brand-border bg-brand-surface py-2.5 pl-10 pr-3 text-sm font-medium text-brand-navy placeholder:text-brand-muted focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>

        {showRegionFilter ? (
          <div className="relative col-span-3">
            <label htmlFor="cat-regiao" className="sr-only">
              Bairro/Região
            </label>
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-ink"
              aria-hidden
            />
            <select
              id="cat-regiao"
              value={regionOptions.some((r) => r.id === regiao) ? regiao : ''}
              onChange={(e) => {
                setRegiao(e.target.value);
                pushParams({ q, regiao: e.target.value, ordenacao: sort });
              }}
              className="min-h-touch w-full appearance-none rounded-control border border-brand-border bg-brand-surface py-2.5 pl-10 pr-8 text-sm font-medium text-brand-navy focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
            >
              <option value="">Bairro/Região</option>
              {regionOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="relative col-span-2">
          <label htmlFor="cat-sort" className="sr-only">
            Ordenar
          </label>
          <ArrowUpDown
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-ink"
            aria-hidden
          />
          <select
            id="cat-sort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              pushParams({ q, regiao, ordenacao: e.target.value });
            }}
            className="min-h-touch w-full appearance-none rounded-control border border-brand-border bg-brand-surface py-2.5 pl-10 pr-8 text-sm font-medium text-brand-navy focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <button
            type="submit"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy hover:bg-brand-amber-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
          >
            Filtrar
          </button>
        </div>
      </form>

      {chips.length > 0 ? (
        <div
          className="mx-auto mt-2 flex max-w-shell flex-wrap items-center gap-2"
          aria-label="Filtros ativos"
        >
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => pushParams({ clearKey: chip.key })}
              aria-label={chip.removeLabel}
              className="inline-flex min-h-touch items-center gap-1.5 rounded-full bg-brand-amber-light px-3 py-1.5 text-xs font-bold text-brand-navy hover:bg-brand-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setQ('');
              setRegiao('');
              setSort('nome');
              startTransition(() => router.push(pathname));
            }}
            className="min-h-touch text-xs font-bold text-brand-muted underline-offset-2 hover:text-brand-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
          >
            Limpar tudo
          </button>
        </div>
      ) : null}

      {/* Bottom sheet mobile */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-brand-navy/50"
            aria-label="Fechar filtros"
            onClick={() => setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-brand-border bg-brand-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-lift"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 id={titleId} className="text-lg font-extrabold text-brand-navy">
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full text-brand-muted hover:bg-brand-amber-light hover:text-brand-navy"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-4">
              {showRegionFilter ? (
                <div>
                  <label htmlFor="sheet-regiao" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-muted">
                    Bairro/Região
                  </label>
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-ink"
                      aria-hidden
                    />
                    <select
                      id="sheet-regiao"
                      value={regionOptions.some((r) => r.id === regiao) ? regiao : ''}
                      onChange={(e) => setRegiao(e.target.value)}
                      className="min-h-touch w-full appearance-none rounded-control border border-brand-border bg-brand-surface py-2.5 pl-10 pr-8 text-sm font-medium text-brand-navy focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
                    >
                      <option value="">Todas as regiões</option>
                      {regionOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              <div>
                <label htmlFor="sheet-sort" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-muted">
                  Ordenação
                </label>
                <div className="relative">
                  <ArrowUpDown
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-ink"
                    aria-hidden
                  />
                  <select
                    id="sheet-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="min-h-touch w-full appearance-none rounded-control border border-brand-border bg-brand-surface py-2.5 pl-10 pr-8 text-sm font-medium text-brand-navy focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={applySheet}
                className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy hover:bg-brand-amber-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
