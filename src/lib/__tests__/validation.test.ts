import { describe, expect, it } from 'vitest';
import {
  normalizePhoneBr,
  sanitizeHttpUrl,
  sanitizeInstagram,
  toWhatsAppUrl,
} from '../validation';
import { assertNotProductionDatabase } from '../dbSafety';
import { checkRateLimit, clearRateLimitStore } from '../rateLimit';

describe('sanitizeHttpUrl', () => {
  it('aceita https', () => {
    const r = sanitizeHttpUrl('https://exemplo.com/path');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toContain('https://exemplo.com');
  });

  it('rejeita javascript:', () => {
    const r = sanitizeHttpUrl('javascript:alert(1)');
    expect(r.ok).toBe(false);
  });

  it('permite vazio', () => {
    const r = sanitizeHttpUrl('');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBeNull();
  });
});

describe('sanitizeInstagram', () => {
  it('converte @handle', () => {
    const r = sanitizeInstagram('@minha_empresa');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('https://instagram.com/minha_empresa');
  });

  it('rejeita domínio estranho', () => {
    const r = sanitizeInstagram('https://evil.com/x');
    expect(r.ok).toBe(false);
  });
});

describe('normalizePhoneBr', () => {
  it('normaliza celular RJ para E.164', () => {
    const r = normalizePhoneBr('(21) 98765-4321');
    expect(r.valid).toBe(true);
    expect(r.e164).toBe('5521987654321');
    expect(r.display).toBe('(21) 98765-4321');
  });

  it('aceita já com 55', () => {
    const r = normalizePhoneBr('5521987654321');
    expect(r.valid).toBe(true);
    expect(r.e164).toBe('5521987654321');
  });

  it('rejeita número curto', () => {
    const r = normalizePhoneBr('123');
    expect(r.valid).toBe(false);
  });
});

describe('toWhatsAppUrl', () => {
  it('gera wa.me com mensagem encoded', () => {
    const url = toWhatsAppUrl('21987654321', 'Olá teste');
    expect(url).toBe('https://wa.me/5521987654321?text=Ol%C3%A1%20teste');
  });
});

describe('dbSafety (legacy alias)', () => {
  it('bloqueia host de produção', () => {
    expect(() =>
      assertNotProductionDatabase('mysql://u:p@mysql.sindicone.com.br:3306/catalogo_test')
    ).toThrow(/produção|denylist|_teste|_test/i);
  });

  it('permite host de teste com nome *_test', () => {
    expect(() =>
      assertNotProductionDatabase('mysql://u:p@localhost:3306/catalogo_test')
    ).not.toThrow();
  });
});

describe('rateLimit', () => {
  it('bloqueia após 5 tentativas', () => {
    clearRateLimitStore();
    const key = 'test:ip:email';
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
    }
    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);
  });
});
