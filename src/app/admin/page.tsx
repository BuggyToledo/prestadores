import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CategoryIcon } from '@/components/CategoryIcon';
import { formatPhone, formatCNPJ } from '@/lib/utils';
import {
  Users,
  FolderTree,
  Eye,
  CheckCircle2,
  PlusCircle,
  ArrowUpRight,
  Edit,
  ExternalLink,
  Building2,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    totalProviders,
    activeProviders,
    featuredProviders,
    totalCategories,
    totalViewsAgg,
    recentProviders,
  ] = await Promise.all([
    prisma.provider.count(),
    prisma.provider.count({ where: { isActive: true } }),
    prisma.provider.count({ where: { isFeatured: true } }),
    prisma.category.count(),
    prisma.provider.aggregate({
      _sum: { viewsCount: true },
    }),
    prisma.provider.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
  ]);

  const totalViews = totalViewsAgg._sum.viewsCount || 0;

  const statCards = [
    {
      label: 'Prestadores Cadastrados',
      value: totalProviders,
      icon: Users,
      color: 'from-amber-500 to-yellow-500',
      textColor: 'text-amber-600',
      bgLight: 'bg-amber-50',
    },
    {
      label: 'Prestadores Ativos',
      value: activeProviders,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    {
      label: 'Categorias de Serviços',
      value: totalCategories,
      icon: FolderTree,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      label: 'Visualizações de Perfis',
      value: totalViews,
      icon: Eye,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
    },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
            Painel Geral
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Dashboard Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie prestadores, categorias e acompanhe o crescimento do catálogo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/categorias"
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all"
          >
            Categorias
          </Link>
          <Link
            href="/admin/prestadores/novo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Prestador</span>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {stat.value}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-2xl ${stat.bgLight} ${stat.textColor} flex items-center justify-center`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção de Últimos Prestadores Cadastrados */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Prestadores Recentes</h2>
            <p className="text-xs text-slate-500">Últimos profissionais adicionados ao sistema</p>
          </div>

          <Link
            href="/admin/prestadores"
            className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Empresa / Profissional</th>
                <th className="py-3.5 px-6">Categoria</th>
                <th className="py-3.5 px-6">Localização</th>
                <th className="py-3.5 px-6">WhatsApp / Fone</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentProviders.map((provider: any) => (
                <tr key={provider.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                        {provider.logoUrl ? (
                          <img
                            src={provider.logoUrl}
                            alt={provider.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block line-clamp-1">
                          {provider.name}
                        </span>
                        {provider.cnpj && (
                          <span className="text-xs text-slate-500 font-mono">
                            {formatCNPJ(provider.cnpj)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <CategoryIcon name={provider.category.icon} className="w-3 h-3 text-amber-600" />
                      <span>{provider.category.name}</span>
                    </span>
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                    {provider.city} - {provider.state}
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-700 font-mono">
                    {provider.whatsapp ? formatPhone(provider.whatsapp) : provider.phone ? formatPhone(provider.phone) : '-'}
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        provider.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          provider.isActive ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                      <span>{provider.isActive ? 'Ativo' : 'Inativo'}</span>
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/prestador/${provider.slug}`}
                        target="_blank"
                        title="Ver página no catálogo"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/prestadores/${provider.id}/editar`}
                        title="Editar prestador"
                        className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
