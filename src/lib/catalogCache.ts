import { cache } from 'react';
import { unstable_cache, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const CACHE_TAGS = {
  categories: 'categories',
  providers: 'providers',
  banners: 'banners',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/** Invalida caches de catálogo após mutações no admin. */
export function revalidateCatalog(...tags: CacheTag[]) {
  const list = tags.length > 0 ? tags : Object.values(CACHE_TAGS);
  for (const tag of list) {
    revalidateTag(tag);
  }
}

const KIND_PRESTADOR = { kind: 'prestador' as const, isActive: true };
const KIND_NOT_UTIL = { kind: { not: 'utilidade_publica' as const }, isActive: true };

/** React cache — dedupe na mesma request (ex.: generateMetadata + page). */
export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.category.findUnique({
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
});

export const getCategoryMetaBySlug = cache(async (slug: string) => {
  return prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
});

/** Categorias da home (até 12) com contagem. */
export const getCachedHomeCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      take: 12,
      include: {
        _count: {
          select: { providers: { where: { isActive: true } } },
        },
      },
    });
  },
  ['home-categories-v1'],
  { tags: [CACHE_TAGS.categories, CACHE_TAGS.providers], revalidate: 300 }
);

export const getCachedActiveBanners = unstable_cache(
  async () => {
    return prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  },
  ['active-banners-v1'],
  { tags: [CACHE_TAGS.banners], revalidate: 300 }
);

export const getCachedCatalogCounts = unstable_cache(
  async () => {
    const [providers, categories] = await Promise.all([
      prisma.provider.count({ where: { isActive: true } }),
      prisma.category.count(),
    ]);
    return { providers, categories };
  },
  ['catalog-counts-v1'],
  { tags: [CACHE_TAGS.providers, CACHE_TAGS.categories], revalidate: 300 }
);

/** Destaques / recomendados (kind prestador). */
export const getCachedFeaturedProviders = unstable_cache(
  async (take = 6) => {
    try {
      let featured = await prisma.provider.findMany({
        where: { ...KIND_PRESTADOR, isFeatured: true } as never,
        include: { category: true, subcategory: true },
        orderBy: [{ name: 'asc' }],
        take,
      });
      if (featured.length < take) {
        const extra = await prisma.provider.findMany({
          where: {
            ...KIND_PRESTADOR,
            isFeatured: false,
            id: { notIn: featured.map((p) => p.id) },
          } as never,
          include: { category: true, subcategory: true },
          orderBy: [{ name: 'asc' }],
          take: take - featured.length,
        });
        featured = [...featured, ...extra];
      }
      return featured;
    } catch {
      // Fallback mock/schema antigo sem kind
      return prisma.provider.findMany({
        where: { isActive: true, isFeatured: true },
        include: { category: true, subcategory: true },
        orderBy: [{ name: 'asc' }],
        take,
      });
    }
  },
  ['featured-providers-v2'],
  { tags: [CACHE_TAGS.providers], revalidate: 180 }
);

/** Locais da categoria (para seletor de região) — cache curto. */
export const getCachedCategoryLocations = unstable_cache(
  async (categoryId: string) => {
    try {
      return await prisma.provider.findMany({
        where: {
          categoryId,
          ...KIND_NOT_UTIL,
        } as never,
        select: {
          neighborhood: true,
          city: true,
          state: true,
          phone: true,
          whatsapp: true,
        },
      });
    } catch {
      return prisma.provider.findMany({
        where: { isActive: true, categoryId },
        select: {
          neighborhood: true,
          city: true,
          state: true,
          phone: true,
          whatsapp: true,
        },
      });
    }
  },
  ['category-locations-v1'],
  { tags: [CACHE_TAGS.providers], revalidate: 180 }
);

export const getCachedMiddleBanner = unstable_cache(
  async () => {
    return prisma.banner.findMany({
      where: { isActive: true, position: 'MIDDLE' },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: 1,
    });
  },
  ['middle-banner-v1'],
  { tags: [CACHE_TAGS.banners], revalidate: 300 }
);
