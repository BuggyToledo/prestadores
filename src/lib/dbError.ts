/**
 * Formata erros do Prisma/MySQL em mensagens compreensíveis para o painel admin.
 */
export function formatDatabaseError(error: unknown, fallback = 'Erro ao gravar no banco de dados.'): string {
  const err = error as {
    code?: string;
    message?: string;
    meta?: { field_name?: string; target?: string | string[]; cause?: string };
  };

  const code = err?.code || '';
  const message = err?.message || '';
  const lower = message.toLowerCase();

  // Conexão / autenticação
  if (
    code === 'P1001' ||
    code === 'P1000' ||
    code === 'P1017' ||
    lower.includes("can't reach database") ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout')
  ) {
    return 'Não foi possível conectar ao MySQL. Verifique DATABASE_URL, host, porta e firewall.';
  }

  if (code === 'P1002' || lower.includes('timed out')) {
    return 'Tempo esgotado ao conectar no MySQL. Verifique se o servidor aceita conexões remotas.';
  }

  if (code === 'P1010' || lower.includes('access denied')) {
    return 'Acesso negado ao MySQL. Usuário ou senha incorretos, ou o IP do servidor não está liberado.';
  }

  // Tabelas / schema
  if (
    code === 'P2021' ||
    lower.includes("doesn't exist") ||
    (lower.includes('table') && lower.includes('exist'))
  ) {
    return 'Tabelas do MySQL ainda não foram criadas. Execute "npx prisma db push" ou sincronize pelo painel Admin > Banco.';
  }

  // Foreign key
  if (code === 'P2003' || lower.includes('foreign key') || lower.includes('cannot add or update a child row')) {
    const field = err?.meta?.field_name || '';
    if (field.toLowerCase().includes('category') || lower.includes('categoryid')) {
      return 'Categoria inválida ou inexistente no MySQL. Cadastre/sincronize as categorias antes de salvar o prestador.';
    }
    if (field.toLowerCase().includes('subcategory') || lower.includes('subcategoryid')) {
      return 'Subcategoria inválida ou inexistente no MySQL. Selecione outra especialidade ou deixe em branco.';
    }
    return 'Falha de chave estrangeira no MySQL: o registro relacionado (categoria/subcategoria) não existe no banco.';
  }

  // Unique constraint
  if (code === 'P2002' || lower.includes('unique constraint') || lower.includes('duplicate entry')) {
    const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(', ') : err?.meta?.target || 'slug';
    return `Já existe um registro com o mesmo valor único (${target}). Altere o nome ou o slug e tente novamente.`;
  }

  // Record not found
  if (code === 'P2025') {
    return 'Registro não encontrado no MySQL para atualizar ou excluir.';
  }

  // Data too long
  if (
    code === 'P2000' ||
    lower.includes('data too long') ||
    lower.includes('er_data_too_long') ||
    lower.includes('value too long')
  ) {
    return 'Algum campo ultrapassou o tamanho máximo permitido no MySQL (ex.: site, endereço ou Instagram muito longos).';
  }

  // Prisma client not generated / schema mismatch
  if (code === 'P2022' || (lower.includes('column') && lower.includes('does not exist'))) {
    return 'O schema do MySQL está desatualizado. Execute "npx prisma db push" para alinhar as colunas.';
  }

  if (message) {
    // Evitar vazar credenciais da connection string
    const safe = message.replace(/mysql:\/\/[^@]+@/gi, 'mysql://***@').slice(0, 500);
    return `${fallback} Detalhe MySQL/Prisma: ${safe}`;
  }

  return fallback;
}

export function isConnectionError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  const lower = (err?.message || '').toLowerCase();
  return (
    ['P1000', 'P1001', 'P1002', 'P1017', 'P1010'].includes(code) ||
    lower.includes("can't reach database") ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('access denied') ||
    lower.includes('server has gone away')
  );
}
