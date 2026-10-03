'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Home, LayoutGrid, Search, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

function BottomNavInner() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();

  if (pathname.startsWith('/admin')) return null;

  const focusBusca =
    pathname === '/' &&
    (searchParams.get('focus') === 'busca' || Boolean(searchParams.get('q')));

  const items = [
    {
      href: '/',
      label: 'Início',
      icon: Home,
      active: pathname === '/' && !focusBusca,
    },
    {
      href: '/#categorias',
      label: 'Categorias',
      icon: LayoutGrid,
      active: pathname.startsWith('/categoria'),
    },
    {
      href: '/?focus=busca',
      label: 'Buscar',
      icon: Search,
      active: focusBusca,
    },
    {
      href: '/utilidade-publica',
      label: 'Utilidade',
      icon: Landmark,
      active: pathname.startsWith('/utilidade-publica'),
    },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-brand-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto grid max-w-shell grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex min-h-touch flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition-colors',
                  item.active
                    ? 'text-brand-amber-ink'
                    : 'text-brand-muted hover:text-brand-navy'
                )}
                aria-current={item.active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile only (&lt; md). Destinos reais — sem Favoritos/Orçamento. */
export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}
