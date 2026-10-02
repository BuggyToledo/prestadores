import { describe, expect, it } from 'vitest';
import {
  buildMapsSearchUrl,
  getInitials,
  isSafeHttpUrl,
  registeredCopy,
  trustBadgeLabel,
} from '../design';

describe('design helpers', () => {
  it('iniciais ignoram preposições', () => {
    expect(getInitials('João da Silva')).toBe('JS');
    expect(getInitials('LIGHT')).toBe('LI');
  });

  it('trustBadge só oficial/documentado', () => {
    expect(trustBadgeLabel('cadastrado')).toBeNull();
    expect(trustBadgeLabel('documentado')).toBe('Documentado');
    expect(trustBadgeLabel('oficial')).toBe('Oficial');
  });

  it('copy cadastrados vs oficiais', () => {
    expect(registeredCopy('cadastrado')).toBe('cadastrados');
    expect(registeredCopy('oficial')).toBe('oficiais');
  });

  it('maps URL sem chave', () => {
    const url = buildMapsSearchUrl(['Rua A', 'Botafogo', 'Rio de Janeiro', 'RJ']);
    expect(url).toContain('google.com/maps/search');
    expect(url).toContain('api=1');
    expect(url).toContain(encodeURIComponent('Rua A'));
  });

  it('isSafeHttpUrl rejeita javascript:', () => {
    expect(isSafeHttpUrl('https://ok.com')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
  });
});
