import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

function getJwtSecretKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  const key = getJwtSecretKey();
  if (!key) return false;
  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

/** Rotas de API públicas (escrita sem auth). */
function isPublicWriteApi(pathname: string, method: string): boolean {
  if (method === 'POST' && pathname === '/api/auth/login') return true;
  if (method === 'POST' && pathname === '/api/auth/logout') return true;
  if (method === 'POST' && /^\/api\/banners\/[^/]+\/click$/.test(pathname)) return true;
  if (method === 'POST' && /^\/api\/providers\/[^/]+\/view$/.test(pathname)) return true;
  return false;
}

function isWriteMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function isProtectedApiWrite(pathname: string, method: string): boolean {
  if (!pathname.startsWith('/api/')) return false;
  if (!isWriteMethod(method)) return false;
  if (isPublicWriteApi(pathname, method)) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // JWT_SECRET obrigatório em runtime para rotas protegidas
  if (!process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET.trim().length < 32) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Servidor mal configurado: JWT_SECRET ausente ou inválida.' },
        { status: 500 }
      );
    }
  }

  // Login: se já autenticado, vai ao dashboard
  if (pathname === '/admin/login') {
    if (await hasValidSession(request)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Páginas /admin/* exigem sessão válida
  if (pathname.startsWith('/admin')) {
    if (!(await hasValidSession(request))) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // APIs de escrita exigem sessão
  if (isProtectedApiWrite(pathname, method)) {
    if (!(await hasValidSession(request))) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
