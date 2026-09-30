'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, PlusCircle, Search } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-amber-200/80 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">Guia Síndico</span>
                <span className="text-xl font-black tracking-tight text-amber-600">Né!</span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 -mt-1">
                Guia de Prestadores de Serviços
              </p>
            </div>
          </Link>

          {/* Links e Ações */}
          <div className="flex items-center gap-3">
            <Link
              href="/#categorias"
              className="hidden md:inline-flex text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50"
            >
              Categorias
            </Link>
            <Link
              href="/#prestadores"
              className="hidden md:inline-flex text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50"
            >
              Todos os Profissionais
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden md:block"></div>

            {/* Link para o Painel Admin */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all border border-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Painel Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
