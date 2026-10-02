import {
  normalizePhoneBr,
  sanitizeHttpUrl,
  sanitizeImageUrl,
  sanitizeInstagram,
} from '@/lib/validation';

export type ProviderContactInput = {
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
};

export type SanitizedProviderContacts = {
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
};

export function sanitizeProviderContacts(
  input: ProviderContactInput
): { ok: true; data: SanitizedProviderContacts } | { ok: false; error: string } {
  let phone: string | null = null;
  if (input.phone && String(input.phone).trim()) {
    const parsed = normalizePhoneBr(input.phone);
    if (!parsed.valid || !parsed.e164) {
      return { ok: false, error: parsed.error || 'Telefone inválido.' };
    }
    phone = parsed.e164;
  }

  let whatsapp: string | null = null;
  if (input.whatsapp && String(input.whatsapp).trim()) {
    const parsed = normalizePhoneBr(input.whatsapp);
    if (!parsed.valid || !parsed.e164) {
      return { ok: false, error: parsed.error || 'WhatsApp inválido.' };
    }
    whatsapp = parsed.e164;
  }

  const website = sanitizeHttpUrl(input.website);
  if (!website.ok) return { ok: false, error: `Website: ${website.error}` };

  const instagram = sanitizeInstagram(input.instagram);
  if (!instagram.ok) return { ok: false, error: `Instagram: ${instagram.error}` };

  const logoUrl = sanitizeImageUrl(input.logoUrl);
  if (!logoUrl.ok) return { ok: false, error: `Logo: ${logoUrl.error}` };

  const coverUrl = sanitizeImageUrl(input.coverUrl);
  if (!coverUrl.ok) return { ok: false, error: `Capa: ${coverUrl.error}` };

  return {
    ok: true,
    data: {
      phone,
      whatsapp,
      website: website.url,
      instagram: instagram.value,
      logoUrl: logoUrl.url,
      coverUrl: coverUrl.url,
    },
  };
}

export function sanitizeBannerFields(input: {
  imageUrl?: string | null;
  linkUrl?: string | null;
}): { ok: true; imageUrl: string; linkUrl: string | null } | { ok: false; error: string } {
  const image = sanitizeImageUrl(input.imageUrl, { required: true });
  if (!image.ok || !image.url) {
    return { ok: false, error: image.ok ? 'Imagem obrigatória.' : image.error };
  }

  const link = sanitizeHttpUrl(input.linkUrl);
  if (!link.ok) return { ok: false, error: `Link: ${link.error}` };

  return { ok: true, imageUrl: image.url, linkUrl: link.url };
}
