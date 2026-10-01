import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getMockDatabase } from '@/lib/prisma';
import { generateSqlDump } from '@/lib/mysqlHelper';

export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const localDb = getMockDatabase();
    const sqlContent = generateSqlDump(localDb);

    return new NextResponse(sqlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': 'attachment; filename="catalogo_servicos_backup.sql"',
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar exportação SQL:', error);
    return NextResponse.json({ error: 'Erro ao gerar script SQL.' }, { status: 500 });
  }
}
