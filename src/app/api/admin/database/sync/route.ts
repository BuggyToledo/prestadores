import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getMockDatabase } from '@/lib/prisma';
import { parseDatabaseUrl, syncDatabaseToMySql } from '@/lib/mysqlHelper';
import { assertMirrorDeleteAllowed, assertNotProductionDatabase } from '@/lib/dbSafety';
import mysql from 'mysql2/promise';

/**
 * Sync mock → MySQL (upsert).
 * Delete espelhado NÃO roda por padrão. Exige body.confirmMirrorDelete=true
 * e contagens compatíveis — e nunca aponta para host de produção.
 */
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL não configurada no arquivo .env.' },
        { status: 400 }
      );
    }

    try {
      assertNotProductionDatabase(dbUrl);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Host de produção bloqueado.';
      return NextResponse.json({ error: message }, { status: 403 });
    }

    let body: { confirmMirrorDelete?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro de conexão';
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : undefined;
      return NextResponse.json(
        {
          error: `Não foi possível conectar ao MySQL para sincronizar: ${message}`,
          code,
        },
        { status: 500 }
      );
    }

    try {
      // Contagem no MySQL para bloquear mirror-delete perigoso
      const [countRows] = await connection.query<any[]>('SELECT COUNT(*) AS c FROM providers');
      const mysqlProviderCount = Number(countRows?.[0]?.c || 0);

      if (body.confirmMirrorDelete) {
        try {
          assertMirrorDeleteAllowed({
            confirmMirrorDelete: true,
            mockProviderCount: localDb.providers.length,
            mysqlProviderCount,
          });
        } catch (e: unknown) {
          await connection.end();
          const message = e instanceof Error ? e.message : 'Mirror-delete bloqueado.';
          return NextResponse.json({ error: message }, { status: 400 });
        }
        // Mirror-delete ainda não implementado neste branch — confirmação só prepara o caminho.
        // Mantemos bloqueio explícito até existir implementação segura.
        await connection.end();
        return NextResponse.json(
          {
            error:
              'Mirror-delete está desabilitado neste release. Use sync upsert (sem confirmMirrorDelete) ou um script dedicado de limpeza em banco de teste.',
          },
          { status: 400 }
        );
      }

      const stats = await syncDatabaseToMySql(connection, localDb);
      await connection.end();

      return NextResponse.json({
        success: true,
        message:
          'Dados sincronizados (upsert) para o MySQL. Nenhum delete espelhado foi executado.',
        stats,
        mirrorDelete: false,
      });
    } catch (syncErr: unknown) {
      if (connection) {
        try {
          await connection.end();
        } catch {
          /* ignore */
        }
      }
      throw syncErr;
    }
  } catch (error: unknown) {
    console.error('Erro ao sincronizar banco:', error);
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar banco.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
