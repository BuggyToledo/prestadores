import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProviderCard } from '@/components/ProviderCard';
import { Landmark } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Lista órgãos / utilidade pública (kind = utilidade_publica).
 * Efeito completo após clean-data --apply no banco *_teste com kind preenchido.
 */
export default async function UtilidadePublicaPage() {
  let providers: Awaited<ReturnType<typeof prisma.provider.findMany>> = [];

  try {
    providers = await prisma.provider.findMany({
      where: {
        isActive: true,
        // Campo aditivo — em bases sem clean-data pode vir vazio/default
        kind: 'utilidade_publica',
      } as never,
      include: { category: true, subcategory: true },
      orderBy: [{ name: 'asc' }],
      take: 48,
    });
  } catch {
    providers = [];
  }

  return (
    <div className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-card bg-brand-amber-light text-brand-amber-dark">
          <Landmark className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
            Utilidade pública
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-muted">
            Órgãos, ouvidorias e serviços de utilidade pública cadastrados no guia.
            {!providers.length
              ? ' Nenhum registro com kind = utilidade_publica ainda — rode o clean-data no banco *_teste para classificar.'
              : null}
          </p>
        </div>
      </div>

      {providers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider as never} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-brand-border bg-brand-card p-10 text-center">
          <p className="text-sm text-brand-muted">Nenhum resultado por enquanto.</p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-touch items-center justify-center rounded-control bg-brand-amber px-4 text-sm font-bold text-brand-navy"
          >
            Voltar ao início
          </Link>
        </div>
      )}
    </div>
  );
}
