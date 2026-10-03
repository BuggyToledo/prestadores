/**
 * Helpers visuais da Fase 3 — sem hex solto nos componentes.
 */

const CATEGORY_TONES = [
  'bg-brand-amber-light text-brand-amber-dark',
  'bg-sky-100 text-sky-800',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
  'bg-cyan-100 text-cyan-800',
] as const;

export function getInitials(name: string, max = 2): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !/^(da|de|do|das|dos|e)$/i.test(p));
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Cor de fundo do avatar derivada do nome da categoria (determinístico). */
export function categoryToneClass(categoryName?: string | null): string {
  const key = (categoryName || 'default').toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % 997;
  return CATEGORY_TONES[hash % CATEGORY_TONES.length];
}

export function providerDisplayName(provider: {
  displayName?: string | null;
  name: string;
}): string {
  const d = provider.displayName?.trim();
  return d || provider.name;
}

export type TrustTier = 'cadastrado' | 'documentado' | 'oficial' | string | null | undefined;

/** Rótulo público: omitir "cadastrado"; oficial/documentado só quando valor bate. */
export function trustBadgeLabel(tier: TrustTier): string | null {
  if (tier === 'oficial') return 'Oficial';
  if (tier === 'documentado') return 'Documentado';
  return null;
}

/** Copy: "verificados" → "cadastrados", exceto trustTier oficial. */
export function registeredCopy(tier: TrustTier, plural = true): string {
  if (tier === 'oficial') return plural ? 'oficiais' : 'oficial';
  return plural ? 'cadastrados' : 'cadastrado';
}

export function buildMapsSearchUrl(addressParts: Array<string | null | undefined>): string | null {
  const query = addressParts.filter((p) => p && String(p).trim()).join(', ').trim();
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function isSafeHttpUrl(url?: string | null): url is string {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
