export type ReviewAction =
  | 'set_kind'
  | 'set_display_name'
  | 'set_address'
  | 'set_neighborhood'
  | 'set_city'
  | 'set_state'
  | 'set_phone_e164'
  | 'set_whatsapp_e164'
  | 'flag_duplicate'
  | 'needs_review'
  | 'keep';

export type ReviewRow = {
  id: string;
  campo: string;
  valor_antigo: string;
  valor_novo: string;
  motivo: string;
  confianca: 'alta' | 'media' | 'baixa';
  acao_sugerida: ReviewAction | string;
  /** Preenchido pelo revisor humano: SIM para aplicar */
  aprovado: string;
};

export type CleanProviderInput = {
  id: string;
  name: string;
  displayName?: string | null;
  slug?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  categoryName?: string | null;
  kind?: string | null;
};

export const REVIEW_HEADERS = [
  'id',
  'campo',
  'valor_antigo',
  'valor_novo',
  'motivo',
  'confianca',
  'acao_sugerida',
  'aprovado',
] as const;
