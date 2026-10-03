import { describe, expect, it } from 'vitest';
import {
  findHomeRegion,
  locationMatchesRegion,
  normalizePlace,
  regionFilterOr,
  regionsPresentInLocations,
} from './regions';

describe('regions — matching preciso', () => {
  it('findHomeRegion resolve id conhecido', () => {
    expect(findHomeRegion('zona-sul')?.label).toBe('Zona Sul');
    expect(findHomeRegion('inexistente')).toBeNull();
  });

  it('normalizePlace remove acentos e case', () => {
    expect(normalizePlace('  Jacarepaguá ')).toBe('jacarepagua');
  });

  it('Barra da Tijuca casa; Barra Mansa / Barra do Piraí NÃO', () => {
    const region = findHomeRegion('barra-jacarepagua')!;
    expect(
      locationMatchesRegion(
        { neighborhood: 'Barra da Tijuca', city: 'Rio de Janeiro', state: 'RJ' },
        region
      )
    ).toBe(true);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Barra Mansa', city: 'Barra Mansa', state: 'RJ' },
        region
      )
    ).toBe(false);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Centro', city: 'Barra do Piraí', state: 'RJ' },
        region
      )
    ).toBe(false);
    // contains antigo capturaria "Barra" em "Barra Mansa" — igualdade não
    expect(
      locationMatchesRegion(
        { neighborhood: 'Barra Mansa', city: 'Rio de Janeiro', state: 'RJ' },
        region
      )
    ).toBe(false);
  });

  it('Centro do Rio casa em centro; Centro de Niterói/Nova Iguaçu não', () => {
    const centro = findHomeRegion('centro')!;
    const niteroi = findHomeRegion('niteroi')!;
    expect(
      locationMatchesRegion(
        { neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ' },
        centro
      )
    ).toBe(true);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Centro', city: 'Niterói', state: 'RJ' },
        centro
      )
    ).toBe(false);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Centro', city: 'Niterói', state: 'RJ' },
        niteroi
      )
    ).toBe(true);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Centro', city: 'Nova Iguaçu', state: 'RJ' },
        centro
      )
    ).toBe(false);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Centro', city: 'Nova Iguaçu', state: 'RJ' },
        niteroi
      )
    ).toBe(false);
  });

  it('regionFilterOr usa igualdade + city/state (não contains)', () => {
    const or = regionFilterOr(findHomeRegion('barra-jacarepagua')!);
    const flat = JSON.stringify(or);
    expect(flat).toContain('Barra da Tijuca');
    expect(flat).toContain('Rio de Janeiro');
    expect(flat).not.toContain('"contains"');
    expect(or.every((c) => 'AND' in c)).toBe(true);
  });

  it('regionsPresentInLocations só retorna regiões com match preciso', () => {
    const ids = regionsPresentInLocations([
      { neighborhood: 'Botafogo', city: 'Rio de Janeiro', state: 'RJ' },
      { neighborhood: 'Barra Mansa', city: 'Barra Mansa', state: 'RJ' },
      { neighborhood: 'Centro', city: 'Nova Iguaçu', state: 'RJ' },
      { neighborhood: null, city: 'Rio de Janeiro', state: 'RJ' },
    ]);
    expect(ids).toEqual(['zona-sul']);
  });

  it('bairro nulo não casa com região de bairros (sem includeCityMatch)', () => {
    const ids = regionsPresentInLocations([
      { neighborhood: null, city: 'Rio de Janeiro', state: 'RJ' },
    ]);
    expect(ids).toEqual([]);
  });

  it('Niterói includeCityMatch aceita cidade sem bairro', () => {
    expect(
      locationMatchesRegion(
        { neighborhood: null, city: 'Niterói', state: 'RJ' },
        findHomeRegion('niteroi')!
      )
    ).toBe(true);
  });
});
