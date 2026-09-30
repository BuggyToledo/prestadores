'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProviderForm } from '@/components/ProviderForm';
import { ProviderImport } from '@/components/ProviderImport';
import { ArrowLeft, UserPlus, Upload, FileEdit } from 'lucide-react';

export default function NewProviderPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');

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
            <UserPlus className="w-7 h-7 text-amber-500" />
            <span>Cadastrar Prestador de Serviços</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Escolha entre preencher o formulário manualmente ou importar vários profissionais de uma só vez através de planilha CSV.
          </p>
        </div>

        {/* Seletor de Abas */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-4 h-4 text-amber-500" />
            <span>Formulário Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Importar Planilha (CSV)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'manual' ? (
        <ProviderForm />
      ) : (
        <ProviderImport />
      )}
    </div>
  );
}

