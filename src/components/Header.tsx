'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutGrid, Landmark, Search } from 'lucide-react';

/** Navbar pública — sem link de admin (fica no Footer). Oculta em /admin. */
export function Header() {
  const pathname = usePathname() || '/';
  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border/80 bg-brand-card/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex min-h-touch items-center gap-2.5 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-amber text-brand-navy shadow-card transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5 stroke-[2.2]" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight text-brand-navy">
              Guia Síndico <span className="text-brand-amber-dark">Né!</span>
            </p>
            <p className="hidden text-[10px] font-bold uppercase tracking-wider text-brand-muted sm:block">
              Prestadores para síndicos
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação desktop">
          <Link
            href="/#categorias"
            className="inline-flex min-h-touch items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-brand-navy-mid hover:bg-brand-amber-light hover:text-brand-navy"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Categorias
          </Link>
          <Link
            href="/?focus=busca"
            className="inline-flex min-h-touch items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-brand-navy-mid hover:bg-brand-amber-light hover:text-brand-navy"
          >
            <Search className="h-4 w-4" aria-hidden />
            Buscar
          </Link>
          <Link
            href="/utilidade-publica"
            className="inline-flex min-h-touch items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-brand-navy-mid hover:bg-brand-amber-light hover:text-brand-navy"
          >
            <Landmark className="h-4 w-4" aria-hidden />
            Utilidade pública
          </Link>
        </nav>
      </div>
    </header>
  );
}
