'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  Building2,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { formatPhone, formatCNPJ } from '@/lib/utils';
import { CategoryIcon } from '@/components/CategoryIcon';
import { authFetch } from '@/lib/apiClient';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [provRes, catRes] = await Promise.all([
        fetch('/api/providers?all=true&limit=100'),
        fetch('/api/categories'),
      ]);

      const provData = await provRes.json();
      const catData = await catRes.json();

      setProviders(provData.providers || []);
      setCategories(catData.categories || []);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Alternar Ativo/Inativo
  const handleToggleActive = async (provider: any) => {
    try {
      const res = await authFetch(`/api/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...provider,
          isActive: !provider.isActive,
        }),
      });

      if (res.ok) {
        setProviders((prev) =>
          prev.map((p) => (p.id === provider.id ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Alternar Destaque
  const handleToggleFeatured = async (provider: any) => {
    try {
      const res = await authFetch(`/api/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...provider,
          isFeatured: !provider.isFeatured,
        }),
      });

      if (res.ok) {
        setProviders((prev) =>
          prev.map((p) => (p.id === provider.id ? { ...p, isFeatured: !p.isFeatured } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Confirmar Exclusão
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setActionLoading(true);
      const res = await authFetch(`/api/providers/${deletingId}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setProviders((prev) => prev.filter((p) => p.id !== deletingId));
        setSuccessMessage('Prestador excluído com sucesso do catálogo!');
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeletingId(null);
        setDeletingName(null);
      } else {
        alert(data.error || 'Erro ao excluir prestador.');
      }
    } catch (e) {
      console.error(e);
      alert('Falha na comunicação com o servidor ao excluir.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtragem local dos prestadores
  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.cnpj && p.cnpj.includes(search)) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)) ||
      (p.whatsapp && p.whatsapp.includes(search));

    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.isActive
        : !p.isActive;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
            Gerenciamento
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Prestadores de Serviços
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre, edite informações, ative/desative empresas e marque destaques.
          </p>
        </div>

        <Link
          href="/admin/prestadores/novo"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Cadastrar Novo Prestador</span>
        </Link>
      </div>

      {/* Alerta de Sucesso */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Busca por texto */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, telefone, cidade..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* Filtro por Categoria */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 cursor-pointer"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((c, idx) => (
              <option key={`${c.id}-${idx}`} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Status */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 cursor-pointer"
          >
            <option value="all">Status: Todos</option>
            <option value="active">Somente Ativos</option>
            <option value="inactive">Somente Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela de Prestadores */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm font-semibold">Carregando prestadores...</span>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700">Nenhum prestador encontrado</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Nenhum resultado corresponde aos filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Prestador / Empresa</th>
                  <th className="py-3.5 px-6">Categoria</th>
                  <th className="py-3.5 px-6">Localização</th>
                  <th className="py-3.5 px-6">Contatos</th>
                  <th className="py-3.5 px-6 text-center">Destaque</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Prestador / Foto */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
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
                            <span className="text-[11px] text-slate-500 font-mono">
                              CNPJ: {formatCNPJ(provider.cnpj)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <CategoryIcon name={provider.category?.icon} className="w-3 h-3 text-amber-600" />
                        <span>{provider.category?.name || 'Sem categoria'}</span>
                      </span>
                    </td>

                    {/* Localização */}
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <span className="font-medium block">{provider.city} - {provider.state}</span>
                      {provider.neighborhood && (
                        <span className="text-slate-400 text-[11px]">{provider.neighborhood}</span>
                      )}
                    </td>

                    {/* Contatos */}
                    <td className="py-4 px-6 text-xs text-slate-700 font-mono space-y-0.5">
                      {provider.whatsapp && (
                        <div className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span>Whats:</span>
                          <span>{formatPhone(provider.whatsapp)}</span>
                        </div>
                      )}
                      {provider.phone && (
                        <div className="text-slate-600">
                          <span>Tel: {formatPhone(provider.phone)}</span>
                        </div>
                      )}
                    </td>

                    {/* Destaque */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleFeatured(provider)}
                        title={provider.isFeatured ? 'Remover dos destaques' : 'Marcar como destaque'}
                        className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center ${
                          provider.isFeatured
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${provider.isFeatured ? 'fill-amber-500' : ''}`} />
                      </button>
                    </td>

                    {/* Status Ativo/Inativo */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(provider)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all ${
                          provider.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            provider.isActive ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        <span>{provider.isActive ? 'Ativo' : 'Inativo'}</span>
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/prestador/${provider.slug}`}
                          target="_blank"
                          title="Visualizar perfil público"
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/prestadores/${provider.id}/editar`}
                          title="Editar dados"
                          className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setDeletingId(provider.id);
                            setDeletingName(provider.name);
                          }}
                          title="Excluir prestador"
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Excluir {deletingName ? `"${deletingName}"` : 'Prestador'}?
              </h3>
              <p className="text-sm text-slate-600">
                Tem certeza que deseja excluir permanentemente este prestador? Ele será removido imediatamente de todas as buscas do catálogo público.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setDeletingId(null);
                  setDeletingName(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
