'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Instagram,
  MapPin,
  FileText,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

interface Category {
  id: string;
  name: string;
}

interface ProviderFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function ProviderForm({ initialData, isEdit = false }: ProviderFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    cnpj: initialData?.cnpj || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    instagram: initialData?.instagram || '',
    address: initialData?.address || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || 'São Paulo',
    state: initialData?.state || 'SP',
    zipCode: initialData?.zipCode || '',
    description: initialData?.description || '',
    services: initialData?.services || '',
    logoUrl: initialData?.logoUrl || '',
    coverUrl: initialData?.coverUrl || '',
    isFeatured: initialData?.isFeatured ?? false,
    isActive: initialData?.isActive ?? true,
  });

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        if (!formData.categoryId && data.categories?.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      const url = isEdit ? `/api/providers/${initialData.id}` : '/api/providers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar prestador.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/prestadores');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* Mensagens de Feedback */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>Prestador salvo com sucesso! Redirecionando...</span>
        </div>
      )}

      {/* SEÇÃO 1: DADOS PRINCIPAIS E CATEGORIA */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-amber-600" />
          <span>Identificação do Negócio</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Nome */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Nome da Empresa / Profissional <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Silva & Filhos Instalações Elétricas"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Categoria do Serviço <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              required
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium cursor-pointer"
            >
              {loadingCategories ? (
                <option>Carregando categorias...</option>
              ) : (
                categories.map((c, idx) => (
                  <option key={`${c.id}-${idx}`} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* CNPJ / CPF */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              CNPJ ou CPF (Opcional)
            </label>
            <input
              type="text"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0001-00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: CONTATOS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Phone className="w-5 h-5 text-amber-600" />
          <span>Informações de Contato</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              WhatsApp (com DDD)
            </label>
            <div className="relative">
              <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="11999998888"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Gera botão de mensagem direta no WhatsApp
            </span>
          </div>

          {/* Telefone Fixo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Telefone Fixo / Comercial
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 3333-4444"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              E-mail de Contato
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contato@empresa.com.br"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://empresa.com.br"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Instagram */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Instagram (@)
            </label>
            <div className="relative">
              <Instagram className="w-4 h-4 text-pink-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@suaempresa"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: ENDEREÇO E LOCALIZAÇÃO */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <MapPin className="w-5 h-5 text-amber-600" />
          <span>Localização e Endereço</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Cidade */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              placeholder="São Paulo"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Estado (UF) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="state"
              required
              maxLength={2}
              value={formData.state}
              onChange={handleChange}
              placeholder="SP"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* CEP */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              CEP (Opcional)
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="01000-000"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
            />
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Bairro
            </label>
            <input
              type="text"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              placeholder="Centro / Jardins"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Endereço Completo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Logradouro (Rua, Número, Sala)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Av. Paulista, 1000, Sala 12"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: DESCRIÇÃO, SERVIÇOS E FOTOS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-5 h-5 text-amber-600" />
          <span>Apresentação e Serviços</span>
        </h2>

        <div className="space-y-5">
          {/* Descrição Detalhada */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Descrição dos Serviços e Sobre a Empresa
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva a experiência, garantias, diferenciais, formas de pagamento, horários de atendimento..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 leading-relaxed"
            />
          </div>

          {/* Serviços Separados por Vírgula */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Lista de Serviços / Especialidades (Separados por vírgula)
            </label>
            <input
              type="text"
              name="services"
              value={formData.services}
              onChange={handleChange}
              placeholder="Ex: Instalação de Ar-Condicionado, Manutenção Preventiva, Carga de Gás, Limpeza"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Esses serviços aparecerão como tags e badges no perfil e na busca.
            </span>
          </div>

          {/* URLs de Imagens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                URL da Foto / Logotipo
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/logo.jpg"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                URL da Foto de Capa / Fachada
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="coverUrl"
                  value={formData.coverUrl}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/capa.jpg"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: CONFIGURAÇÕES E STATUS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
          Status de Publicação
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mt-1 w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                Prestador Ativo no Catálogo
              </span>
              <span className="text-xs text-slate-500">
                O perfil ficará visível publicamente para buscas e clientes.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="mt-1 w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-900 text-sm block flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Marcar como Destaque na Home</span>
              </span>
              <span className="text-xs text-slate-500">
                Aparece no topo dos resultados e com selo de destaque.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* BOTÕES DE SALVAR / CANCELAR */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <Link
          href="/admin/prestadores"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Listagem</span>
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando Prestador...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Salvar Alterações' : 'Cadastrar Prestador'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
