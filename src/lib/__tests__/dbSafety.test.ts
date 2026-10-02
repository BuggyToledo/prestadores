import { describe, expect, it } from 'vitest';
import {
  assertSafeTestDatabase,
  isTestDatabaseName,
  maskDatabaseUrl,
  assertMirrorDeleteAllowed,
} from '../dbSafety';

describe('isTestDatabaseName', () => {
  it('aceita sufixos _teste e _test', () => {
    expect(isTestDatabaseName('catalogo_teste')).toBe(true);
    expect(isTestDatabaseName('catalogo_servicos_test')).toBe(true);
    expect(isTestDatabaseName('CATALOGO_TESTE')).toBe(true);
  });

  it('rejeita produção / sem sufixo', () => {
    expect(isTestDatabaseName('catalogo_servicos')).toBe(false);
    expect(isTestDatabaseName('prestadores')).toBe(false);
    expect(isTestDatabaseName('prestadores_v2')).toBe(false);
    expect(isTestDatabaseName('catalogo_servicos_teste_backup')).toBe(false);
    expect(isTestDatabaseName('teste_catalogo')).toBe(false);
  });
});

/** Nomes usados na virada: banco novo de prod nunca deve passar na allowlist de escrita. */
describe('scripts de escrita — bancos de produção bloqueados', () => {
  const prodLikeNames = [
    'prestadores_v2',
    'catalogo_servicos',
    'prestadores',
    'sindicone_prod',
  ];

  it.each(prodLikeNames)('assertSafeTestDatabase recusa "%s"', (db) => {
    expect(() =>
      assertSafeTestDatabase(`mysql://u:segredo@localhost:3306/${db}`)
    ).toThrow(/_teste|_test/);
  });
});

describe('assertSafeTestDatabase', () => {
  it('permite banco *_teste em host não-prod', () => {
    expect(() =>
      assertSafeTestDatabase('mysql://u:segredo@localhost:3306/catalogo_teste')
    ).not.toThrow();
  });

  it('bloqueia nome sem sufixo de teste', () => {
    expect(() =>
      assertSafeTestDatabase('mysql://u:segredo@localhost:3306/catalogo_servicos')
    ).toThrow(/_teste|_test/);
  });

  it('bloqueia host de produção mesmo com nome *_test', () => {
    expect(() =>
      assertSafeTestDatabase('mysql://u:segredo@mysql.sindicone.com.br:3306/catalogo_test')
    ).toThrow(/denylist|produção/i);
  });
});

describe('maskDatabaseUrl', () => {
  it('não revela senha nem host completo', () => {
    const masked = maskDatabaseUrl(
      'mysql://admin:SuperSecret123@mysql.exemplo.com.br:3306/catalogo_teste'
    );
    expect(masked).not.toContain('SuperSecret123');
    expect(masked).not.toContain('mysql.exemplo.com.br');
    expect(masked).toContain('catalogo_teste');
    expect(masked).toContain('***');
  });
});

describe('assertMirrorDeleteAllowed', () => {
  it('exige confirmação', () => {
    expect(() =>
      assertMirrorDeleteAllowed({
        confirmMirrorDelete: false,
        mockProviderCount: 10,
        mysqlProviderCount: 10,
      })
    ).toThrow(/confirmMirrorDelete/);
  });
});
