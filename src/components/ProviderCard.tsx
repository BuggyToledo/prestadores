import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Receipt, Star } from 'lucide-react';
import { ProviderAvatar } from '@/components/ProviderAvatar';
import { TrustBadge } from '@/components/TrustBadge';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PhoneButton } from '@/components/PhoneButton';
import { providerDisplayName } from '@/lib/design';
import { cn } from '@/lib/utils';

export interface ProviderItem {
  id: string;
  name: string;
  slug: string;
  displayName?: string | null;
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
  serves24h?: boolean;
  issuesNfe?: boolean;
  trustTier?: string | null;
  kind?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ProviderCardProps {
  provider: ProviderItem;
  /** Home: avatar só com iniciais (sem foto), conforme brief. */
  forceInitials?: boolean;
  className?: string;
}

export function ProviderCard({ provider, forceInitials = false, className }: ProviderCardProps) {
  const displayName = providerDisplayName(provider);
  const location = [provider.neighborhood, provider.city].filter(Boolean).join(', ');
  const serves24h = Boolean(provider.serves24h);
  const issuesNfe = Boolean(provider.issuesNfe);

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-card border border-brand-border bg-brand-card shadow-card transition-shadow hover:shadow-lift',
        provider.isFeatured && 'ring-1 ring-brand-amber/50',
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ProviderAvatar
            name={provider.name}
            displayName={provider.displayName}
            logoUrl={forceInitials ? null : provider.logoUrl}
            categoryName={provider.category.name}
            categoryIcon={provider.category.icon}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              {provider.isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy">
                  <Star className="h-3 w-3 fill-brand-navy" aria-hidden />
                  Destaque
                </span>
              ) : null}
              {serves24h ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <Clock className="h-3 w-3" aria-hidden />
                  Atende 24h
                </span>
              ) : null}
              {issuesNfe ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-brand-navy">
                  <Receipt className="h-3 w-3" aria-hidden />
                  Emite NF-e
                </span>
              ) : null}
              <TrustBadge trustTier={provider.trustTier} className="!min-h-0 py-0.5 text-[10px]" />
            </div>
            <h3 className="text-base font-bold leading-snug text-brand-navy">
              <Link
                href={`/prestador/${provider.slug}`}
                className="hover:text-brand-amber-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
              >
                {displayName}
              </Link>
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-brand-amber-dark">
              {provider.category.name}
            </p>
          </div>
        </div>

        {location ? (
          <p className="flex items-center gap-1.5 text-xs text-brand-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-amber-dark" aria-hidden />
            <span className="line-clamp-1 font-medium">{location}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-brand-border bg-brand-surface/80 p-3 sm:p-4">
        <WhatsAppButton
          whatsapp={provider.whatsapp}
          providerName={displayName}
          className="w-full"
        />
        {!provider.whatsapp && provider.phone ? (
          <PhoneButton phone={provider.phone} className="w-full" />
        ) : null}
        <Link
          href={`/prestador/${provider.slug}`}
          className="inline-flex min-h-touch items-center justify-center text-xs font-bold text-brand-navy-mid hover:text-brand-amber-dark"
        >
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
