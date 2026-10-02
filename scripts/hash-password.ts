#!/usr/bin/env npx tsx
/**
 * Gera hash bcrypt para UPDATE manual no MySQL.
 * Não precisa de DATABASE_URL nem das colunas novas (sessionVersion).
 *
 * Uso:
 *   npx tsx scripts/hash-password.ts "SuaNovaSenhaForte"
 *
 * Depois no MySQL:
 *   UPDATE users SET passwordHash = '<hash>' WHERE email = 'seu@email.com';
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Uso: npx tsx scripts/hash-password.ts "SuaNovaSenhaForte"');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Aviso: senha com menos de 12 caracteres (a tela nova exige 12).');
}

if (password.toLowerCase() === 'admin123') {
  console.error('Erro: admin123 é proibida.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('');
console.log('Cole este valor no SQL (passwordHash):');
console.log(hash);
console.log('');
console.log('Exemplo:');
console.log(
  `UPDATE users SET passwordHash = '${hash}' WHERE email = 'admin@seuemail.com';`
);
console.log('');
