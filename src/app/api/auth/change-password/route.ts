import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AUTH_COOKIE_OPTIONS,
  comparePassword,
  generateToken,
  getSessionUser,
  hashPassword,
  validateNewPassword,
} from '@/lib/auth';

function clientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    const validation = validateNewPassword(newPassword, currentPassword);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const match = await comparePassword(currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    const currentSv = (user as { sessionVersion?: number }).sessionVersion ?? 0;
    const nextSv = currentSv + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        sessionVersion: nextSv,
      } as never,
    });

    try {
      await (
        prisma as unknown as {
          auditLog: {
            create: (args: {
              data: {
                userId: string;
                action: string;
                details: string;
                ip: string;
              };
            }) => Promise<unknown>;
          };
        }
      ).auditLog.create({
        data: {
          userId: user.id,
          action: 'password_change',
          details: JSON.stringify({ email: user.email, sessionVersion: nextSv }),
          ip: clientIp(request),
        },
      });
    } catch (e) {
      console.warn('Audit log falhou (não bloqueante):', e);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sv: nextSv,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso. Sessões anteriores foram invalidadas.',
    });
    response.cookies.set(AUTH_COOKIE_OPTIONS.name, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ error: 'Erro ao alterar senha.' }, { status: 500 });
  }
}
