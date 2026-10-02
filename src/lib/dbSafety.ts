/**
 * Segurança de conexão com banco.
 * Scripts e sync destrutivo NÃO podem apontar para produção.
 */

const DEFAULT_PRODUCTION_HOSTS = [
  'mysql.sindicone.com.br',
];

function hostFromDatabaseUrl(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    throw new Error('DATABASE_URL inválida.');
  }
}

export function listProductionDatabaseHosts(): string[] {
  const fromEnv = (process.env.PRODUCTION_DATABASE_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_PRODUCTION_HOSTS, ...fromEnv])];
}

/** Aborta se a URL apontar para host de produção conhecido. */
export function assertNotProductionDatabase(databaseUrl?: string | null): void {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não configurada.');
  }

  const host = hostFromDatabaseUrl(url);
  const prodHosts = listProductionDatabaseHosts();
  if (prodHosts.includes(host)) {
    throw new Error(
      `Operação bloqueada: DATABASE_URL aponta para host de produção (${host}). Use um banco de TESTE.`
    );
  }
}

export type MirrorDeleteGuardInput = {
  /** Confirmação explícita do cliente (body.confirmMirrorDelete === true). */
  confirmMirrorDelete: boolean;
  mockProviderCount: number;
  mysqlProviderCount: number;
  /** Tolerância relativa (0.05 = 5%). */
  toleranceRatio?: number;
};

/**
 * Mirror-delete mock→MySQL só é permitido com confirmação explícita
 * e contagens compatíveis (evita apagar produção com mock vazio).
 */
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
        `Mirror-delete bloqueado: mock (${mock}) incompatível com MySQL (${mysql}). Diferença > ${(tolerance * 100).toFixed(0)}%.`
      );
    }
  }
}
