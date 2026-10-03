import React, { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProviderCard } from '@/components/ProviderCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CategoryFilters } from '@/components/CategoryFilters';
import { SponsoredInlineCard } from '@/components/SponsoredInlineCard';
import { findHomeRegion } from '@/lib/regions';
import { ArrowLeft, Search } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    regiao?: string;
    ordenacao?: string;
    mais?: string;
  }>;
}

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;
/** Inserir publicidade após o N-ésimo card (1-based index na lista). */
const SPONSOR_AFTER = 3;

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const regiao = sp.regiao || '';
  const ordenacao = sp.ordenacao === 'recentes' ? 'recentes' : 'nome';
  const mais = Math.max(PAGE_SIZE, parseInt(sp.mais || String(PAGE_SIZE), 10) || PAGE_SIZE);
  const region = findHomeRegion(regiao);

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      subcategories: {
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      },
      _count: {
        select: { providers: { where: { isActive: true } } },
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Exclui utilidade_publica; kind ausente/null/prestador entram (Prisma: kind: { not: ... })
  const andParts: Record<string, unknown>[] = [
    { isActive: true },
    { categoryId: category.id },
    { kind: { not: 'utilidade_publica' } },
  ];

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

  if (q) {
    andParts.push({
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { services: { contains: q } },
        { neighborhood: { contains: q } },
        { city: { contains: q } },
        { subcategory: { name: { contains: q } } },
      ],
    });
  }

  const where = { AND: andParts };
  const orderBy =
    ordenacao === 'recentes'
      ? [{ createdAt: 'desc' as const }]
      : [{ isFeatured: 'desc' as const }, { name: 'asc' as const }];

  let providers: Awaited<ReturnType<typeof prisma.provider.findMany>> = [];
  let total = 0;
  let banners: Awaited<ReturnType<typeof prisma.banner.findMany>> = [];

  try {
    [total, providers, banners] = await Promise.all([
      prisma.provider.count({ where: where as never }),
      prisma.provider.findMany({
        where: where as never,
        include: { category: true, subcategory: true },
        orderBy: orderBy as never,
        take: mais,
      }),
      prisma.banner.findMany({
        where: { isActive: true, position: 'MIDDLE' },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        take: 1,
      }),
    ]);
  } catch {
    const simpleWhere: Record<string, unknown> = {
      isActive: true,
      categoryId: category.id,
    };
    if (q) {
      simpleWhere.OR = [
        { name: { contains: q } },
        { services: { contains: q } },
        { neighborhood: { contains: q } },
      ];
    }
    [total, providers, banners] = await Promise.all([
      prisma.provider.count({ where: simpleWhere as never }),
      prisma.provider.findMany({
        where: simpleWhere as never,
        include: { category: true, subcategory: true },
        orderBy: orderBy as never,
        take: mais,
      }),
      prisma.banner.findMany({
        where: { isActive: true, position: 'MIDDLE' },
        orderBy: [{ order: 'asc' }],
        take: 1,
      }),
    ]);
  }

  const countLabel = `${category._count.providers} prestador${category._count.providers === 1 ? '' : 'es'}`;
  const hasMore = providers.length < total;
  const nextMais = mais + PAGE_SIZE;
  const moreParams = new URLSearchParams();
  if (q) moreParams.set('q', q);
  if (regiao) moreParams.set('regiao', regiao);
  if (ordenacao === 'recentes') moreParams.set('ordenacao', 'recentes');
  moreParams.set('mais', String(nextMais));

  const sponsor = banners[0] || null;
  const insertSponsorAt = Math.min(SPONSOR_AFTER, providers.length);

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="mx-auto max-w-shell px-4 pb-12 pt-4 sm:px-6 sm:pt-8">
        <Link
          href="/#categorias"
          className="mb-4 inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-brand-navy-mid hover:text-brand-amber-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Todas as categorias
        </Link>

        {/* Header da categoria */}
        <header className="mb-2 flex flex-col gap-4 rounded-card border border-brand-border bg-brand-card p-5 shadow-card sm:flex-row sm:items-start sm:p-7">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-card bg-brand-amber-light text-brand-amber-dark sm:h-20 sm:w-20">
            <CategoryIcon name={category.icon} className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
              {category.name}
              <span className="mt-1 block text-base font-semibold text-brand-muted sm:mt-0 sm:ml-2 sm:inline sm:text-lg">
                · {countLabel}
              </span>
            </h1>
            {category.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-navy-mid">
                {category.description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-brand-muted">
                Prestadores cadastrados nesta categoria — contato direto no WhatsApp.
              </p>
            )}
          </div>
        </header>

        <Suspense fallback={null}>
          <CategoryFilters categorySlug={slug} />
        </Suspense>

        <div className="mt-6 mb-4 flex items-center justify-between gap-2">
          <p className="text-sm text-brand-muted">
            {total === 0
              ? 'Nenhum resultado'
              : `${Math.min(providers.length, total)} de ${total.toLocaleString('pt-BR')} resultado${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {providers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {providers.map((provider, index) => (
                <React.Fragment key={provider.id}>
                  <ProviderCard provider={provider as never} variant="results" forceInitials />
                  {sponsor && index + 1 === insertSponsorAt ? (
                    <div className="md:col-span-3">
                      <SponsoredInlineCard banner={sponsor} />
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </div>

            {hasMore ? (
              <div className="mt-10 text-center">
                <Link
                  href={`/categoria/${slug}?${moreParams.toString()}`}
                  className="inline-flex min-h-touch items-center justify-center rounded-control border-2 border-brand-amber bg-brand-card px-8 text-sm font-bold text-brand-navy shadow-card hover:bg-brand-amber-light"
                >
                  Carregar mais
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-card border border-dashed border-brand-border bg-brand-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-amber-light text-brand-amber-dark">
              <Search className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-brand-navy">Nenhum prestador encontrado</h2>
            <p className="mt-2 text-sm text-brand-muted">
              Nenhum prestador encontrado. Tente outro bairro.
            </p>
            <Link
              href={`/categoria/${slug}`}
              className="mt-5 inline-flex min-h-touch items-center justify-center rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy"
            >
              Limpar filtros
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
