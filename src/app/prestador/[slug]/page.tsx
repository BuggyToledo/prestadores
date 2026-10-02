import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ProviderAvatar } from '@/components/ProviderAvatar';
import { TrustBadge } from '@/components/TrustBadge';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PhoneButton } from '@/components/PhoneButton';
import {
  formatPhone,
  formatCNPJ,
  formatCEP,
} from '@/lib/utils';
import {
  buildMapsSearchUrl,
  isSafeHttpUrl,
  providerDisplayName,
} from '@/lib/design';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Globe,
  Instagram,
  Building2,
  CheckCircle2,
  Clock,
  Receipt,
  ExternalLink,
  Star,
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

  try {
    await prisma.provider.update({
      where: { id: provider.id },
      data: { viewsCount: { increment: 1 } },
    });
  } catch {
    // ignore
  }

  const p = provider as typeof provider & {
    displayName?: string | null;
    trustTier?: string | null;
    serves24h?: boolean;
    issuesNfe?: boolean;
    coverUrl?: string | null;
  };

  const displayName = providerDisplayName(p);
  const trustTier = p.trustTier || 'cadastrado';
  const serves24h = Boolean(p.serves24h);
  const issuesNfe = Boolean(p.issuesNfe);

  const parsedServices = provider.services
    ? provider.services
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const addressLine = [
    provider.address,
    provider.neighborhood,
    [provider.city, provider.state].filter(Boolean).join(' - '),
    provider.zipCode ? `CEP ${formatCEP(provider.zipCode)}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const mapsUrl = buildMapsSearchUrl([
    provider.address,
    provider.neighborhood,
    provider.city,
    provider.state,
    provider.zipCode,
  ]);

  const rawWebsite = (provider.website || '').trim();
  let websiteUrl: string | null = null;
  if (rawWebsite) {
    if (isSafeHttpUrl(rawWebsite)) websiteUrl = rawWebsite;
    else if (isSafeHttpUrl(`https://${rawWebsite}`)) websiteUrl = `https://${rawWebsite}`;
  }

  const rawIg = (provider.instagram || '').trim();
  let instagramHref: string | null = null;
  if (rawIg) {
    if (rawIg.startsWith('http')) {
      instagramHref = isSafeHttpUrl(rawIg) ? rawIg : null;
    } else {
      instagramHref = `https://instagram.com/${rawIg.replace(/^@/, '')}`;
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="mx-auto max-w-shell px-4 pb-28 pt-4 sm:px-6 sm:pb-12 sm:pt-8">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={`/categoria/${provider.category.slug}`}
            className="inline-flex min-h-touch items-center gap-2 rounded-full px-2 text-sm font-semibold text-brand-navy-mid hover:bg-brand-amber-light hover:text-brand-navy"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <Link
            href={`/categoria/${provider.category.slug}`}
            className="inline-flex min-h-touch items-center gap-1.5 rounded-control bg-brand-amber-light px-3 text-xs font-bold text-brand-navy"
          >
            <CategoryIcon name={provider.category.icon} className="h-3.5 w-3.5" aria-hidden />
            {provider.category.name}
          </Link>
        </div>

        {/* Cover */}
        <div className="relative mb-6 overflow-hidden rounded-card border border-brand-border bg-brand-navy-mid shadow-card aspect-[2.5/1] md:aspect-[4/1]">
          {p.coverUrl ? (
            <Image
              src={p.coverUrl}
              alt={`Capa de ${displayName}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
              unoptimized={p.coverUrl.startsWith('data:')}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-mid to-brand-amber/40" />
          )}
          {provider.isFeatured ? (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-navy/85 px-3 py-1.5 text-xs font-bold text-brand-amber">
              <Star className="h-3.5 w-3.5 fill-brand-amber" aria-hidden />
              Destaque
            </div>
          ) : null}
        </div>

        {/* Identity */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end">
          <ProviderAvatar
            name={provider.name}
            displayName={p.displayName}
            logoUrl={provider.logoUrl}
            categoryName={provider.category.name}
            categoryIcon={provider.category.icon}
            size="lg"
            className="-mt-14 border-4 border-brand-card sm:-mt-16"
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TrustBadge trustTier={trustTier} />
              {serves24h ? (
                <span className="inline-flex min-h-touch items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Atende 24h
                </span>
              ) : null}
              {issuesNfe ? (
                <span className="inline-flex min-h-touch items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-brand-navy">
                  <Receipt className="h-3.5 w-3.5" aria-hidden />
                  Emite NF-e
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
              {displayName}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-amber-light px-2.5 py-1 text-xs font-bold text-brand-amber-dark">
                {provider.category.name}
              </span>
              {provider.subcategory ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-brand-navy-mid">
                  {provider.subcategory.name}
                </span>
              ) : null}
            </div>
            {(provider.neighborhood || provider.city) && (
              <p className="flex items-start gap-1.5 text-sm text-brand-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {[provider.neighborhood, `${provider.city} - ${provider.state}`]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </p>
            )}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden flex-col gap-2 sm:flex sm:min-w-[200px]">
            <WhatsAppButton whatsapp={provider.whatsapp} providerName={displayName} />
            <PhoneButton phone={provider.phone} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Sobre — só se houver descrição */}
            {provider.description?.trim() ? (
              <section className="rounded-card border border-brand-border bg-brand-card p-5 shadow-card sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-navy">
                  <Building2 className="h-5 w-5 text-brand-amber-dark" aria-hidden />
                  Sobre
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-navy-mid sm:text-base">
                  {provider.description}
                </p>
              </section>
            ) : null}

            {parsedServices.length > 0 ? (
              <section className="rounded-card border border-brand-border bg-brand-card p-5 shadow-card sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-navy">
                  <CheckCircle2 className="h-5 w-5 text-brand-green" aria-hidden />
                  Serviços
                </h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {parsedServices.map((service) => (
                    <li
                      key={service}
                      className="flex items-center gap-2 rounded-control border border-brand-border bg-brand-surface px-3 py-2.5 text-sm font-medium text-brand-navy"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" aria-hidden />
                      {service}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Localização — sem mapa embutido */}
            {(addressLine || mapsUrl) && (
              <section className="rounded-card border border-brand-border bg-brand-card p-5 shadow-card sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-navy">
                  <MapPin className="h-5 w-5 text-brand-amber-dark" aria-hidden />
                  Localização
                </h2>
                {addressLine ? (
                  <p className="mb-4 text-sm font-medium text-brand-navy-mid">{addressLine}</p>
                ) : null}
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-control bg-brand-navy px-4 text-sm font-bold text-white hover:bg-brand-navy-mid sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Ver no Google Maps
                  </a>
                ) : null}
              </section>
            )}
          </div>

          {/* Sidebar contatos */}
          <aside className="space-y-4">
            <div className="rounded-card border border-brand-border bg-brand-card p-5 shadow-card">
              <h3 className="mb-4 border-b border-brand-border pb-2 text-xs font-bold uppercase tracking-wider text-brand-navy">
                Contato
              </h3>
              <div className="space-y-4">
                {provider.whatsapp ? (
                  <div>
                    <p className="text-xs text-brand-muted">WhatsApp</p>
                    <p className="text-sm font-bold text-brand-navy">
                      {formatPhone(provider.whatsapp)}
                    </p>
                  </div>
                ) : null}
                {provider.phone ? (
                  <div>
                    <p className="text-xs text-brand-muted">Telefone</p>
                    <p className="text-sm font-bold text-brand-navy">
                      {formatPhone(provider.phone)}
                    </p>
                  </div>
                ) : null}
                {provider.email ? (
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 text-brand-muted" aria-hidden />
                    <a
                      href={`mailto:${provider.email}`}
                      className="break-all text-sm font-semibold text-brand-navy hover:text-brand-amber-dark"
                    >
                      {provider.email}
                    </a>
                  </div>
                ) : null}
                {websiteUrl ? (
                  <div className="flex items-start gap-2">
                    <Globe className="mt-0.5 h-4 w-4 text-brand-muted" aria-hidden />
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-brand-navy hover:text-brand-amber-dark"
                    >
                      Visitar site
                    </a>
                  </div>
                ) : null}
                {instagramHref ? (
                  <div className="flex items-start gap-2">
                    <Instagram className="mt-0.5 h-4 w-4 text-brand-muted" aria-hidden />
                    <a
                      href={instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-brand-navy hover:text-brand-amber-dark"
                    >
                      Instagram
                    </a>
                  </div>
                ) : null}
                {!provider.whatsapp &&
                !provider.phone &&
                !provider.email &&
                !websiteUrl &&
                !instagramHref ? (
                  <p className="text-sm text-brand-muted">Nenhum canal de contato informado.</p>
                ) : null}
              </div>
            </div>

            {provider.cnpj ? (
              <div className="rounded-card border border-brand-amber/30 bg-brand-amber-light/50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-navy">CNPJ / CPF</p>
                <p className="mt-1 font-mono text-sm font-bold text-brand-navy">
                  {formatCNPJ(provider.cnpj)}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {/* Sticky mobile CTAs */}
      {(provider.whatsapp || provider.phone) && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-brand-border bg-brand-card/95 p-3 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-shell gap-2">
            <WhatsAppButton
              whatsapp={provider.whatsapp}
              providerName={displayName}
              className="flex-1"
            />
            <PhoneButton phone={provider.phone} compact className="shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
