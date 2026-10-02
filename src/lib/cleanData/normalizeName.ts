/**
 * Normalização de display_name (Title Case com siglas e preposições).
 */

const SMALL_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'na',
  'no',
  'nas',
  'nos',
  'a',
  'o',
  'as',
  'os',
  'para',
  'com',
  'por',
]);

const ACRONYMS = new Set([
  'CFTV',
  'ADV',
  'RJ',
  'SP',
  'MG',
  'DF',
  'LTDA',
  'ME',
  'EPP',
  'EIRELI',
  'SA',
  'S/A',
  'CNPJ',
  'CPF',
  'ART',
  'CREA',
  'CAU',
  'PMOC',
  'SPDA',
  'NF',
  'NFE',
  'NF-E',
  'MEI',
  'SLA',
  'TI',
  'RH',
  'TV',
  'LED',
  'VIP',
  '24H',
  'SOS',
]);

function titleCaseWord(word: string, index: number): string {
  if (!word) return word;
  const upper = word.toUpperCase();
  if (ACRONYMS.has(upper) || ACRONYMS.has(word.replace(/\./g, '').toUpperCase())) {
    return upper === 'S/A' ? 'S/A' : upper;
  }
  // Mantém siglas curtas já em maiúsculas (2–4 letras só A-Z)
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,4}$/.test(word) && ACRONYMS.has(word.toUpperCase())) {
    return word.toUpperCase();
  }
  const lower = word.toLowerCase();
  if (index > 0 && SMALL_WORDS.has(lower)) {
    return lower;
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Converte para Title Case preservando siglas conhecidas e preposições minúsculas.
 * Não remove endereço embutido — use extractAddressFromName antes se necessário.
 */
export function toDisplayName(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  return cleaned
    .split(' ')
    .map((part, index) => {
      // Trata hífens internos: "PÓS-OBRA" → "Pós-Obra" com cuidado
      if (part.includes('-') && part.length > 1) {
        return part
          .split('-')
          .map((p, i) => titleCaseWord(p, index + i))
          .join('-');
      }
      return titleCaseWord(part, index);
    })
    .join(' ');
}
