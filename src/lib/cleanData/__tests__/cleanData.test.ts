import { describe, expect, it } from 'vitest';
import { classifyProviderKind } from '../classifyKind';
import { toDisplayName } from '../normalizeName';
import { extractAddressFromName } from '../extractAddress';
import { findDuplicatePhones } from '../duplicates';
import { buildReviewRows, filterApprovedRows, parseReviewCsv, splitCsvLine } from '../engine';
import { normalizePhoneBr } from '@/lib/validation';
import fs from 'node:fs';
import path from 'node:path';

describe('classifyProviderKind', () => {
  it('marca senador como utilidade_publica', () => {
    const r = classifyProviderKind('SENADOR FULANO DE TAL');
    expect(r.kind).toBe('utilidade_publica');
    expect(r.action).toBe('set_kind');
  });

  it('marca ouvidoria light', () => {
    const r = classifyProviderKind('OUVIDORIA DA LIGHT');
    expect(r.kind).toBe('utilidade_publica');
  });

  it('eletricista em órgãos públicos vai para needs_review', () => {
    const r = classifyProviderKind(
      'ELETRICISTA EQUIPE 1000',
      'Órgãos Públicos Emergências e Utilidades'
    );
    expect(r.needsReview).toBe(true);
    expect(r.action).toBe('needs_review');
  });
});

describe('toDisplayName', () => {
  it('Title Case com LTDA e preposição', () => {
    expect(toDisplayName('CLEANMASTER HIGIENIZACAO E LIMPEZA LTDA')).toBe(
      'Cleanmaster Higienizacao e Limpeza LTDA'
    );
  });

  it('preserva CFTV ADV ME', () => {
    const r = toDisplayName('adv cftv e alarmes me');
    expect(r).toContain('CFTV');
    expect(r).toContain('ADV');
    expect(r).toMatch(/ME$/);
  });
});

describe('extractAddressFromName', () => {
  it('extrai rua e bairro', () => {
    const r = extractAddressFromName(
      'ELETRICISTA EQUIPE 1000 - RUA DAS FLORES 100 - TIJUCA'
    );
    expect(r.matched).toBe(true);
    expect(r.cleanName.toLowerCase()).toContain('eletricista');
    expect(r.address?.toUpperCase()).toContain('RUA');
    expect(r.neighborhood?.toUpperCase()).toBe('TIJUCA');
  });
});

describe('normalizePhoneBr + duplicates', () => {
  it('E.164', () => {
    expect(normalizePhoneBr('(21) 99988-7766').e164).toBe('5521999887766');
  });

  it('detecta duplicados', () => {
    const dups = findDuplicatePhones([
      { id: 'a', whatsapp: '21999887766' },
      { id: 'b', whatsapp: '5521999887766' },
      { id: 'c', phone: '2133334444' },
    ]);
    expect(dups.length).toBe(1);
    expect(dups[0].ids).toContain('a');
    expect(dups[0].ids).toContain('b');
  });
});

describe('engine com fixture', () => {
  it('gera mudanças a partir da amostra-mini', () => {
    const csvPath = path.join(process.cwd(), 'scripts/fixtures/amostra-mini.csv');
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const providers = lines.slice(1).map((line, idx) => {
      const cols = splitCsvLine(line);
      const get = (n: string) => cols[headers.indexOf(n)] || '';
      return {
        id: get('id') || `r${idx}`,
        name: get('name'),
        phone: get('phone'),
        whatsapp: get('whatsapp'),
        city: get('city'),
        state: get('state'),
        categoryName: get('category'),
        kind: get('kind') || null,
        slug: get('slug'),
      };
    });

    const rows = buildReviewRows(providers);
    expect(rows.some((r) => r.campo === 'kind' && r.valor_novo === 'utilidade_publica')).toBe(
      true
    );
    expect(rows.some((r) => r.campo === 'displayName')).toBe(true);
    expect(rows.some((r) => r.acao_sugerida === 'flag_duplicate')).toBe(true);

    const csv = rows
      .map((r) => ({ ...r, aprovado: r.campo === 'kind' ? 'SIM' : '' }))
      .filter((r) => r.aprovado);
    // filterApproved via parse
    const rebuilt = parseReviewCsv(
      'id,campo,valor_antigo,valor_novo,motivo,confianca,acao_sugerida,aprovado\n' +
        csv
          .map(
            (r) =>
              `${r.id},${r.campo},${r.valor_antigo},${r.valor_novo},x,alta,${r.acao_sugerida},SIM`
          )
          .join('\n')
    );
    expect(filterApprovedRows(rebuilt).length).toBeGreaterThan(0);
  });
});
