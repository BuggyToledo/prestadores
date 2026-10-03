/**
 * Mapa único Bairro/Região → bairros do Rio (nomes completos) + city/state.
 *
 * ## Como adicionar bairros
 * 1. Escolha a região em `HOME_REGIONS` (ou crie um novo bloco com `id`/`label`).
 * 2. Inclua o **nome completo** do bairro em `neighborhoods` (ex.: "Barra da Tijuca",
 *    nunca só "Barra" — evita capturar Barra Mansa / Barra do Piraí).
 * 3. Mantenha `city` e `state` corretos (`Rio de Janeiro`/`RJ` ou `Niterói`/`RJ`).
 * 4. O matching é **igualdade** do bairro (normalizado) **e** city/state
 *    (com inferência opcional quando cidade está vazia — ver abaixo).
 * 5. Edite **só este arquivo** — home e `/categoria/[slug]` leem daqui.
 *
 * ## Cidade vazia + bairro do Rio
 * Regra estrita: sem `city` o prestador **não** entrava no filtro.
 * Inferência (UI + query soft): se o bairro está na lista da região RJ,
 * `city` vazia, `state` vazio ou RJ, e DDD do telefone/WhatsApp ∈ {21,22,24}
 * → trata como Rio de Janeiro. Preferível preencher `city` no clean-data.
 *
 * Prestadores com bairro nulo/vazio entram na listagem padrão e só saem
 * quando um filtro de região é aplicado.
 */

