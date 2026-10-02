import { normalizePhoneBr } from '@/lib/validation';

export type DuplicateGroup = {
  e164: string;
  ids: string[];
};

/** Detecta duplicados pelo telefone/WhatsApp normalizado E.164. */
export function findDuplicatePhones(
  rows: Array<{ id: string; phone?: string | null; whatsapp?: string | null }>
): DuplicateGroup[] {
  const map = new Map<string, string[]>();

  for (const row of rows) {
    const candidates = [row.whatsapp, row.phone];
    for (const raw of candidates) {
      if (!raw) continue;
      const parsed = normalizePhoneBr(raw);
      if (!parsed.valid || !parsed.e164) continue;
      const list = map.get(parsed.e164) || [];
      if (!list.includes(row.id)) list.push(row.id);
      map.set(parsed.e164, list);
      break; // um E.164 por registro (prefer WhatsApp)
    }
  }

  return [...map.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([e164, ids]) => ({ e164, ids }));
}
