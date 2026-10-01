import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getMockDatabase, isRealPrismaEnabled } from '@/lib/prisma';
import { testMySqlConnection, parseDatabaseUrl } from '@/lib/mysqlHelper';

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.cwd() === '/var/task'
  );
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testUrl = searchParams.get('url');

    const dbUrl = testUrl || process.env.DATABASE_URL || '';
    const parsedConfig = parseDatabaseUrl(dbUrl);

    // Testar conexão
    const testResult = await testMySqlConnection(parsedConfig);

    // Estatísticas locais
    const localDb = getMockDatabase();

    const useRealFlag = process.env.USE_REAL_PRISMA === 'true';
    const realPrismaActive = isRealPrismaEnabled();
    const serverless = isServerlessRuntime();

    let warning: string | undefined;
    if (serverless && !useRealFlag) {
      warning =
        'Você está na Vercel (filesystem somente leitura). Não dá para salvar .env por este painel. Em Settings → Environment Variables, defina DATABASE_URL e USE_REAL_PRISMA=true e faça Redeploy.';
    } else if (useRealFlag && !testResult.success) {
      warning =
        'USE_REAL_PRISMA=true, mas a conexão MySQL falhou. Cadastros e importações vão retornar erro até o MySQL ficar acessível.';
    } else if (!useRealFlag && testResult.success) {
      warning =
        'MySQL responde, porém USE_REAL_PRISMA não está true. Os dados estão no armazenamento local e NÃO são gravados no MySQL.';
    }

    return NextResponse.json({
      configured: Boolean(dbUrl),
      databaseUrl: dbUrl
        ? `${parsedConfig.user}@${parsedConfig.host}:${parsedConfig.port}/${parsedConfig.database}`
        : '',
      host: parsedConfig.host,
      port: parsedConfig.port,
      user: parsedConfig.user,
      database: parsedConfig.database,
      isRealPrismaActive: realPrismaActive,
      useRealPrismaEnv: useRealFlag,
      serverless,
      envWritable: !serverless,
      warning,
      connection: testResult,
      localStats: {
        providersCount: localDb.providers?.length || 0,
        categoriesCount: localDb.categories?.length || 0,
        subcategoriesCount: localDb.subcategories?.length || 0,
        bannersCount: localDb.banners?.length || 0,
        usersCount: localDb.users?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar status do banco:', error);
    return NextResponse.json({ error: error.message || 'Erro ao testar conexão com o banco.' }, { status: 500 });
  }
}
