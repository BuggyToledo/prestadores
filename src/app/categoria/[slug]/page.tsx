import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProviderCard } from '@/components/ProviderCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CategoryFilters } from '@/components/CategoryFilters';
import { SponsoredInlineCard } from '@/components/SponsoredInlineCard';
import {
  findHomeRegion,
  regionFilterOr,
  regionsPresentInLocations,
  type HomeRegionId,
} from '@/lib/regions';
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
/** Teto de cards por renderização (“Carregar mais” não ultrapassa). */
const MAX_TAKE = 200;
/** Inserir publicidade após o N-ésimo card (1-based), só se houver banner ativo. */
const SPONSOR_AFTER = 3;

const kindFilter = { kind: { not: 'utilidade_publica' as const } };

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) {
    return { title: 'Categoria não encontrada' };
  }

  const hasVariant = Boolean(
    (sp.q && sp.q.trim()) || sp.regiao || (sp.ordenacao && sp.ordenacao !== 'nome') || sp.mais
  );
  const canonicalPath = `/categoria/${slug}`;
  const description =
    (category.description && category.description.trim()) ||
    `Encontre prestadores de ${category.name} cadastrados para síndicos no Guia Síndico Né! Contato direto no WhatsApp.`;

  return {
    title: `${category.name} | Guia Síndico Né!`,
    description,
    openGraph: {
      title: `${category.name} | Guia Síndico Né!`,
      description,
    },
    alternates: {
      canonical: canonicalPath,
    },
    robots: hasVariant
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const regiao = sp.regiao || '';
  const ordenacao = sp.ordenacao === 'recentes' ? 'recentes' : 'nome';
  const requested = Math.max(PAGE_SIZE, parseInt(sp.mais || String(PAGE_SIZE), 10) || PAGE_SIZE);
  const mais = Math.min(MAX_TAKE, requested);
  const capped = requested > MAX_TAKE;
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

  // Exclui utilidade_publica; kind ausente/null/prestador entram
  const andParts: Record<string, unknown>[] = [
    { isActive: true },
    { categoryId: category.id },
    kindFilter,
  ];

  if (region) {
    andParts.push({ OR: regionFilterOr(region) });
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
  // Ordenação estável: desempate por id evita repetição/saltos no "Carregar mais"
  const orderBy =
    ordenacao === 'recentes'
      ? [{ createdAt: 'desc' as const }, { id: 'asc' as const }]
      : [{ isFeatured: 'desc' as const }, { name: 'asc' as const }, { id: 'asc' as const }];

  let providers: Awaited<ReturnType<typeof prisma.provider.findMany>> = [];
  let total = 0;
  let banners: Awaited<ReturnType<typeof prisma.banner.findMany>> = [];
  let locationRows: Array<{ neighborhood: string | null; city: string; state: string }> = [];

  try {
    [total, providers, banners, locationRows] = await Promise.all([
      prisma.provider.count({ where: where as never }),
      prisma.provider.findMany({
        where: where as never,
        include: { category: true, subcategory: true },
        orderBy: orderBy as never,
        take: mais,
      }),
      // Publicidade: só banner MIDDLE ativo com imagem. Schema sem janela de datas.
      prisma.banner.findMany({
        where: { isActive: true, position: 'MIDDLE' },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        take: 1,
      }),
      prisma.provider.findMany({
        where: {
          isActive: true,
          categoryId: category.id,
          ...kindFilter,
        } as never,
        select: { neighborhood: true, city: true, state: true },
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
    [total, providers, banners, locationRows] = await Promise.all([
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
      prisma.provider.findMany({
        where: { isActive: true, categoryId: category.id } as never,
        select: { neighborhood: true, city: true, state: true },
      }),
    ]);
  }

  const availableRegionIds = regionsPresentInLocations(locationRows) as HomeRegionId[];

  const countLabel = `${category._count.providers} prestador${category._count.providers === 1 ? '' : 'es'}`;
  const hasMore = providers.length < total && !capped && mais < MAX_TAKE;
  const nextMais = Math.min(MAX_TAKE, mais + PAGE_SIZE);
  const moreParams = new URLSearchParams();
  if (q) moreParams.set('q', q);
  if (regiao) moreParams.set('regiao', regiao);
  if (ordenacao === 'recentes') moreParams.set('ordenacao', 'recentes');
  moreParams.set('mais', String(nextMais));

  // Sem banner ativo + imageUrl → não renderiza nada (sem placeholder)
  const sponsor =
    banners.find((b) => b.isActive && b.position === 'MIDDLE' && Boolean(b.imageUrl)) || null;
  const insertSponsorAt = sponsor ? Math.min(SPONSOR_AFTER, providers.length) : -1;

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="mx-auto max-w-shell px-4 pb-12 pt-4 sm:px-6 sm:pt-8">
        <Link
          href="/#categorias"
          className="mb-4 inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-brand-navy-mid hover:text-brand-amber-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Todas as categorias
        </Link>

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
          <CategoryFilters categorySlug={slug} availableRegionIds={availableRegionIds} />
        </Suspense>

        <div className="mt-6 mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-muted" aria-live="polite">
            {total === 0
              ? 'Nenhum resultado'
              : `${Math.min(providers.length, total)} de ${total.toLocaleString('pt-BR')} resultado${total === 1 ? '' : 's'}`}
          </p>
          {capped || (providers.length >= MAX_TAKE && total > MAX_TAKE) ? (
            <p className="text-xs text-brand-muted">
              Exibindo no máximo {MAX_TAKE} resultados. Refine a busca ou a região.
            </p>
          ) : null}
        </div>

        {providers.length > 0 ? (
          <>
            <h2 className="sr-only">Resultados</h2>
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
                  className="inline-flex min-h-touch items-center justify-center rounded-control border-2 border-brand-amber bg-brand-card px-8 text-sm font-bold text-brand-navy shadow-card hover:bg-brand-amber-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
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
              className="mt-5 inline-flex min-h-touch items-center justify-center rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
            >
              Limpar filtros
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
