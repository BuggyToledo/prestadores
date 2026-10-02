/**
 * Extrai endereço/bairro embutidos no nome quando há padrão claro.
 * Ex.: "ELETRICISTA JOÃO - RUA X, 123 - COPACABANA"
 */

export type AddressExtraction = {
  cleanName: string;
  address: string | null;
  neighborhood: string | null;
  confidence: 'alta' | 'media' | 'baixa';
  matched: boolean;
};

const ADDR_RE =
  /^(.*?)\s*[-–—]\s*((?:RUA|R\.|AV\.?|AVENIDA|TRAVESSA|TV\.|ALAMEDA|ESTRADA|RODOVIA)[\w\s.,º°/]+?)\s*[-–—]\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\w\s]+)$/i;

export function extractAddressFromName(name: string): AddressExtraction {
  if (!name) {
    return { cleanName: '', address: null, neighborhood: null, confidence: 'baixa', matched: false };
  }

  const m = name.trim().match(ADDR_RE);
  if (m) {
    return {
      cleanName: m[1].trim(),
      address: m[2].replace(/\s+/g, ' ').trim(),
      neighborhood: m[3].replace(/\s+/g, ' ').trim(),
      confidence: 'alta',
      matched: true,
    };
  }

  // Padrão mais frouxo: "NOME - BAIRRO" sem rua
  const loose = name.trim().match(/^(.*?)\s*[-–—]\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁ-ú\s]{2,40})$/);
  if (loose && !/\d/.test(loose[2])) {
    return {
      cleanName: loose[1].trim(),
      address: null,
      neighborhood: loose[2].trim(),
      confidence: 'media',
      matched: true,
    };
  }

  return {
    cleanName: name.trim(),
    address: null,
    neighborhood: null,
    confidence: 'baixa',
    matched: false,
  };
}
