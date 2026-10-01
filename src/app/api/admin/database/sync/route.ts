import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getMockDatabase } from '@/lib/prisma';
import { parseDatabaseUrl, syncDatabaseToMySql } from '@/lib/mysqlHelper';
import { formatMySqlConnectionError } from '@/lib/mysqlConnectionError';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        {
          error:
            'DATABASE_URL não configurada. Na Vercel, defina DATABASE_URL e USE_REAL_PRISMA=true em Environment Variables e faça Redeploy.',
        },
        { status: 400 }
      );
    }

    const config = parseDatabaseUrl(dbUrl);
    const localDb = getMockDatabase();

    let connection: mysql.Connection | null = null;
    try {
      connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectTimeout: 8000,
      });
    } catch (err: any) {
      const formatted = formatMySqlConnectionError(err);
      return NextResponse.json(
        {
          error: formatted.error,
          code: formatted.code,
          clientIp: formatted.clientIp,
          hostDenied: formatted.hostDenied,
          providerHint: formatted.providerHint,
          allowableHostsToAdd: formatted.allowableHostsToAdd,
        },
        { status: 500 }
      );
    }

    try {
      const stats = await syncDatabaseToMySql(connection, localDb);
      await connection.end();

      return NextResponse.json({
        success: true,
        message: 'Dados sincronizados com sucesso para o banco de dados MySQL!',
        stats,
      });
    } catch (syncErr: any) {
      if (connection) {
        try {
          await connection.end();
        } catch {}
      }
      throw syncErr;
    }
  } catch (error: any) {
    console.error('Erro ao sincronizar banco:', error);
    return NextResponse.json({ error: error.message || 'Erro ao sincronizar banco.' }, { status: 500 });
  }
}
