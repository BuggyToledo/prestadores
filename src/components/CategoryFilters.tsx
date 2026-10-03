'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useTransition } from 'react';
import { Search, MapPin, ArrowUpDown, X } from 'lucide-react';
import { HOME_REGIONS } from '@/lib/regions';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'nome', label: 'Nome A–Z' },
  { value: 'recentes', label: 'Mais recentes' },
] as const;

type Props = {
  categorySlug: string;
  className?: string;
};

export function CategoryFilters({ categorySlug, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q0 = searchParams.get('q') || '';
  const regiao0 = searchParams.get('regiao') || '';
  const sort0 = searchParams.get('ordenacao') || 'nome';

  const [q, setQ] = useState(q0);
  const [regiao, setRegiao] = useState(regiao0);
  const [sort, setSort] = useState(sort0);

  const pushParams = (next: { q?: string; regiao?: string; ordenacao?: string; clearKey?: string }) => {
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    pushParams({ q, regiao, ordenacao: sort });
  };

  const chips: Array<{ key: string; label: string }> = [];
  if (q0) chips.push({ key: 'q', label: `Busca: ${q0}` });
  if (regiao0) {
    const regionLabel = HOME_REGIONS.find((r) => r.id === regiao0)?.label || regiao0;
    chips.push({ key: 'regiao', label: `Região: ${regionLabel}` });
  }
  if (sort0 === 'recentes') chips.push({ key: 'ordenacao', label: 'Mais recentes' });

  return (
    <div
      className={cn(
        'sticky top-16 z-30 -mx-4 border-b border-brand-border bg-brand-card/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6',
        isPending && 'opacity-80',
        className
      )}
    >
      <form
        onSubmit={onSubmit}
        className="mx-auto grid max-w-shell grid-cols-1 gap-2 md:grid-cols-12 md:items-end"
        role="search"
        aria-label={`Filtrar ${categorySlug}`}
      >
        <div className="relative md:col-span-5">
          <label htmlFor="cat-q" className="sr-only">
            Buscar nesta categoria
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-dark" aria-hidden />
          <input
            id="cat-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou serviço…"
            className="min-h-touch w-full rounded-control border border-brand-border bg-brand-surface py-2.5 pl-10 pr-3 text-sm font-medium text-brand-navy placeholder:text-brand-muted focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>

        <div className="relative md:col-span-3">
          <label htmlFor="cat-regiao" className="sr-only">
            Bairro/Região
          </label>
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-dark" aria-hidden />
          <select
            id="cat-regiao"
            value={regiao}
            onChange={(e) => {
              setRegiao(e.target.value);
              pushParams({ q, regiao: e.target.value, ordenacao: sort });
            }}
            className="min-h-touch w-full appearance-none rounded-control border border-brand-border bg-brand-surface py-2.5 pl-10 pr-8 text-sm font-medium text-brand-navy focus:border-brand-amber focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            <option value="">Bairro/Região</option>
            {HOME_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative md:col-span-2">
          <label htmlFor="cat-sort" className="sr-only">
            Ordenar
          </label>
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-amber-dark" aria-hidden />
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

        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy hover:bg-brand-amber-dark"
          >
            Filtrar
          </button>
        </div>
      </form>

      {chips.length > 0 ? (
        <div className="mx-auto mt-3 flex max-w-shell flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => pushParams({ clearKey: chip.key })}
              className="inline-flex min-h-touch items-center gap-1.5 rounded-full bg-brand-amber-light px-3 py-1.5 text-xs font-bold text-brand-navy hover:bg-brand-amber"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Remover filtro</span>
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
            className="text-xs font-bold text-brand-muted underline-offset-2 hover:text-brand-navy hover:underline"
          >
            Limpar tudo
          </button>
        </div>
      ) : null}
    </div>
  );
}
