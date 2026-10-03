/**
 * Mapa único Bairro/Região → bairros do Rio (nomes completos) + city/state.
 *
 * ## Como adicionar bairros
 * 1. Escolha a região em `HOME_REGIONS` (ou crie um novo bloco com `id`/`label`).
 * 2. Inclua o **nome completo** do bairro em `neighborhoods` (ex.: "Barra da Tijuca",
 *    nunca só "Barra" — evita capturar Barra Mansa / Barra do Piraí).
 * 3. Mantenha `city` e `state` corretos (`Rio de Janeiro`/`RJ` ou `Niterói`/`RJ`).
 * 4. O matching é **igualdade** do bairro (normalizado) **e** city/state.
 *    Não use substrings parciais.
 * 5. Edite **só este arquivo** — home e `/categoria/[slug]` leem daqui.
 *
 * Prestadores com bairro nulo/vazio entram na listagem padrão e só saem
 * quando um filtro de região é aplicado.
 */

export type RegionDef = {
  id: string;
  label: string;
  /** Cidade exigida no cruzamento (igualdade, case/acento-insensitive). */
  city: string;
  /** UF exigida no cruzamento. */
  state: string;
  /** Nomes completos de bairros. */
  neighborhoods: readonly string[];
  /**
   * Se true, qualquer prestador com city/state da região entra
   * (útil para Niterói como município inteiro).
   */
  includeCityMatch?: boolean;
};

export const HOME_REGIONS: readonly RegionDef[] = [
  {
    id: 'zona-sul',
    label: 'Zona Sul',
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhoods: [
      'Botafogo',
      'Copacabana',
      'Ipanema',
      'Leblon',
      'Flamengo',
      'Laranjeiras',
      'Humaitá',
      'Catete',
      'Glória',
      'Urca',
      'Gávea',
      'Lagoa',
      'Jardim Botânico',
      'São Conrado',
    ],
  },
  {
    id: 'centro',
    label: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhoods: ['Centro', 'Lapa', 'Santa Teresa', 'Saúde', 'Gamboa', 'Santo Cristo'],
  },
  {
    id: 'tijuca',
    label: 'Tijuca',
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhoods: ['Tijuca', 'Vila Isabel', 'Maracanã', 'Andaraí', 'Grajaú', 'Praça da Bandeira'],
  },
  {
    id: 'barra-jacarepagua',
    label: 'Barra/Jacarepaguá',
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhoods: [
      'Barra da Tijuca',
      'Jacarepaguá',
      'Recreio dos Bandeirantes',
      'Recreio',
      'Vargem Grande',
      'Vargem Pequena',
      'Itanhangá',
      'Taquara',
      'Freguesia',
      'Freguesia (Jacarepaguá)',
    ],
  },
  {
    id: 'zona-norte',
    label: 'Zona Norte',
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhoods: [
      'Méier',
      'Madureira',
      'Penha',
      'Ilha do Governador',
      'Ramos',
      'Bonsucesso',
      'Olaria',
      'Del Castilho',
      'Inhaúma',
      'Pilares',
    ],
  },
  {
    id: 'niteroi',
    label: 'Niterói',
    city: 'Niterói',
    state: 'RJ',
    neighborhoods: ['Icaraí', 'Santa Rosa', 'Centro', 'São Francisco', 'Charitas', 'Pendotiba'],
    includeCityMatch: true,
  },
] as const;

export type HomeRegionId = (typeof HOME_REGIONS)[number]['id'];
export type HomeRegion = RegionDef;

/** Normaliza para comparação: trim, minúsculas, sem acentos. */
export function normalizePlace(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function findHomeRegion(id?: string | null): HomeRegion | null {
  if (!id) return null;
  return HOME_REGIONS.find((r) => r.id === id) ?? null;
}

function cityStateMatch(
  loc: { city?: string | null; state?: string | null },
  region: HomeRegion
): boolean {
  const cityOk = normalizePlace(loc.city) === normalizePlace(region.city);
  const stateRaw = normalizePlace(loc.state);
  // Aceita state ausente se a cidade já bate (dados incompletos)
  const stateOk = !stateRaw || stateRaw === normalizePlace(region.state);
  return cityOk && stateOk;
}

/**
 * Matching em memória: bairro por igualdade normalizada + city/state.
 * Nunca usa substring (evita Barra Mansa ⊂ Barra…).
 */
export function locationMatchesRegion(
  loc: { neighborhood?: string | null; city?: string | null; state?: string | null },
  region: HomeRegion
): boolean {
  if (!cityStateMatch(loc, region)) return false;

  if (region.includeCityMatch) return true;

  const n = normalizePlace(loc.neighborhood);
  if (!n) return false;
  return region.neighborhoods.some((bn) => normalizePlace(bn) === n);
}

/**
 * Cláusulas Prisma/mock: cada bairro = igualdade + city + state.
 * Para Niterói com includeCityMatch, também casa city/state sem bairro.
 */
export function regionFilterOr(region: HomeRegion): Array<Record<string, unknown>> {
  const clauses: Array<Record<string, unknown>> = region.neighborhoods.map((n) => ({
    AND: [{ neighborhood: n }, { city: region.city }, { state: region.state }],
  }));

  if (region.includeCityMatch) {
    clauses.push({
      AND: [{ city: region.city }, { state: region.state }],
    });
  }

  return clauses;
}

/**
 * Regiões que têm pelo menos um prestador nas localizações dadas
 * (para popular o seletor só com opções úteis na categoria).
 */
export function regionsPresentInLocations(
  locations: Array<{
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
  }>
): HomeRegionId[] {
  return HOME_REGIONS.filter((region) =>
    locations.some((loc) => locationMatchesRegion(loc, region))
  ).map((r) => r.id as HomeRegionId);
}
