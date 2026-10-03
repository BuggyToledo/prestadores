import { describe, expect, it } from 'vitest';
import {
  findHomeRegion,
  regionFilterOr,
  regionsPresentInLocations,
} from './regions';

describe('regions', () => {
  it('findHomeRegion resolve id conhecido', () => {
    expect(findHomeRegion('zona-sul')?.label).toBe('Zona Sul');
    expect(findHomeRegion('inexistente')).toBeNull();
  });

  it('regionFilterOr inclui bairros e cidades', () => {
    const or = regionFilterOr(findHomeRegion('niteroi')!);
    expect(or.some((c) => (c as { city?: { contains: string } }).city?.contains === 'Niterói')).toBe(
      true
    );
    expect(
      or.some((c) => (c as { neighborhood?: { contains: string } }).neighborhood?.contains === 'Icaraí')
    ).toBe(true);
  });

  it('regionsPresentInLocations só retorna regiões com match', () => {
    const ids = regionsPresentInLocations([
      { neighborhood: 'Botafogo', city: 'Rio de Janeiro' },
      { neighborhood: null, city: 'Rio de Janeiro' },
      { neighborhood: '', city: 'São Paulo' },
    ]);
    expect(ids).toEqual(['zona-sul']);
  });

  it('bairro nulo não casa com nenhuma região', () => {
    const ids = regionsPresentInLocations([{ neighborhood: null, city: 'Rio de Janeiro' }]);
    expect(ids).toEqual([]);
  });
});
