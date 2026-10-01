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
} {
  const message = err?.message || 'Falha ao conectar com o MySQL';
  const code = err?.code;

  let clientIp: string | undefined;
  let hostDenied: string | undefined;
  const hostMatch = message.match(/@'([^']+)'/);
  if (hostMatch) {
    hostDenied = hostMatch[1];
    // Se for hostname AWS/Vercel, ainda assim é o host que a DreamHost viu
    clientIp = hostMatch[1];
  }

  const isAccessDenied =
    code === 'ER_ACCESS_DENIED_ERROR' ||
    message.toLowerCase().includes('access denied');

  if (isAccessDenied) {
    return {
      code,
      clientIp,
      hostDenied,
      providerHint: 'dreamhost',
      error:
        `Access denied: o MySQL da DreamHost recusou o usuário a partir de ` +
        `"${hostDenied || 'host remoto'}". ` +
        `No painel DreamHost → Databases → MySQL Databases, edite o usuário e ` +
        `defina Hostname como % (qualquer host) ou adicione o host da Vercel. ` +
        `Confira também usuário/senha e use o host mysql.seudominio.com (não localhost).`,
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
        `Verifique se o hostname está correto e se o MySQL remoto está habilitado.`,
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
