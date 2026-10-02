/**
 * Segurança de conexão com banco.
 * Scripts que escrevem no banco: allowlist do NOME do banco + denylist de host.
 */

const DEFAULT_PRODUCTION_HOSTS = ['mysql.sindicone.com.br'];

const TEST_DB_SUFFIXES = ['_teste', '_test'];

export function parseDatabaseUrlParts(databaseUrl: string): {
  host: string;
  database: string;
  user: string;
} {
  try {
    const parsed = new URL(databaseUrl);
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, '')).trim();
    return {
      host: (parsed.hostname || '').toLowerCase(),
      database,
      user: decodeURIComponent(parsed.username || ''),
    };
  } catch {
    throw new Error('DATABASE_URL inválida.');
  }
}

/** Máscara para logs — nunca exibe senha nem host completo. */
export function maskDatabaseUrl(databaseUrl?: string | null): string {
  if (!databaseUrl) return '(não definida)';
  try {
    const parsed = new URL(databaseUrl);
    const db = decodeURIComponent(parsed.pathname.replace(/^\//, '')) || '?';
    const user = parsed.username ? '***' : '';
    const host = parsed.hostname
      ? `${parsed.hostname.slice(0, 2)}***${parsed.hostname.slice(-4)}`
      : '***';
    return `mysql://${user ? `${user}@` : ''}${host}:****/${db}`;
  } catch {
    return '(DATABASE_URL inválida)';
  }
}

export function listProductionDatabaseHosts(): string[] {
  const fromEnv = (process.env.PRODUCTION_DATABASE_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_PRODUCTION_HOSTS, ...fromEnv])];
}

export function isTestDatabaseName(databaseName: string): boolean {
  const name = databaseName.trim().toLowerCase();
  return TEST_DB_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/**
 * Trava principal: nome do banco deve terminar em _teste ou _test.
 * Segunda camada: host não pode estar na denylist de produção.
 */
export function assertSafeTestDatabase(databaseUrl?: string | null): {
  host: string;
  database: string;
} {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não configurada.');
  }

  const parts = parseDatabaseUrlParts(url);

  if (!parts.database) {
    throw new Error('DATABASE_URL sem nome de banco.');
  }

  if (!isTestDatabaseName(parts.database)) {
    throw new Error(
      `Operação bloqueada: o nome do banco deve terminar em "_teste" ou "_test" (recebido: "${parts.database}"). ` +
        `URL mascarada: ${maskDatabaseUrl(url)}`
    );
  }

  const prodHosts = listProductionDatabaseHosts();
  if (prodHosts.includes(parts.host)) {
    throw new Error(
      `Operação bloqueada: host de produção na denylist. Use um banco de TESTE. URL mascarada: ${maskDatabaseUrl(url)}`
    );
  }

  return parts;
}

/** @deprecated use assertSafeTestDatabase — mantido como alias da denylist. */
export function assertNotProductionDatabase(databaseUrl?: string | null): void {
  assertSafeTestDatabase(databaseUrl);
}

export type MirrorDeleteGuardInput = {
  confirmMirrorDelete: boolean;
  mockProviderCount: number;
  mysqlProviderCount: number;
  toleranceRatio?: number;
};

export function assertMirrorDeleteAllowed(input: MirrorDeleteGuardInput): void {
  if (!input.confirmMirrorDelete) {
    throw new Error(
      'Sync com delete espelhado bloqueado. Envie confirmMirrorDelete=true apenas após revisão manual.'
    );
  }

  const tolerance = input.toleranceRatio ?? 0.05;
  const mock = input.mockProviderCount;
  const mysql = input.mysqlProviderCount;

  if (mock === 0 && mysql > 0) {
    throw new Error(
      `Mirror-delete bloqueado: mock tem 0 prestadores e MySQL tem ${mysql}.`
    );
  }

  if (mysql > 0) {
    const ratio = Math.abs(mock - mysql) / mysql;
    if (ratio > tolerance && mock < mysql) {
      throw new Error(
        `Mirror-delete bloqueado: mock (${mock}) incompatível com MySQL (${mysql}). Diferença > ${(
          tolerance * 100
        ).toFixed(0)}%.`
      );
    }
  }
}
