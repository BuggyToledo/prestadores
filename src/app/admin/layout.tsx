'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderTree,
  UserPlus,
  LogOut,
  BookOpen,
  ExternalLink,
  Menu,
  X,
  Shield,
  Image as ImageIcon,
  Database,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(!isLoginPage);

  useEffect(() => {
    if (!isLoginPage) {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      fetch('/api/auth/me', { headers })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Não autenticado');
          }
          return res.json();
        })
        .then((data) => {
          if (data?.user) {
            setAdminUser(data.user);
            setCheckingAuth(false);
          } else {
            throw new Error('Sem usuário na sessão');
          }
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.href = `/admin/login?from=${encodeURIComponent(pathname)}`;
          }
        });
    }
  }, [isLoginPage, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        document.cookie = 'admin_session_token=; path=/; max-age=0; SameSite=None; Secure';
        window.location.href = '/admin/login';
      }
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Carregando painel administrativo...</p>
      </div>
    );
  }

  const navItems = [
    {
      name: 'Visão Geral',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      name: 'Prestadores de Serviços',
      href: '/admin/prestadores',
      icon: Users,
      active: pathname.startsWith('/admin/prestadores') && pathname !== '/admin/prestadores/novo',
    },
    {
      name: 'Cadastrar Prestador',
      href: '/admin/prestadores/novo',
      icon: UserPlus,
      active: pathname === '/admin/prestadores/novo',
    },
    {
      name: 'Categorias de Serviços',
      href: '/admin/categorias',
      icon: FolderTree,
      active: pathname.startsWith('/admin/categorias'),
    },
    {
      name: 'Banners de Propaganda',
      href: '/admin/banners',
      icon: ImageIcon,
      active: pathname.startsWith('/admin/banners'),
    },
    {
      name: 'Banco de Dados & MySQL',
      href: '/admin/banco',
      icon: Database,
      active: pathname.startsWith('/admin/banco'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-black text-sm tracking-tight">Admin Guia Síndico Né!</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Desktop e Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Header da Sidebar */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md">
                <BookOpen className="w-5 h-5 font-black" />
              </div>
              <div>
                <span className="font-black text-base text-white tracking-tight block">
                  Guia Síndico <span className="text-amber-400">Né!</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Painel Administrativo
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links de Navegação */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Menu Principal
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    item.active
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar com usuário e logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          {/* Link para o Catálogo Público */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-amber-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Catálogo no Ar</span>
            </span>
          </Link>

          {/* Dados do Usuário */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{adminUser?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{adminUser?.email || 'admin@catalogo.com'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sair do painel"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
