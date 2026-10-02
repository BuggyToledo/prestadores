import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { BottomNav } from '@/components/BottomNav';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Guia Síndico Né! | Catálogo de Prestadores de Serviços',
  description:
    'Encontre prestadores de serviços cadastrados para o seu condomínio: manutenção, obras, limpeza, segurança e utilidade pública.',
  keywords:
    'guia síndico né, catálogo de serviços, síndico, condomínio, eletricista, encanador, prestadores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={plusJakarta.variable}>
      <body className="flex min-h-screen flex-col bg-brand-surface font-sans text-brand-navy">
        <Header />
        <main className="flex-1 pb-nav">{children}</main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
