import { describe, expect, it } from 'vitest';
import { validateNewPassword } from '@/lib/auth';

describe('validateNewPassword', () => {
  it('exige 12 caracteres', () => {
    expect(validateNewPassword('curta').ok).toBe(false);
  });

  it('bloqueia admin123', () => {
    expect(validateNewPassword('admin123', 'outra_senha_longa').ok).toBe(false);
  });

  it('bloqueia igual à atual', () => {
    expect(validateNewPassword('senha_bem_longa_1', 'senha_bem_longa_1').ok).toBe(false);
  });

  it('aceita senha forte', () => {
    expect(validateNewPassword('SenhaForte!2026xx', 'antiga_diferente_1').ok).toBe(true);
  });
});
