/**
 * Mensagens acionáveis para falhas de conexão MySQL (especialmente DreamHost + Vercel).
 */
export function formatMySqlConnectionError(err: {
  message?: string;
  code?: string;
}): {
  error: string;
  code?: string;
  clientIp?: string;
  hostDenied?: string;
  providerHint: 'dreamhost' | 'generic';
  allowableHostsToAdd?: string[];
} {
  const message = err?.message || 'Falha ao conectar com o MySQL';
  const code = err?.code;

  let clientIp: string | undefined;
  let hostDenied: string | undefined;
  const hostMatch = message.match(/@'([^']+)'/);
  if (hostMatch) {
    hostDenied = hostMatch[1];
    clientIp = hostMatch[1];
  }

  const isAccessDenied =
    code === 'ER_ACCESS_DENIED_ERROR' ||
    message.toLowerCase().includes('access denied');

  if (isAccessDenied) {
    const hostsToAdd = ['%.dreamhost.com', '%.amazonaws.com', '%'];
    if (hostDenied && !hostsToAdd.includes(hostDenied)) {
      hostsToAdd.unshift(hostDenied);
    }

    return {
      code,
      clientIp,
      hostDenied,
      providerHint: 'dreamhost',
      allowableHostsToAdd: hostsToAdd,
      error:
        `Access denied: a DreamHost bloqueou o host da Vercel (${hostDenied || 'AWS'}). ` +
        `No painel DreamHost → Databases → MySQL Databases → clique no usuário → ` +
        `campo "Allowable Hosts", deixe UMA entrada por linha: ` +
        `%.dreamhost.com  |  %.amazonaws.com  |  %   ` +
        `e clique em "Modify ... now!". O padrão %.dreamhost.com sozinho NÃO libera a Vercel.`,
    };
  }

  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
    return {
      code,
      clientIp,
      hostDenied,
      providerHint: 'dreamhost',
      error:
        `Não foi possível alcançar o servidor MySQL (${code}). ` +
        `Na DreamHost o host costuma ser mysql.seudominio.com na porta 3306. ` +
        `Verifique se o hostname está correto no painel Databases → MySQL Databases.`,
    };
  }

  return {
    code,
    clientIp,
    hostDenied,
    providerHint: 'generic',
    error: message,
  };
}
