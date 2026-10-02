/**
 * Classificação kind (prestador vs utilidade_publica) e fila needs_review.
 */

export type ProviderKind = 'prestador' | 'utilidade_publica';

const PUBLIC_PATTERNS: RegExp[] = [
  /\bsenador(a)?\b/i,
  /\bdeputad[oa]\b/i,
  /\bvereador(a)?\b/i,
  /\bprefeitura\b/i,
  /\bsecretaria\b/i,
  /\bouvidoria\b/i,
  /\bconcession[aá]ria\b/i,
  /\bc[aâ]mara\s+(municipal|dos\s+vereadores)\b/i,
  /\bgoverno\s+(do\s+estado|federal|municipal)\b/i,
  /\bcorpo\s+de\s+bombeiros\b/i,
  /\bpol[ií]cia\s+(militar|civil|federal)\b/i,
  /\bdefesa\s+civil\b/i,
  /\bprocon\b/i,
  /\blight\b.*\bouvidoria\b/i,
  /\bouvidoria\b.*\blight\b/i,
  /\bcedae\b/i,
  /\brioterm\b/i,
  /\bine\s*a\b/i,
];

/** Ambíguos — não altera kind automaticamente */
const AMBIGUOUS_PATTERNS: RegExp[] = [
  /\borg[aã]o\b/i,
  /\bp[uú]blic[oa]\b/i,
  /\bmunicipal\b/i,
  /\bestadual\b/i,
  /\bfederal\b/i,
  /\bcâmara\b/i,
];

export type KindClassification = {
  kind: ProviderKind;
  confidence: 'alta' | 'media' | 'baixa';
  needsReview: boolean;
  reason: string;
  action: 'set_kind' | 'needs_review' | 'keep';
};

export function classifyProviderKind(name: string, categoryName?: string | null): KindClassification {
  const text = `${name || ''} ${categoryName || ''}`.trim();

  for (const re of PUBLIC_PATTERNS) {
    if (re.test(text)) {
      return {
        kind: 'utilidade_publica',
        confidence: 'alta',
        needsReview: false,
        reason: `Padrão de utilidade pública: ${re.source}`,
        action: 'set_kind',
      };
    }
  }

  if (/[oó]rg[aã]os\s+p[uú]blicos/i.test(categoryName || '')) {
    // Categoria de órgãos públicos — maioria é utilidade, mas pode ter prestador errado
    if (/\bequipe\b|\beletricista\b|\bencanador\b|\bpintor\b/i.test(name)) {
      return {
        kind: 'prestador',
        confidence: 'media',
        needsReview: true,
        reason: 'Nome parece prestador, mas está na categoria de órgãos públicos',
        action: 'needs_review',
      };
    }
    return {
      kind: 'utilidade_publica',
      confidence: 'media',
      needsReview: true,
      reason: 'Categoria órgãos públicos — confirmar kind',
      action: 'needs_review',
    };
  }

  for (const re of AMBIGUOUS_PATTERNS) {
    if (re.test(text)) {
      return {
        kind: 'prestador',
        confidence: 'baixa',
        needsReview: true,
        reason: `Termo ambíguo (${re.source}) — revisar manualmente`,
        action: 'needs_review',
      };
    }
  }

  return {
    kind: 'prestador',
    confidence: 'alta',
    needsReview: false,
    reason: 'Sem indício de utilidade pública',
    action: 'keep',
  };
}
