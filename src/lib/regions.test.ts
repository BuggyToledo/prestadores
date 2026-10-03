import { describe, expect, it } from 'vitest';
import {
  canInferRegionCity,
  computeLocationCoverage,
  extractDdd,
  findHomeRegion,
  locationMatchesRegion,
  normalizePlace,
  regionFilterOr,
  regionsPresentInLocations,
  shouldShowRegionFilter,
  suggestCityFromNeighborhoodAndDdd,
  REGION_FILTER_MIN_COVERAGE,
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
  });

  it('bairro do Rio com cidade vazia: sem DDD não casa; com DDD 21 casa', () => {
    const zonaSul = findHomeRegion('zona-sul')!;
    expect(
      locationMatchesRegion(
        { neighborhood: 'Botafogo', city: null, state: null, phone: null },
        zonaSul
      )
    ).toBe(false);
    expect(
      canInferRegionCity(
        { neighborhood: 'Botafogo', city: '', whatsapp: '21987654321' },
        zonaSul
      )
    ).toBe(true);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Botafogo', city: '', whatsapp: '21987654321' },
        zonaSul
      )
    ).toBe(true);
    expect(
      locationMatchesRegion(
        { neighborhood: 'Botafogo', city: '', phone: '1133334444' },
        zonaSul
      )
    ).toBe(false);
  });

  it('extractDdd e suggestCityFromNeighborhoodAndDdd', () => {
    expect(extractDdd(null, '5521987654321')).toBe('21');
    expect(extractDdd('(22) 99999-0000', null)).toBe('22');
    expect(
      suggestCityFromNeighborhoodAndDdd({
        neighborhood: 'Tijuca',
        city: null,
        whatsapp: '21999998888',
      })
    ).toEqual({ city: 'Rio de Janeiro', state: 'RJ' });
  });

  it('regionFilterOr inclui igualdade e caminho city vazia', () => {
    const or = regionFilterOr(findHomeRegion('zona-sul')!);
    const flat = JSON.stringify(or);
    expect(flat).toContain('Botafogo');
    expect(flat).toContain('Rio de Janeiro');
    expect(flat).not.toContain('"contains"');
    expect(flat).toContain('"city":null');
  });

  it('regionsPresentInLocations e coverage gate', () => {
    const locs = [
      { neighborhood: 'Botafogo', city: 'Rio de Janeiro', state: 'RJ' },
      { neighborhood: 'Barra Mansa', city: 'Barra Mansa', state: 'RJ' },
      { neighborhood: null, city: 'Rio de Janeiro', state: 'RJ' },
      { neighborhood: 'Copacabana', city: '', whatsapp: '21911112222' },
    ];
    const ids = regionsPresentInLocations(locs);
    expect(ids).toContain('zona-sul');
    const cov = computeLocationCoverage(locs);
    expect(cov.withBoth).toBe(2);
    expect(cov.matchable).toBeGreaterThanOrEqual(2);
    expect(shouldShowRegionFilter(cov, ids)).toBe(
      cov.pctMatchable >= REGION_FILTER_MIN_COVERAGE && ids.length > 0
    );
    expect(shouldShowRegionFilter(cov, [])).toBe(false);
  });
});
