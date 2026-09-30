import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Star,
  Building2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { formatPhone, formatCNPJ, getWhatsAppLink } from '@/lib/utils';

export interface ProviderItem {
  id: string;
  name: string;
  slug: string;
  cnpj?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city: string;
  state: string;
  zipCode?: string | null;
  description?: string | null;
  services?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  };
}

interface ProviderCardProps {
  provider: ProviderItem;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const whatsappUrl = provider.whatsapp
    ? getWhatsAppLink(provider.whatsapp, provider.name)
    : null;

  const parsedServices = provider.services
    ? provider.services.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden relative ${
        provider.isFeatured
          ? 'border-amber-400/90 shadow-md ring-1 ring-amber-400/40'
          : 'border-slate-200/90 shadow-sm hover:border-slate-300'
      }`}
    >
      {/* Badge de Destaque */}
      {provider.isFeatured && (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold px-3 py-1 flex items-center justify-center gap-1.5 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-slate-950" />
          <span>PRESTADOR EM DESTAQUE</span>
        </div>
      )}

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Cabeçalho do Card */}
        <div className="flex items-start gap-4 mb-3">
          {/* Logo / Foto */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt={provider.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-800">
                <CategoryIcon name={provider.category.icon} className="w-7 h-7" />
              </div>
            )}
          </div>

          {/* Info Principal */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/categoria/${provider.category.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-md transition-colors mb-1.5"
            >
              <CategoryIcon name={provider.category.icon} className="w-3 h-3" />
              <span>{provider.category.name}</span>
            </Link>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
              <Link href={`/prestador/${provider.slug}`}>{provider.name}</Link>
            </h3>

            {provider.cnpj && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>CNPJ: {formatCNPJ(provider.cnpj)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Localização */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3 bg-slate-50 py-1.5 px-2.5 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="line-clamp-1 font-medium">
            {provider.neighborhood ? `${provider.neighborhood}, ` : ''}
            {provider.city} - {provider.state}
          </span>
        </div>

        {/* Descrição Curta */}
        {provider.description && (
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {provider.description}
          </p>
        )}

        {/* Tags de Serviços */}
        {parsedServices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
            {parsedServices.map((service, index) => (
              <span
                key={index}
                className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/60"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                {service}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rodapé de Ações do Card */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Botão WhatsApp */}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm py-2 px-3 rounded-xl shadow-sm transition-all hover:shadow"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          ) : provider.phone ? (
            <a
              href={`tel:${provider.phone.replace(/\D/g, '')}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm py-2 px-3 rounded-xl transition-all"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>{formatPhone(provider.phone)}</span>
            </a>
          ) : null}

          {/* Botão Ligar Secundário se tiver ambos */}
          {whatsappUrl && provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/\D/g, '')}`}
              title={`Ligar para ${formatPhone(provider.phone)}`}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-4 h-4 text-slate-700" />
            </a>
          )}
        </div>

        {/* Link Ver Mais */}
        <Link
          href={`/prestador/${provider.slug}`}
          className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-700 hover:text-amber-600 px-2 py-1 transition-colors"
        >
          <span>Ver mais</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
