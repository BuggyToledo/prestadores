import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { buildDatabaseUrl, parseDatabaseUrl, testMySqlConnection } from '@/lib/mysqlHelper';
import { reinitializePrismaClient } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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
      finalDatabaseUrl = buildDatabaseUrl({
        host: host.trim(),
        port: parseInt(port, 10) || 3306,
        user: user.trim(),
        password: password ?? '',
        database: database.trim(),
      });
    }

    // Testar a conexão
    const testResult = await testMySqlConnection(finalDatabaseUrl);

    // Atualizar o arquivo .env
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Atualizar DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${finalDatabaseUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${finalDatabaseUrl}"`;
    }

    // Atualizar USE_REAL_PRISMA
    const enableReal = useRealPrisma !== undefined ? Boolean(useRealPrisma) : testResult.success;
    if (envContent.includes('USE_REAL_PRISMA=')) {
      envContent = envContent.replace(/USE_REAL_PRISMA=.*/, `USE_REAL_PRISMA="${enableReal}"`);
    } else {
      envContent += `\nUSE_REAL_PRISMA="${enableReal}"`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
    process.env.DATABASE_URL = finalDatabaseUrl;
    process.env.USE_REAL_PRISMA = String(enableReal);

    // Recarrega o PrismaClient com a nova URL / flag (sem reiniciar o Node)
    const { active } = await reinitializePrismaClient();

    return NextResponse.json({
      success: true,
      connection: testResult,
      isRealPrismaActive: active,
      message: testResult.success
        ? enableReal
          ? 'Configuração salva. MySQL ativo — novos cadastros e importações serão gravados no banco.'
          : 'Configuração salva. MySQL conecta, mas USE_REAL_PRISMA está desligado — dados ficam só no armazenamento local.'
        : 'Configuração salva, mas o MySQL ainda não aceitou a conexão externa. Cadastros falharão até liberar o acesso.',
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração do banco:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar configuração.' }, { status: 500 });
  }
}
