import React, { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { SearchBar } from '@/components/SearchBar';
import { ProviderCard } from '@/components/ProviderCard';
import { CategoryTile } from '@/components/CategoryTile';
import { BannerSlot } from '@/components/BannerSlot';
import { findHomeRegion } from '@/lib/regions';
import {
  MessageCircle,
  Search,
  Landmark,
  ArrowRight,
  Users,
  LayoutGrid,
} from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    regiao?: string;
    cidade?: string;
    focus?: string;
    page?: string;
  }>;
}

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 6;

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q || '';
  const categoria = params.categoria || '';
  const regiao = params.regiao || '';
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const region = findHomeRegion(regiao);
  const isFiltering = Boolean(q || categoria || regiao);

  const [categories, banners, totalProvidersCount, categoryCount] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      take: 12,
      include: {
        _count: {
          select: {
            providers: { where: { isActive: true } },
          },
        },
      },
    }),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.provider.count({ where: { isActive: true } }),
    prisma.category.count(),
  ]);

  // Só prestadores na listagem principal (utilidade → /utilidade-publica)
  const kindFilter = {
    isActive: true,
    OR: [{ kind: 'prestador' as const }, { kind: null }],
  };

  const andParts: Record<string, unknown>[] = [];

  if (categoria) {
    andParts.push({ category: { slug: categoria } });
  }

  if (region) {
    const neighborhoodOr = region.neighborhoods.map((n) => ({
      neighborhood: { contains: n },
    }));
    const cityOr =
      'cities' in region && region.cities
        ? region.cities.map((c) => ({ city: { contains: c } }))
        : [];
    andParts.push({ OR: [...neighborhoodOr, ...cityOr] });
  }

  if (q.trim()) {
    const term = q.trim();
    andParts.push({
      OR: [
        { name: { contains: term } },
        { description: { contains: term } },
        { services: { contains: term } },
        { neighborhood: { contains: term } },
        { city: { contains: term } },
        { category: { name: { contains: term } } },
      ],
    });
  }

  const where =
    andParts.length > 0
      ? { AND: [kindFilter, ...andParts] }
      : kindFilter;

  let featuredProviders: Awaited<ReturnType<typeof prisma.provider.findMany>> = [];
  let listProviders: Awaited<ReturnType<typeof prisma.provider.findMany>> = [];
  let listTotal = 0;

  try {
    const skip = isFiltering ? (page - 1) * PAGE_SIZE : 0;
    const take = PAGE_SIZE;

    if (!isFiltering) {
      // Home: até 6 em destaque (featured primeiro), só kind prestador
      featuredProviders = await prisma.provider.findMany({
        where: { ...kindFilter, isFeatured: true } as never,
        include: { category: true, subcategory: true },
        orderBy: [{ name: 'asc' }],
        take: PAGE_SIZE,
      });
      if (featuredProviders.length < PAGE_SIZE) {
        const extra = await prisma.provider.findMany({
          where: {
            ...kindFilter,
            isFeatured: false,
            id: { notIn: featuredProviders.map((p) => p.id) },
          } as never,
          include: { category: true, subcategory: true },
          orderBy: [{ name: 'asc' }],
          take: PAGE_SIZE - featuredProviders.length,
        });
        featuredProviders = [...featuredProviders, ...extra];
      }
    } else {
      [listTotal, listProviders] = await Promise.all([
        prisma.provider.count({ where: where as never }),
        prisma.provider.findMany({
          where: where as never,
          include: { category: true, subcategory: true },
          orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
          skip,
          take,
        }),
      ]);
    }
  } catch {
    // Fallback se kind ainda não existir no client antigo
    featuredProviders = await prisma.provider.findMany({
      where: { isActive: true, isFeatured: true },
      include: { category: true, subcategory: true },
      orderBy: [{ name: 'asc' }],
      take: PAGE_SIZE,
    });
    if (featuredProviders.length < PAGE_SIZE) {
      const extra = await prisma.provider.findMany({
        where: {
          isActive: true,
          isFeatured: false,
          id: { notIn: featuredProviders.map((p) => p.id) },
        },
        include: { category: true, subcategory: true },
        orderBy: [{ name: 'asc' }],
        take: PAGE_SIZE - featuredProviders.length,
      });
      featuredProviders = [...featuredProviders, ...extra];
    }
  }

  const displayProviders = isFiltering ? listProviders : featuredProviders;
  const totalPages = isFiltering ? Math.max(1, Math.ceil(listTotal / PAGE_SIZE)) : 1;
  const metricsProviders = totalProvidersCount.toLocaleString('pt-BR');

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-amber via-brand-amber/80 to-brand-surface px-4 pb-8 pt-10 sm:px-6 sm:pb-12 sm:pt-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-amber-light/60 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-shell text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl md:text-5xl">
            Prestadores para o seu condomínio
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base font-medium text-brand-navy-mid sm:text-lg">
            Contato direto no WhatsApp
          </p>

          <div className="mx-auto mt-8 max-w-4xl text-left">
            <Suspense fallback={null}>
              <SearchBar
                categories={categories}
                initialSearch={q}
                initialCategory={categoria}
                initialRegion={regiao}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-b border-brand-border bg-brand-card" aria-label="Números do catálogo">
        <div className="mx-auto flex max-w-shell flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-center text-xs font-semibold text-brand-navy-mid sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-amber-dark" aria-hidden />
            {metricsProviders} cadastrados
          </span>
          <span className="text-brand-border" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4 text-brand-amber-dark" aria-hidden />
            {categoryCount} categorias
          </span>
          <span className="text-brand-border" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-brand-green" aria-hidden />
            Contato direto no WhatsApp
          </span>
        </div>
      </section>

      <div className="mx-auto max-w-shell space-y-12 px-4 py-8 sm:px-6 sm:py-12">
        {/* Banner opcional — some se não houver ativo */}
        <BannerSlot banners={banners} position="HERO_TOP" />

        {/* Categorias bento */}
        <section id="categorias" aria-labelledby="categorias-heading">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 id="categorias-heading" className="text-xl font-extrabold text-brand-navy sm:text-2xl">
                Categorias
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Escolha o tipo de serviço para o condomínio
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {categories.map((cat) => (
              <CategoryTile
                key={cat.id}
                name={cat.name}
                slug={cat.slug}
                icon={cat.icon}
                count={cat._count.providers}
                selected={categoria === cat.slug}
                href={
                  categoria === cat.slug
                    ? '/#categorias'
                    : `/?categoria=${cat.slug}#prestadores`
                }
              />
            ))}
          </div>
        </section>

        {/* Prestadores */}
        <section id="prestadores" aria-labelledby="prestadores-heading">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="prestadores-heading" className="text-xl font-extrabold text-brand-navy sm:text-2xl">
                {isFiltering ? 'Resultados da busca' : 'Prestadores em destaque'}
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                {isFiltering
                  ? `${listTotal.toLocaleString('pt-BR')} cadastrado${listTotal === 1 ? '' : 's'} encontrado${listTotal === 1 ? '' : 's'}`
                  : 'Contato direto — sem intermediação'}
              </p>
            </div>
            {isFiltering ? (
              <Link
                href="/"
                className="text-sm font-bold text-brand-amber-dark hover:underline"
              >
                Limpar filtros
              </Link>
            ) : null}
          </div>

          {displayProviders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider as never}
                  forceInitials
                />
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-brand-border bg-brand-card p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-brand-amber-dark" aria-hidden />
              <h3 className="mt-3 text-lg font-bold text-brand-navy">Nenhum prestador encontrado</h3>
              <p className="mt-1 text-sm text-brand-muted">
                Ajuste a busca, categoria ou região e tente de novo.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex min-h-touch items-center justify-center rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy"
              >
                Ver destaques
              </Link>
            </div>
          )}

          {isFiltering && totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginação">
              {page > 1 ? (
                <Link
                  href={`/?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(categoria ? { categoria } : {}),
                    ...(regiao ? { regiao } : {}),
                    page: String(page - 1),
                  }).toString()}#prestadores`}
                  className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-brand-border bg-brand-card px-4 text-sm font-bold text-brand-navy"
                >
                  Anterior
                </Link>
              ) : null}
              <span className="text-sm text-brand-muted">
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(categoria ? { categoria } : {}),
                    ...(regiao ? { regiao } : {}),
                    page: String(page + 1),
                  }).toString()}#prestadores`}
                  className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-brand-border bg-brand-card px-4 text-sm font-bold text-brand-navy"
                >
                  Próxima
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>

        <BannerSlot banners={banners} position="MIDDLE" />

        {/* Utilidade pública */}
        <section aria-labelledby="utilidade-heading">
          <Link
            href="/utilidade-publica"
            className="group flex flex-col gap-4 rounded-card border border-brand-border bg-brand-navy p-6 text-white shadow-card transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-brand-amber text-brand-navy">
                <Landmark className="h-7 w-7" aria-hidden />
              </div>
              <div>
                <h2 id="utilidade-heading" className="text-xl font-extrabold">
                  Utilidade Pública
                </h2>
                <p className="mt-1 max-w-xl text-sm text-slate-300">
                  Telefones e contatos de órgãos públicos, ouvidorias e concessionárias cadastrados no guia.
                </p>
              </div>
            </div>
            <span className="inline-flex min-h-touch items-center gap-2 self-start rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy group-hover:bg-brand-amber-light sm:self-center">
              Ver utilidade pública
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}
