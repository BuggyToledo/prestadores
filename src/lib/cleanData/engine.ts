import { classifyProviderKind } from './classifyKind';
import { extractAddressFromName } from './extractAddress';
import { toDisplayName } from './normalizeName';
import { findDuplicatePhones } from './duplicates';
import { normalizePhoneBr } from '@/lib/validation';
import type { CleanProviderInput, ReviewRow } from './types';
import { slugify } from '@/lib/utils';

function pushChange(
  rows: ReviewRow[],
  base: Pick<ReviewRow, 'id' | 'campo' | 'valor_antigo' | 'valor_novo' | 'motivo' | 'confianca' | 'acao_sugerida'>
) {
  if ((base.valor_antigo || '') === (base.valor_novo || '')) return;
  rows.push({ ...base, aprovado: '' });
}

/** Gera linhas de revisão a partir de prestadores (CSV ou DB). */
export function buildReviewRows(providers: CleanProviderInput[]): ReviewRow[] {
  const rows: ReviewRow[] = [];

  for (const p of providers) {
    const kindResult = classifyProviderKind(p.name, p.categoryName);
    if (kindResult.action === 'set_kind' && (p.kind || 'prestador') !== kindResult.kind) {
      pushChange(rows, {
        id: p.id,
        campo: 'kind',
        valor_antigo: p.kind || 'prestador',
        valor_novo: kindResult.kind,
        motivo: kindResult.reason,
        confianca: kindResult.confidence,
        acao_sugerida: 'set_kind',
      });
    }
    if (kindResult.needsReview || kindResult.action === 'needs_review') {
      pushChange(rows, {
        id: p.id,
        campo: 'needsReview',
        valor_antigo: 'false',
        valor_novo: 'true',
        motivo: kindResult.reason,
        confianca: kindResult.confidence,
        acao_sugerida: 'needs_review',
      });
    }

    const extracted = extractAddressFromName(p.name);
    const nameForDisplay = extracted.matched ? extracted.cleanName : p.name;
    const display = toDisplayName(nameForDisplay);

    if (display && display !== (p.displayName || p.name)) {
      pushChange(rows, {
        id: p.id,
        campo: 'displayName',
        valor_antigo: p.displayName || p.name,
        valor_novo: display,
        motivo: extracted.matched
          ? 'Title Case após extrair endereço do nome'
          : 'Normalização Title Case (siglas/preposições)',
        confianca: 'alta',
        acao_sugerida: 'set_display_name',
      });
    }

    // slug a partir do display
    const desiredSlug = slugify(display || p.name);
    if (desiredSlug && p.slug && desiredSlug !== p.slug) {
      pushChange(rows, {
        id: p.id,
        campo: 'slug',
        valor_antigo: p.slug,
        valor_novo: desiredSlug,
        motivo: 'Slug alinhado ao displayName',
        confianca: 'media',
        acao_sugerida: 'set_display_name',
      });
    }

    if (extracted.matched && extracted.address && !p.address) {
      pushChange(rows, {
        id: p.id,
        campo: 'address',
        valor_antigo: p.address || '',
        valor_novo: toDisplayName(extracted.address),
        motivo: 'Endereço extraído do nome',
        confianca: extracted.confidence,
        acao_sugerida: 'set_address',
      });
    }

    if (extracted.matched && extracted.neighborhood && !p.neighborhood) {
      pushChange(rows, {
        id: p.id,
        campo: 'neighborhood',
        valor_antigo: p.neighborhood || '',
        valor_novo: toDisplayName(extracted.neighborhood),
        motivo: 'Bairro extraído do nome',
        confianca: extracted.confidence,
        acao_sugerida: 'set_neighborhood',
      });
    }

    // Telefones
    if (p.whatsapp) {
      const w = normalizePhoneBr(p.whatsapp);
      if (w.valid && w.e164 && w.e164 !== p.whatsapp.replace(/\D/g, '').replace(/^55/, '55')) {
        pushChange(rows, {
          id: p.id,
          campo: 'whatsapp',
          valor_antigo: p.whatsapp,
          valor_novo: w.e164,
          motivo: 'Normalização E.164 BR',
          confianca: 'alta',
          acao_sugerida: 'set_whatsapp_e164',
        });
      } else if (!w.valid) {
        pushChange(rows, {
          id: p.id,
          campo: 'whatsapp',
          valor_antigo: p.whatsapp,
          valor_novo: '',
          motivo: `Telefone inválido: ${w.error}`,
          confianca: 'alta',
          acao_sugerida: 'needs_review',
        });
      }
    }

    if (p.phone) {
      const ph = normalizePhoneBr(p.phone);
      if (ph.valid && ph.e164) {
        const digits = p.phone.replace(/\D/g, '');
        if (ph.e164 !== digits && ph.e164 !== `55${digits}` && digits !== ph.e164) {
          pushChange(rows, {
            id: p.id,
            campo: 'phone',
            valor_antigo: p.phone,
            valor_novo: ph.e164,
            motivo: 'Normalização E.164 BR',
            confianca: 'alta',
            acao_sugerida: 'set_phone_e164',
          });
        }
      } else if (!ph.valid) {
        pushChange(rows, {
          id: p.id,
          campo: 'phone',
          valor_antigo: p.phone,
          valor_novo: '',
          motivo: `Telefone inválido: ${ph.error}`,
          confianca: 'alta',
          acao_sugerida: 'needs_review',
        });
      }
    }

    // City/state heurística simples: DDD 21 → RJ; se city Brasília e state RJ → flag
    if (/bras[ií]lia/i.test(p.city || '') && (p.state || '').toUpperCase() === 'RJ') {
      pushChange(rows, {
        id: p.id,
        campo: 'state',
        valor_antigo: p.state || '',
        valor_novo: 'DF',
        motivo: 'Cidade Brasília incompatível com UF RJ',
        confianca: 'media',
        acao_sugerida: 'needs_review',
      });
    }
  }

  const dups = findDuplicatePhones(providers);
  for (const g of dups) {
    for (const id of g.ids) {
      rows.push({
        id,
        campo: 'duplicate_phone',
        valor_antigo: g.e164,
        valor_novo: g.ids.join('|'),
        motivo: `Duplicado por telefone E.164 (${g.ids.length} registros)`,
        confianca: 'alta',
        acao_sugerida: 'flag_duplicate',
        aprovado: '',
      });
    }
  }

  return rows;
}

