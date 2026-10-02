import Link from 'next/link';
import { BookOpen, Heart, Mail, Phone, Shield } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-navy-mid bg-brand-navy text-slate-300">
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-amber text-brand-navy">
                <BookOpen className="h-5 w-5" aria-hidden />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Guia Síndico <span className="text-brand-amber">Né!</span>
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Catálogo de prestadores de serviços para síndicos e gestores de condomínio.
              Encontre profissionais cadastrados na sua região.
            </p>
            <div className="flex max-w-md items-start gap-2 rounded-control border border-slate-700/60 bg-brand-navy-mid/80 p-3 text-xs text-slate-400">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" aria-hidden />
              <span>Plataforma com moderação de cadastros. Selos Oficial/Documentado só quando aplicáveis.</span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-brand-amber">
              Navegação
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/#categorias" className="hover:text-white">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/utilidade-publica" className="hover:text-white">
                  Utilidade pública
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-brand-amber">
              Contato
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-amber" aria-hidden />
                <a
                  href="https://wa.me/5521978788211"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-amber"
                >
                  (21) 97878-8211
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-amber" aria-hidden />
                <a href="mailto:contato@sindicone.com.br" className="hover:text-brand-amber">
                  contato@sindicone.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 py-6 text-center sm:flex-row sm:text-left">
          <p className="max-w-3xl text-xs leading-relaxed text-slate-400 sm:text-sm">
            Mais do que reunir empresas, o{' '}
            <a
              href="https://www.icone-rio.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-amber underline underline-offset-2 hover:text-brand-amber-light"
            >
              Grupo Ícone‑Rio
            </a>{' '}
            desenvolve negócios com foco, autonomia e visão de longo prazo.
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-center text-xs text-slate-500 sm:flex-row">
          <p>© {currentYear} Guia Síndico Né!. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Feito com <Heart className="inline h-3.5 w-3.5 fill-red-500 text-red-500" aria-hidden />{' '}
            para síndicos
          </p>
          {/* Link discreto de admin — só no rodapé */}
          <Link
            href="/admin"
            className="text-[11px] text-slate-600 underline-offset-2 hover:text-slate-400 hover:underline"
          >
            Administração
          </Link>
        </div>
      </div>
    </footer>
  );
}
