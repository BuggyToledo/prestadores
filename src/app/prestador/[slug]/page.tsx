import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  formatPhone,
  formatCNPJ,
  formatCEP,
  getWhatsAppLink,
} from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Instagram,
  Building2,
  Star,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Calendar,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProviderDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const provider = await prisma.provider.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isActive: true,
    },
    include: {
      category: true,
      subcategory: true,
    },
  });

  if (!provider) {
    notFound();
  }

  // Incrementar visualização de forma segura
  try {
    await prisma.provider.update({
      where: { id: provider.id },
      data: { viewsCount: { increment: 1 } },
    });
  } catch (e) {
    // Silently ignore if fails
  }

  const whatsappUrl = provider.whatsapp
    ? getWhatsAppLink(provider.whatsapp, provider.name)
    : null;

  const parsedServices = provider.services
    ? provider.services.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const fullAddress = [
    provider.address,
    provider.neighborhood,
    `${provider.city} - ${provider.state}`,
    provider.zipCode ? `CEP: ${formatCEP(provider.zipCode)}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Voltar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao catálogo</span>
          </Link>

          <Link
            href={`/categoria/${provider.category.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <CategoryIcon name={provider.category.icon} className="w-3.5 h-3.5" />
            <span>Ver mais em {provider.category.name}</span>
          </Link>
        </div>

        {/* Card Principal do Perfil */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden mb-8">
          {/* Capa */}
          <div className="h-44 sm:h-56 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 relative overflow-hidden flex items-center justify-center">
            {provider.coverUrl && (
              <img
                src={provider.coverUrl}
                alt={provider.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

            {provider.isFeatured && (
              <div className="absolute top-4 right-4 bg-slate-950 text-amber-400 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>PRESTADOR VERIFICADO & DESTAQUE</span>
              </div>
            )}
          </div>

          {/* Dados e Informações */}
          <div className="px-6 sm:px-10 pb-10 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-8">
              <div className="flex items-end gap-5">
                {/* Logo / Avatar */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center relative z-10">
                  {provider.logoUrl ? (
                    <img
                      src={provider.logoUrl}
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-amber-100 to-amber-200 flex items-center justify-center text-amber-800">
                      <CategoryIcon name={provider.category.icon} className="w-14 h-14" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
                      <CategoryIcon name={provider.category.icon} className="w-3.5 h-3.5" />
                      <span>{provider.category.name}</span>
                    </div>
                    {provider.subcategory && (
                      <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                        {provider.subcategory.name}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {provider.name}
                  </h1>
                </div>
              </div>

              {/* Botões de Contato Rápido no Topo */}
              <div className="flex flex-wrap items-center gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all"
                  >
                    <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
                    <span>Chamar no WhatsApp</span>
                  </a>
                )}

                {provider.phone && (
                  <a
                    href={`tel:${provider.phone.replace(/\D/g, '')}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-3.5 rounded-2xl shadow transition-all"
                  >
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>Ligar Agora</span>
                  </a>
                )}
              </div>
            </div>

            {/* Grid de Informações: Descrição e Painel Lateral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-slate-100">
              {/* Coluna Principal: Sobre e Serviços */}
              <div className="lg:col-span-2 space-y-8">
                {/* Sobre a Empresa */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <span>Sobre o Prestador</span>
                  </h2>
                  <div className="text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 whitespace-pre-line">
                    {provider.description || 'Nenhuma descrição detalhada informada.'}
                  </div>
                </div>

                {/* Serviços Oferecidos */}
                {parsedServices.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Especialidades e Serviços Oferecidos</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {parsedServices.map((service, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-sm font-medium text-slate-800">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Endereço Completo */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <span>Localização e Área de Atendimento</span>
                  </h2>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {fullAddress || `${provider.city} - ${provider.state}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Atende na cidade de {provider.city} e bairros vizinhos. Entre em contato para confirmar taxa de deslocamento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Coluna Lateral: Cartão de Contatos e Dados Fiscais */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                    Canais de Contato
                  </h3>

                  {provider.whatsapp && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium block">WhatsApp</span>
                        <a
                          href={whatsappUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-emerald-700 hover:underline"
                        >
                          {formatPhone(provider.whatsapp)}
                        </a>
                      </div>
                    </div>
                  )}

                  {provider.phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium block">Telefone Fixo / Comercial</span>
                        <a
                          href={`tel:${provider.phone.replace(/\D/g, '')}`}
                          className="text-sm font-bold text-slate-900 hover:text-amber-600"
                        >
                          {formatPhone(provider.phone)}
                        </a>
                      </div>
                    </div>
                  )}

                  {provider.email && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500 font-medium block">E-mail</span>
                        <a
                          href={`mailto:${provider.email}`}
                          className="text-sm font-bold text-slate-900 hover:text-amber-600 break-all"
                        >
                          {provider.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {provider.website && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500 font-medium block">Website Oficial</span>
                        <a
                          href={provider.website.startsWith('http') ? provider.website : `https://${provider.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-purple-700 hover:underline break-all inline-flex items-center gap-1"
                        >
                          <span>Visitar site</span>
                          <Globe className="w-3 h-3 inline" />
                        </a>
                      </div>
                    </div>
                  )}

                  {provider.instagram && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium block">Instagram</span>
                        <a
                          href={
                            provider.instagram.startsWith('http')
                              ? provider.instagram
                              : `https://instagram.com/${provider.instagram.replace('@', '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-pink-700 hover:underline"
                        >
                          {provider.instagram.startsWith('@') ? provider.instagram : `@${provider.instagram}`}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dados da Empresa / CNPJ */}
                <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Identificação Profissional</span>
                  </div>

                  {provider.cnpj ? (
                    <div>
                      <span className="text-xs text-slate-500 block">CNPJ / CPF</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {formatCNPJ(provider.cnpj)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Profissional autônomo verificado pelo catálogo.
                    </p>
                  )}

                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span>Visualizações do perfil</span>
                    <span className="font-bold text-slate-800">{provider.viewsCount} acessos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
