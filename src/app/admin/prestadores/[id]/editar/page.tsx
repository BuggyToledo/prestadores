import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProviderForm } from '@/components/ProviderForm';
import { ArrowLeft, Edit } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditProviderPage({ params }: PageProps) {
  const { id } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id },
  });

  if (!provider) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <Link
            href="/admin/prestadores"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para prestadores</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Edit className="w-7 h-7 text-amber-500" />
            <span>Editar Prestador: {provider.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atualize dados de contato, localização, descrição ou status do prestador.
          </p>
        </div>
      </div>

      {/* Formulário de Edição */}
      <ProviderForm initialData={provider} isEdit={true} />
    </div>
  );
}
