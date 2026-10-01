import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { buildDatabaseUrl, testMySqlConnection } from '@/lib/mysqlHelper';
import { reinitializePrismaClient } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.cwd() === '/var/task'
  );
}

function tryPersistEnvFile(databaseUrl: string, enableReal: boolean): {
  persisted: boolean;
  reason?: string;
} {
  // Em Vercel/Lambda o filesystem de /var/task é somente leitura
  if (isServerlessRuntime()) {
    return {
      persisted: false,
      reason:
        'Ambiente serverless (ex.: Vercel): o arquivo .env não pode ser gravado. Configure DATABASE_URL e USE_REAL_PRISMA no painel da hospedagem.',
    };
  }

  const envPath = path.join(process.cwd(), '.env');

  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${databaseUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${databaseUrl}"`;
    }

    if (envContent.includes('USE_REAL_PRISMA=')) {
      envContent = envContent.replace(/USE_REAL_PRISMA=.*/, `USE_REAL_PRISMA="${enableReal}"`);
    } else {
      envContent += `\nUSE_REAL_PRISMA="${enableReal}"`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
    return { persisted: true };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return {
        persisted: false,
        reason:
          'Sistema de arquivos somente leitura. Defina DATABASE_URL e USE_REAL_PRISMA=true nas variáveis de ambiente da hospedagem (Vercel → Settings → Environment Variables) e faça um novo deploy.',
      };
    }
    throw err;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, user, password, database, databaseUrl, useRealPrisma } = body;

    let finalDatabaseUrl = '';
    if (databaseUrl && databaseUrl.trim()) {
      finalDatabaseUrl = databaseUrl.trim();
    } else {
      if (!host || !user || !database) {
        return NextResponse.json(
          { error: 'Host, Usuário e Nome do Banco de Dados são obrigatórios.' },
          { status: 400 }
        );
      }

      // Senha vazia no formulário NÃO pode apagar a senha já configurada na Vercel
      let resolvedPassword = typeof password === 'string' ? password : '';
      if (!resolvedPassword && process.env.DATABASE_URL) {
        try {
          const existing = new URL(process.env.DATABASE_URL);
          resolvedPassword = decodeURIComponent(existing.password || '');
        } catch {
          /* ignore */
        }
      }

      finalDatabaseUrl = buildDatabaseUrl({
        host: host.trim(),
        port: parseInt(port, 10) || 3306,
        user: user.trim(),
        password: resolvedPassword,
        database: database.trim(),
      });
    }

    // Testar a conexão
    const testResult = await testMySqlConnection(finalDatabaseUrl);
    const enableReal = useRealPrisma !== undefined ? Boolean(useRealPrisma) : testResult.success;

    // Tenta gravar .env (só funciona em VPS/local; na Vercel falha com EROFS)
    const persist = tryPersistEnvFile(finalDatabaseUrl, enableReal);

    // Aplica na memória desta instância para o Prisma usar agora
    process.env.DATABASE_URL = finalDatabaseUrl;
    process.env.USE_REAL_PRISMA = String(enableReal);

    const { active } = await reinitializePrismaClient();

    const parsed = finalDatabaseUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');

    let message = '';
    if (!persist.persisted) {
      message =
        `${persist.reason} ` +
        `Conexão testada${testResult.success ? ' com sucesso' : ' (falhou)'}. ` +
        `Nesta sessão o MySQL ${active ? 'já está ativo' : 'não foi ativado'}, mas após um novo cold start a config some se não estiver nas Environment Variables. ` +
        `Variáveis necessárias: DATABASE_URL="${parsed}" e USE_REAL_PRISMA="${enableReal}".`;
    } else if (testResult.success) {
      message = enableReal
        ? 'Configuração salva no .env. MySQL ativo — novos cadastros e importações serão gravados no banco.'
        : 'Configuração salva. MySQL conecta, mas USE_REAL_PRISMA está desligado — dados ficam só no armazenamento local.';
    } else {
      message =
        'Configuração salva no .env, mas o MySQL ainda não aceitou a conexão externa. Cadastros falharão até liberar o acesso.';
    }

    return NextResponse.json({
      success: true,
      connection: testResult,
      isRealPrismaActive: active,
      envPersisted: persist.persisted,
      serverless: isServerlessRuntime(),
      message,
      requiredEnvVars: persist.persisted
        ? undefined
        : {
            DATABASE_URL: parsed,
            USE_REAL_PRISMA: String(enableReal),
          },
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração do banco:', error);
    const code = error?.code || '';
    if (code === 'EROFS' || String(error?.message || '').includes('EROFS')) {
      return NextResponse.json(
        {
          error:
            'EROFS: filesystem somente leitura (Vercel). Não é possível gravar o arquivo .env. Configure DATABASE_URL e USE_REAL_PRISMA=true em Settings → Environment Variables na Vercel e faça Redeploy.',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message || 'Erro ao salvar configuração.' }, { status: 500 });
  }
}
