import React from 'react';
import Link from 'next/link';
import { BookOpen, Phone, Mail, Shield, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Coluna 1: Sobre */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Páginas<span className="text-amber-400">Amarelas</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              O catálogo digital completo para você encontrar prestadores de serviços de confiança na sua região. Eletricistas, encanadores, pintores, marcenarias e muito mais.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 p-3 rounded-lg max-w-md border border-slate-700/50">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Plataforma segura com moderação e verificação de prestadores.</span>
            </div>
          </div>

          {/* Coluna 2: Acesso Rápido */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
              Navegação
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Início / Buscar
                </Link>
              </li>
              <li>
                <Link href="/#categorias" className="hover:text-white transition-colors">
                  Categorias de Serviços
                </Link>
              </li>
              <li>
                <Link href="/#prestadores" className="hover:text-white transition-colors">
                  Destaques da Região
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 font-medium">
                  Área do Administrador
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato e Suporte */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
              Informações
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Atendimento ao Cliente</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>contato@catalogo.com.br</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} Páginas Amarelas - Catálogo de Prestadores de Serviços. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> para conectar profissionais e clientes
          </p>
        </div>
      </div>
    </footer>
  );
}
