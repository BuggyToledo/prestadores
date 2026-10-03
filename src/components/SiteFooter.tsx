'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/** Oculta rodapé público nas rotas /admin. */
export function SiteFooter() {
  const pathname = usePathname() || '/';
  if (pathname.startsWith('/admin')) return null;
  return <Footer />;
}