export type RegionDef = {
  id: string;
  label: string;
  city: string;
  state: string;
  neighborhoods: readonly string[];
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

/** DDDs do estado do RJ usados na inferência de cidade. */
export const RJ_DDDS = new Set(['21', '22', '24']);

/** Só exibe seletor de região se cobertura matchable ≥ este valor (0–1). */
export const REGION_FILTER_MIN_COVERAGE = 0.25;

export type LocationCoverage = {
  total: number;
  withNeighborhood: number;
  withCity: number;
  withBoth: number;
  pctNeighborhood: number;
  pctCity: number;
  pctBoth: number;
  /** Bairro+cidade OU inferível (bairro na lista + DDD RJ / state RJ). */
  matchable: number;
  pctMatchable: number;
};

export type LocInput = {
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

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

/** Extrai DDD BR de telefone/WhatsApp (21… ou 5521…). */
export function extractDdd(phone?: string | null, whatsapp?: string | null): string | null {
  const raw = String(whatsapp || phone || '').replace(/\D/g, '');
  if (!raw) return null;
  if (raw.startsWith('55') && raw.length >= 12) return raw.slice(2, 4);
  if (raw.length >= 10) return raw.slice(0, 2);
  return null;
}

function neighborhoodInRegion(neighborhood: string | null | undefined, region: HomeRegion): boolean {
  const n = normalizePlace(neighborhood);
  if (!n) return false;
  return region.neighborhoods.some((bn) => normalizePlace(bn) === n);
}

/**
 * Inferência: cidade vazia + bairro na região RJ + (DDD 21/22/24 ou state RJ).
 * Usada no matching em memória e sugerida no clean-data.
 */
export function canInferRegionCity(loc: LocInput, region: HomeRegion): boolean {
  if (normalizePlace(loc.city)) return false;
  if (normalizePlace(region.state) !== 'rj') return false;
  if (!neighborhoodInRegion(loc.neighborhood, region) && !region.includeCityMatch) return false;

  const state = normalizePlace(loc.state);
  if (state && state !== 'rj') return false;

  const ddd = extractDdd(loc.phone, loc.whatsapp);
  if (ddd && RJ_DDDS.has(ddd)) return true;
  // Sem telefone: só se state já é RJ
  if (state === 'rj' && neighborhoodInRegion(loc.neighborhood, region)) return true;
  return false;
}

function cityStateMatch(loc: LocInput, region: HomeRegion): boolean {
  const cityRaw = normalizePlace(loc.city);
  const stateRaw = normalizePlace(loc.state);

  if (cityRaw === normalizePlace(region.city)) {
    return !stateRaw || stateRaw === normalizePlace(region.state);
  }

  return canInferRegionCity(loc, region);
}

/**
 * Matching em memória: bairro por igualdade normalizada + city/state
 * (ou inferência DDD quando city vazia).
 */
export function locationMatchesRegion(loc: LocInput, region: HomeRegion): boolean {
  if (!cityStateMatch(loc, region)) return false;

  if (region.includeCityMatch) {
    // Município inteiro (Niterói): city ok ou inferido
    return true;
  }

  return neighborhoodInRegion(loc.neighborhood, region);
}

/**
 * Cláusulas Prisma/mock.
 * Inclui caminho soft: city null/'' + state RJ/null + bairro exato.
 * (DDD não é filtrável com segurança em SQL — clean-data deve preencher city.)
 */
export function regionFilterOr(region: HomeRegion): Array<Record<string, unknown>> {
  const clauses: Array<Record<string, unknown>> = [];

  for (const n of region.neighborhoods) {
    clauses.push({
      AND: [{ neighborhood: n }, { city: region.city }, { state: region.state }],
    });
    clauses.push({
      AND: [
        { neighborhood: n },
        { OR: [{ city: null }, { city: '' }] },
        { OR: [{ state: region.state }, { state: null }, { state: '' }] },
      ],
    });
  }

  if (region.includeCityMatch) {
    clauses.push({
      AND: [{ city: region.city }, { state: region.state }],
    });
  }

  return clauses;
}

export function regionsPresentInLocations(locations: LocInput[]): HomeRegionId[] {
  return HOME_REGIONS.filter((region) =>
    locations.some((loc) => locationMatchesRegion(loc, region))
  ).map((r) => r.id as HomeRegionId);
}

/** Métricas de preenchimento + matchability para gate do filtro de região. */
export function computeLocationCoverage(locations: LocInput[]): LocationCoverage {
  const total = locations.length;
  let withNeighborhood = 0;
  let withCity = 0;
  let withBoth = 0;
  let matchable = 0;

  for (const loc of locations) {
    const hasN = Boolean(normalizePlace(loc.neighborhood));
    const hasC = Boolean(normalizePlace(loc.city));
    if (hasN) withNeighborhood++;
    if (hasC) withCity++;
    if (hasN && hasC) withBoth++;
    if (HOME_REGIONS.some((r) => locationMatchesRegion(loc, r))) matchable++;
  }

  const pct = (n: number) => (total === 0 ? 0 : n / total);

  return {
    total,
    withNeighborhood,
    withCity,
    withBoth,
    pctNeighborhood: pct(withNeighborhood),
    pctCity: pct(withCity),
    pctBoth: pct(withBoth),
    matchable,
    pctMatchable: pct(matchable),
  };
}

export function shouldShowRegionFilter(
  coverage: LocationCoverage,
  availableRegionIds: readonly string[]
): boolean {
  return (
    availableRegionIds.length > 0 && coverage.pctMatchable >= REGION_FILTER_MIN_COVERAGE
  );
}

/** Lista plana de bairros do município Rio de Janeiro (para clean-data). */
export function allRioNeighborhoods(): string[] {
  return HOME_REGIONS.filter((r) => r.city === 'Rio de Janeiro').flatMap((r) => [
    ...r.neighborhoods,
  ]);
}

/**
 * Sugere city/state quando bairro está no mapa RJ e DDD é 21/22/24.
 */
export function suggestCityFromNeighborhoodAndDdd(loc: LocInput): {
  city: string;
  state: string;
} | null {
  const n = normalizePlace(loc.neighborhood);
  if (!n || normalizePlace(loc.city)) return null;
  const ddd = extractDdd(loc.phone, loc.whatsapp);
  if (!ddd || !RJ_DDDS.has(ddd)) return null;

  for (const region of HOME_REGIONS) {
    if (neighborhoodInRegion(loc.neighborhood, region)) {
      return { city: region.city, state: region.state };
    }
  }
  return null;
}
