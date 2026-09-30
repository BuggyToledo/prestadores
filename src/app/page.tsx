import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { SearchBar } from '@/components/SearchBar';
import { ProviderCard } from '@/components/ProviderCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { BannerDisplay } from '@/components/BannerDisplay';
import {
  Sparkles,
  Award,
  Users,
  Search,
  CheckCircle,
  PhoneCall,
  SlidersHorizontal,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    cidade?: string;
    uf?: string;
    destaque?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q || '';
  const categoria = params.categoria || '';
  const cidade = params.cidade || '';

  // Buscar categorias, prestadores e banners ativos em paralelo
  const [categories, banners] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            providers: {
              where: { isActive: true },
            },
          },
        },
      },
    }),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  // Montar filtro do Prisma para os prestadores
  const whereFilter: any = {
    isActive: true,
  };

  if (categoria) {
    whereFilter.category = {
      slug: categoria,
    };
  }

  if (cidade) {
    whereFilter.city = {
      contains: cidade,
    };
  }

  if (q.trim()) {
    const term = q.trim();
    whereFilter.OR = [
      { name: { contains: term } },
      { description: { contains: term } },
      { services: { contains: term } },
      { neighborhood: { contains: term } },
      { city: { contains: term } },
      { category: { name: { contains: term } } },
      { subcategory: { name: { contains: term } } },
    ];
  }

  // Buscar prestadores
  const [providers, totalProvidersCount] = await Promise.all([
    prisma.provider.findMany({
      where: whereFilter,
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' },
      ],
    }),
    prisma.provider.count({ where: { isActive: true } }),
  ]);

  const activeCategoryObject = categories.find((c) => c.slug === categoria);
  const isFiltering = Boolean(q || categoria || cidade);

  return (
    <div className="min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-amber-400 via-amber-300 to-amber-100/40 pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Elementos visuais de fundo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-yellow-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-950/10 backdrop-blur-md text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-slate-900/10">
            <Award className="w-4 h-4 text-amber-900" />
            <span>O Maior Catálogo de Especialistas da Região</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.15] mb-6">
            Encontre os Melhores <br className="hidden sm:inline" />
            <span className="text-amber-900 bg-amber-400/40 px-3 py-1 rounded-xl inline-block mt-1">
              Prestadores de Serviços
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-800 max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            Eletricistas, encanadores, mecânicos, pedreiros, chaveiros e muito mais. Contato direto via WhatsApp sem intermediários.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-800">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>{totalProvidersCount} Profissionais Cadastrados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>{categories.length} Categorias Disponíveis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Contato Direto no WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE BUSCA FLUTUANTE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SearchBar
          categories={categories}
          initialSearch={q}
          initialCategory={categoria}
          initialCity={cidade}
        />
      </div>

      {/* BANNER TOPO PRINCIPAL (HERO_TOP) */}
      <BannerDisplay
        banners={banners}
        position="HERO_TOP"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
      />

      {/* 3. CATEGORIAS EM DESTAQUE */}
      <section id="categorias" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>Categorias Populares</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Navegue pelas áreas de serviços mais solicitadas
            </p>
          </div>

          {categoria && (
            <Link
              href="/#categorias"
              className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 bg-amber-100/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              Limpar Categoria Selecionada
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const isSelected = categoria === cat.slug;
            return (
              <Link
                key={`${cat.id}-${idx}`}
                href={isSelected ? '/' : `/?categoria=${cat.slug}#prestadores`}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400'
                    : 'bg-white hover:bg-amber-50/50 border-slate-200 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isSelected
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-amber-100 text-amber-800 group-hover:bg-amber-200'
                    }`}
                  >
                    <CategoryIcon name={cat.icon} className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-amber-200/60 group-hover:text-amber-900'
                    }`}
                  >
                    {cat._count.providers}
                  </span>
                </div>

                <div>
                  <h3
                    className={`font-bold text-sm sm:text-base leading-snug mb-1 ${
                      isSelected ? 'text-slate-950' : 'text-slate-900 group-hover:text-amber-700'
                    }`}
                  >
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p
                      className={`text-xs line-clamp-1 ${
                        isSelected ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {cat.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* BANNER DO MEIO (MIDDLE) */}
      <BannerDisplay
        banners={banners}
        position="MIDDLE"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      />

      {/* 4. LISTAGEM DE PRESTADORES */}
      <section id="prestadores" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {activeCategoryObject ? activeCategoryObject.name : 'Todos os Prestadores'}
              </h2>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {providers.length} encontrados
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isFiltering
                ? `Exibindo resultados filtrados por: ${[
                    q && `termo "${q}"`,
                    categoria && `categoria "${activeCategoryObject?.name || categoria}"`,
                    cidade && `cidade "${cidade}"`,
                  ]
                    .filter(Boolean)
                    .join(', ')}`
                : 'Conecte-se com profissionais qualificados e peça seu orçamento'}
            </p>
          </div>

          {isFiltering && (
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
            >
              Limpar todos os filtros
            </Link>
          )}
        </div>

        {/* Grid de Prestadores */}
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum prestador encontrado</h3>
            <p className="text-sm text-slate-600 mb-6">
              Não encontramos nenhum profissional correspondente aos filtros selecionados. Tente buscar por outros termos ou verifique todas as categorias.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all"
            >
              Ver todos os profissionais
            </Link>
          </div>
        )}
      </section>

      {/* BANNER RODAPÉ (FOOTER) */}
      <BannerDisplay
        banners={banners}
        position="FOOTER"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      />

      {/* 5. BANNER CADASTRE SEU NEGÓCIO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden border border-slate-700">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Área Administrativa</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Gerencie e cadastre prestadores de serviços
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Acesse o painel administrativo protegido por senha para cadastrar novas empresas, criar categorias, atualizar contatos e dados de CNPJ.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              href="/admin/login"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Acessar Painel de Admin</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
