import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Páginas Amarelas | Catálogo de Prestadores de Serviços',
  description: 'Encontre eletricistas, encanadores, pintores, chaveiros e prestadores de serviços de confiança na sua região.',
  keywords: 'catálogo de serviços, páginas amarelas, eletricista, encanador, pintor, marcenaria, diarista, chaveiro',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
