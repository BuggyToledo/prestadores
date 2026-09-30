import { NextResponse } from 'next/server';
import { AUTH_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logout realizado com sucesso.' });
  response.cookies.set(AUTH_COOKIE_OPTIONS.name, '', {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