export function reviewRowsToCsv(rows: ReviewRow[]): string {
  const headers = [
    'id',
    'campo',
    'valor_antigo',
    'valor_novo',
    'motivo',
    'confianca',
    'acao_sugerida',
    'aprovado',
  ];
  const escape = (v: string) => {
    const s = v ?? '';
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.campo,
        r.valor_antigo,
        r.valor_novo,
        r.motivo,
        r.confianca,
        r.acao_sugerida,
        r.aprovado,
      ]
        .map((x) => escape(String(x ?? '')))
        .join(',')
    );
  }
  return lines.join('\n') + '\n';
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function parseReviewCsv(content: string): ReviewRow[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const rows: ReviewRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    rows.push({
      id: cols[idx('id')] || '',
      campo: cols[idx('campo')] || '',
      valor_antigo: cols[idx('valor_antigo')] || '',
      valor_novo: cols[idx('valor_novo')] || '',
      motivo: cols[idx('motivo')] || '',
      confianca: (cols[idx('confianca')] as ReviewRow['confianca']) || 'baixa',
      acao_sugerida: cols[idx('acao_sugerida')] || '',
      aprovado: cols[idx('aprovado')] || '',
    });
  }
  return rows;
}

export function filterApprovedRows(rows: ReviewRow[]): ReviewRow[] {
  return rows.filter((r) => ['sim', 'yes', 'true', '1', 's'].includes(r.aprovado.trim().toLowerCase()));
}
