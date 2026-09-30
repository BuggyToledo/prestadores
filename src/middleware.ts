import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se o usuário já estiver logado via cookie e acessar o login, redireciona para o dashboard
  if (pathname === '/admin/login') {
    const token = request.cookies.get('admin_session_token')?.value;
    if (token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

