'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Sparkles,
  MousePointerClick,
  Eye,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    target: '_blank',
    position: 'HERO_TOP',
    isActive: true,
    order: 0,
  });

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/banners?all=true');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (e) {
      console.error('Erro ao carregar banners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      target: '_blank',
      position: 'HERO_TOP',
      isActive: true,
      order: banners.length + 1,
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      target: banner.target || '_blank',
      position: banner.position || 'HERO_TOP',
      isActive: banner.isActive ?? true,
      order: banner.order || 0,
    });
    setError('');
    setModalOpen(true);
  };

  // Upload local de imagem convertendo para Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar banner.');
      }

      setModalOpen(false);
      setSuccess(editingBanner ? 'Banner atualizado com sucesso!' : 'Banner cadastrado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      loadBanners();
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar Ativo/Inativo em 1 clique
  const handleToggleActive = async (banner: any) => {
    try {
      const res = await authFetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...banner,
          isActive: !banner.isActive,
        }),
      });

      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Excluir Banner
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      const res = await authFetch(`/api/banners/${deletingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao excluir banner.');
      }

      setDeletingId(null);
      setSuccess('Banner excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setBanners((prev) => prev.filter((b) => b.id !== deletingId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (positionFilter === 'ALL') return true;
    return b.position === positionFilter;
  });

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'HERO_TOP':
        return 'Topo da Página (Hero)';
      case 'MIDDLE':
        return 'Meio (Entre Categorias)';
      case 'FOOTER':
        return 'Rodapé';
      default:
        return pos;
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
            Monetização & Publicidade
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Banners de Propaganda
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie anúncios, campanhas de parceiros e links promocionais na página principal.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-sm shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Cadastrar Novo Banner</span>
        </button>
      </div>

      {/* Alerta de Sucesso */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filtro por Posição */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {[
          { id: 'ALL', label: 'Todos os Banners' },
          { id: 'HERO_TOP', label: 'Topo Principal' },
          { id: 'MIDDLE', label: 'Meio da Página' },
          { id: 'FOOTER', label: 'Rodapé' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPositionFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              positionFilter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listagem de Banners */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-semibold">Carregando banners...</span>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nenhum banner cadastrado</h3>
          <p className="text-xs text-slate-500">
            Crie seu primeiro anúncio para exibir nas posições de destaque do site.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Primeiro Banner</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Imagem de Prévia */}
                <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {getPositionLabel(banner.position)}
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md transition-colors cursor-pointer ${
                        banner.isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {banner.isActive ? 'Ativo' : 'Pausado'}
                    </button>
                  </div>
                </div>

                {/* Dados do Banner */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                    {banner.title}
                  </h3>

                  {banner.linkUrl ? (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-700 hover:underline flex items-center gap-1 line-clamp-1 font-mono"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span>{banner.linkUrl}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sem link de destino</span>
                  )}
                </div>
              </div>

              {/* Métricas e Ações */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-1" title="Cliques no anúncio">
                    <MousePointerClick className="w-3.5 h-3.5 text-amber-600" />
                    <span>{banner.clicksCount || 0} cliques</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    title="Editar Banner"
                    className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(banner.id)}
                    title="Excluir Banner"
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Banner */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingBanner ? 'Editar Banner de Propaganda' : 'Cadastrar Novo Banner'}
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
              {/* Título / Nome da Campanha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Título da Campanha / Anunciante <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Reforma Predial e Impermeabilização - Desconto 15%"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              {/* Posição no Site */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Posição de Exibição
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium cursor-pointer"
                >
                  <option value="HERO_TOP">Topo da Página (Abaixo da busca)</option>
                  <option value="MIDDLE">Meio da Página (Entre Categorias e Lista)</option>
                  <option value="FOOTER">Rodapé da Página</option>
                </select>
              </div>

              {/* Imagem do Banner: Upload ou URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Imagem do Banner <span className="text-red-500">*</span>
                </label>

                {/* Prévia da Imagem */}
                {formData.imageUrl && (
                  <div className="relative mb-3 rounded-2xl overflow-hidden aspect-[21/9] bg-slate-900 border border-slate-200">
                    <img
                      src={formData.imageUrl}
                      alt="Prévia do banner"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white hover:bg-black rounded-lg text-xs"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                    >
                      <Upload className="w-4 h-4 text-amber-600" />
                      <span>Fazer Upload do Arquivo (PNG/JPG)</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Ou cole a URL da imagem (https://...)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Link de Destino */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Link de Redirecionamento ao Clicar (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://anunciante.com.br ou https://wa.me/55..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
                />
              </div>

              {/* Ordem e Status */}
              <div className="grid grid-cols-2 gap-4 pt-2">
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

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-900">Banner Ativo</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingBanner ? 'Salvar Alterações' : 'Criar Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Banner */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Excluir Banner?</h3>
            <p className="text-sm text-slate-600">
              Tem certeza que deseja remover este anúncio? Ele sairá imediatamente da página principal.
            </p>

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
    </div>
  );
}
