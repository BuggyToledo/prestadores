'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  PlusCircle,
  Edit,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { authFetch } from '@/lib/apiClient';

const AVAILABLE_ICONS = [
  'Building2',
  'Scale',
  'HardHat',
  'Wrench',
  'Flame',
  'Sparkles',
  'Leaf',
  'Package',
  'Wifi',
  'Users',
  'HeartPulse',
  'Landmark',
  'Shield',
  'ShieldAlert',
  'Briefcase',
  'Truck',
  'Home',
  'FileText',
  'Settings',
  'Heart',
  'Bug',
  'Recycle',
  'Zap',
  'Paintbrush',
  'Hammer',
  'Key',
  'Computer',
  'Camera',
  'Plug',
  'Car',
  'Wind',
  'Scissors',
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Subcategoria modal & state
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [targetCategoryForSub, setTargetCategoryForSub] = useState<any | null>(null);
  const [subName, setSubName] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);
  const [subDeletingId, setSubDeletingId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Briefcase',
    order: 0,
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'Briefcase',
      order: categories.length + 1,
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'Briefcase',
      order: cat.order || 0,
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenAddSub = (cat: any) => {
    setTargetCategoryForSub(cat);
    setSubName('');
    setError('');
    setSubModalOpen(true);
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategoryForSub || !subName.trim()) return;

    setError('');
    setSubmittingSub(true);

    try {
      const res = await authFetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subName.trim(),
          categoryId: targetCategoryForSub.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar subcategoria.');
      }

      setSubModalOpen(false);
      setSuccess(`Subcategoria "${subName.trim()}" criada com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor');
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleDeleteSubcategory = async (subId: string, subName: string) => {
    if (!confirm(`Deseja realmente remover a subcategoria "${subName}"?`)) return;

    try {
      const res = await authFetch(`/api/subcategories/${subId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir subcategoria');
      }

      setSuccess(`Subcategoria "${subName}" removida!`);
      setTimeout(() => setSuccess(''), 3000);
      loadCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar categoria');
      }

      setModalOpen(false);
      setSuccess(editingCategory ? 'Categoria atualizada!' : 'Categoria cadastrada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      const res = await authFetch(`/api/categories/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir categoria');
      }

      setDeletingId(null);
      setSuccess('Categoria excluída com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      loadCategories();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
            Organização
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Categorias de Serviços
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Crie e organize os ramos de atuação exibidos no catálogo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-sm shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Alerta de Sucesso */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid de Categorias */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-semibold">Carregando categorias...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, idx) => (
            <div
              key={`${cat.id}-${idx}`}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-inner">
                    <CategoryIcon name={cat.icon} className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      title="Editar Categoria"
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(cat.id)}
                      title="Excluir Categoria"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description || 'Sem descrição cadastrada.'}
                </p>

                {/* Seção de Subcategorias */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Subcategorias ({cat.subcategories?.length || 0})</span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddSub(cat)}
                      className="text-amber-700 hover:text-amber-800 text-[11px] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub: any) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1 bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] font-medium px-2 py-0.5 rounded-lg group"
                        >
                          <span>{sub.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                            title="Remover subcategoria"
                            className="text-amber-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Nenhuma subcategoria vinculada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Slug: /{cat.slug}</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {cat._count?.providers || 0} prestadores
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Categoria */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nome da Categoria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Eletricistas & Iluminação"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Descrição Curta
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Reparos elétricos, troca de disjuntores, fiação e tomadas..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Seletor de Ícone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Escolha o Ícone
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const isSelected = formData.icon === iconName;
                    return (
                      <button
                        type="button"
                        key={iconName}
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                        title={iconName}
                      >
                        <CategoryIcon name={iconName} className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ordem de Exibição */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Categoria */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Excluir Categoria?</h3>
              <p className="text-sm text-slate-600">
                Deseja remover esta categoria? Nota: categorias com prestadores associados não podem ser excluídas sem antes reatribuir ou remover os profissionais.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Subcategoria */}
      {subModalOpen && targetCategoryForSub && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nova Subcategoria</h3>
                <p className="text-xs text-slate-500">
                  Categoria pai: <strong>{targetCategoryForSub.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSubModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddSubcategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nome da Subcategoria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Ex: Instalação de Ar Condicionado, CFTV, Fachadas..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingSub}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submittingSub && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Adicionar Subcategoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
