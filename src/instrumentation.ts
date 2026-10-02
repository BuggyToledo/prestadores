/**
 * Garante falha cedo se JWT_SECRET estiver ausente em runtime.
 * Não bloqueia a fase de build do Next.js.
 */
export async function register() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret || secret.length < 32) {
      throw new Error(
        '[instrumentation] JWT_SECRET é obrigatória (mín. 32 caracteres). Defina nas variáveis de ambiente.'
      );
    }
  }
}
