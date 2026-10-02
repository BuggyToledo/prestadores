/**
 * Validação e sanitização de URLs e telefones BR / WhatsApp (E.164).
 */

export type PhoneValidationResult = {
  valid: boolean;
  /** E.164 sem '+' (ex.: 5521987654321) — pronto para wa.me */
  e164: string | null;
  /** Formato de exibição BR */
  display: string | null;
  error?: string;
};

const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Aceita apenas http/https. Rejeita javascript:, data:, etc.
 * Retorna URL normalizada ou null se vazia; lança/retorna erro se inválida.
 */
export function sanitizeHttpUrl(
  value?: string | null,
  options?: { allowEmpty?: boolean }
): { ok: true; url: string | null } | { ok: false; error: string } {
  const allowEmpty = options?.allowEmpty !== false;
  if (value == null || !String(value).trim()) {
    if (allowEmpty) return { ok: true, url: null };
    return { ok: false, error: 'URL obrigatória.' };
  }

  const trimmed = String(value).trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'URL inválida.' };
  }

  if (!ALLOWED_URL_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, error: 'URL deve usar http ou https.' };
  }

  return { ok: true, url: parsed.toString() };
}

/**
 * Instagram: @handle → https://instagram.com/handle, ou URL http(s) do Instagram.
 */
export function sanitizeInstagram(
  value?: string | null
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value == null || !String(value).trim()) {
    return { ok: true, value: null };
  }

  const trimmed = String(value).trim();

  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).replace(/[^a-zA-Z0-9._]/g, '');
    if (!handle || handle.length > 30) {
      return { ok: false, error: 'Handle do Instagram inválido.' };
    }
    return { ok: true, value: `https://instagram.com/${handle}` };
  }

  const asUrl = sanitizeHttpUrl(trimmed);
  if (!asUrl.ok) return asUrl;

  try {
    const host = new URL(asUrl.url!).hostname.replace(/^www\./, '');
    if (host !== 'instagram.com' && host !== 'instagr.am') {
      return { ok: false, error: 'URL de Instagram deve ser do domínio instagram.com.' };
    }
  } catch {
    return { ok: false, error: 'URL de Instagram inválida.' };
  }

  return { ok: true, value: asUrl.url };
}

/**
 * Imagens: http(s) ou data:image/* (upload base64 no admin).
 */
export function sanitizeImageUrl(
  value?: string | null,
  options?: { required?: boolean }
): { ok: true; url: string | null } | { ok: false; error: string } {
  const required = options?.required === true;
  if (value == null || !String(value).trim()) {
    if (required) return { ok: false, error: 'Imagem obrigatória.' };
    return { ok: true, url: null };
  }

  const trimmed = String(value).trim();
  if (trimmed.startsWith('data:image/')) {
    if (trimmed.length > 3_500_000) {
      return { ok: false, error: 'Imagem base64 excede o tamanho máximo permitido.' };
    }
    return { ok: true, url: trimmed };
  }

  return sanitizeHttpUrl(trimmed, { allowEmpty: false });
}

/**
 * Normaliza telefone BR para E.164 (sem +).
 * Aceita 10/11 dígitos nacionais ou já com 55.
 */
export function normalizePhoneBr(value?: string | null): PhoneValidationResult {
  if (value == null || !String(value).trim()) {
    return { valid: false, e164: null, display: null, error: 'Telefone vazio.' };
  }

  let digits = String(value).replace(/\D/g, '');

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    // já com país
  } else if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  } else {
    return {
      valid: false,
      e164: null,
      display: null,
      error: 'Telefone deve ter 10 ou 11 dígitos (DDD + número) ou E.164 BR (55...).',
    };
  }

  // 55 + DDD(2) + número(8 ou 9) => 12 ou 13 dígitos
  if (digits.length !== 12 && digits.length !== 13) {
    return {
      valid: false,
      e164: null,
      display: null,
      error: 'Tamanho E.164 inválido para Brasil.',
    };
  }

  const national = digits.slice(2);
  const ddd = national.slice(0, 2);
  const number = national.slice(2);

  if (!/^[1-9][0-9]$/.test(ddd)) {
    return { valid: false, e164: null, display: null, error: 'DDD inválido.' };
  }

  // Celular: 9 dígitos começando com 9; fixo: 8 dígitos
  if (number.length === 9 && !number.startsWith('9')) {
    return {
      valid: false,
      e164: null,
      display: null,
      error: 'Celular deve ter 9 dígitos iniciando em 9.',
    };
  }

  const display =
    number.length === 9
      ? `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
      : `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;

  return { valid: true, e164: digits, display };
}

export function toWhatsAppUrl(
  whatsapp: string,
  message: string
): string | null {
  const phone = normalizePhoneBr(whatsapp);
  if (!phone.valid || !phone.e164) return null;
  return `https://wa.me/${phone.e164}?text=${encodeURIComponent(message)}`;
}
