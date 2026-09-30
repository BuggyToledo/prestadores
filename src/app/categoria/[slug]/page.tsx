import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProviderCard } from '@/components/ProviderCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ArrowLeft, Search, Filter } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      subcategories: {
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      },
      providers: {
        where: { isActive: true },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        include: {
          category: true,
          subcategory: true,
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb e Voltar */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para todas as categorias</span>
          </Link>
        </div>

        {/* Header da Categoria */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/90 shadow-sm mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-inner">
              <CategoryIcon name={category.icon} className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                Categoria de Serviços
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-1 tracking-tight">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
                  {category.description}
                </p>
              )}

              {/* Badges de Subcategorias */}
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Especialidades:
                  </span>
                  {category.subcategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 text-center shrink-0">
            <span className="text-2xl font-black text-slate-900 block">
              {category.providers.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Profissionais Ativos
            </span>
          </div>
        </div>

        {/* Listagem de Prestadores da Categoria */}
        {category.providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum prestador nesta categoria</h3>
            <p className="text-sm text-slate-600 mb-6">
              Ainda não temos profissionais cadastrados para {category.name}. Em breve adicionaremos novos prestadores.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all"
            >
              Explorar outras categorias
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
