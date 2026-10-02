import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/authConstants';

export { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS };

const MIN_SECRET_LENGTH = 32;

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  /** Deve coincidir com users.sessionVersion */
  sv: number;
}

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

async function extractToken(req?: Request): Promise<string | null> {
  if (req) {
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
      }
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
      if (match?.[1]) return decodeURIComponent(match[1]);
    } catch {
      /* ignore */
    }
  }

  try {
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
  } catch {
    /* ignore */
  }

  try {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

/**
 * Retorna o usuário da sessão se o JWT for válido e sessionVersion coincidir.
 * Import dinâmico do prisma evita ciclo em edge/middleware.
 */
export async function getSessionUser(req?: Request): Promise<TokenPayload | null> {
  const token = await extractToken(req);
  if (!token) return null;

  const verified = verifyToken(token);
  if (!verified?.userId) return null;

  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: { id: true, email: true, name: true, role: true, sessionVersion: true },
    });
    if (!user) return null;

    const currentSv = (user as { sessionVersion?: number }).sessionVersion ?? 0;
    const tokenSv = verified.sv ?? 0;
    if (tokenSv !== currentSv) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sv: currentSv,
    };
  } catch {
    // Fallback: se o campo ainda não existir no mock antigo, aceita JWT sem checar sv
    if (verified.sv === undefined) {
      return { ...verified, sv: 0 };
    }
    return verified;
  }
}

export const FORBIDDEN_PASSWORDS = ['admin123', 'password', '12345678', 'senha123456'];

export function validateNewPassword(
  newPassword: string,
  currentPassword?: string
): { ok: true } | { ok: false; error: string } {
  if (!newPassword || newPassword.length < 12) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 12 caracteres.' };
  }
  if (currentPassword && newPassword === currentPassword) {
    return { ok: false, error: 'A nova senha não pode ser igual à senha atual.' };
  }
  if (FORBIDDEN_PASSWORDS.includes(newPassword.toLowerCase())) {
    return { ok: false, error: 'Essa senha é muito fraca ou proibida.' };
  }
  return { ok: true };
}
