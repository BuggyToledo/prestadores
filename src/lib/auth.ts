import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';

const TOKEN_COOKIE_NAME = 'admin_session_token';
const MIN_SECRET_LENGTH = 32;

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * JWT_SECRET é obrigatório. Sem fallback — falha explícita se ausente/fraco.
 */
export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET não configurada. Defina uma chave com pelo menos 32 caracteres nas variáveis de ambiente.'
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET muito curta (${secret.length} chars). Use pelo menos ${MIN_SECRET_LENGTH} caracteres.`
    );
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, requireJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: Request): Promise<TokenPayload | null> {
  // Prefer cookie httpOnly; Bearer opcional só para compatibilidade de ferramentas.
  if (req) {
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const verified = verifyToken(token);
        if (verified) return verified;
      }

      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE_NAME}=([^;]+)`));
      if (match?.[1]) {
        const verified = verifyToken(decodeURIComponent(match[1]));
        if (verified) return verified;
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const verified = verifyToken(token);
      if (verified) return verified;
    }
  } catch {
    /* ignore */
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (token) {
      const verified = verifyToken(token);
      if (verified) return verified;
    }
  } catch {
    /* ignore */
  }

  return null;
}

export const AUTH_COOKIE_NAME = TOKEN_COOKIE_NAME;

export const AUTH_COOKIE_OPTIONS = {
  name: TOKEN_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
};
