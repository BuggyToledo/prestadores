/**
 * Mapa único Bairro/Região → bairros (e cidades opcionais).
 * Edite SÓ este arquivo para incluir/remover regiões ou bairros do filtro
 * (home + `/categoria/[slug]`). Não há cópia em outros módulos.
 *
 * Matching: `neighborhood`/`city` do prestador contém o nome (case-insensitive).
 * Prestadores com bairro nulo/vazio entram na listagem padrão e só saem
 * quando um filtro de região é aplicado (não batem no contains).
 */
export const HOME_REGIONS = [
  {
    id: 'zona-sul',
    label: 'Zona Sul',
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
    neighborhoods: ['Centro', 'Lapa', 'Santa Teresa', 'Saúde', 'Gamboa', 'Santo Cristo'],
  },
  {
    id: 'tijuca',
    label: 'Tijuca',
    neighborhoods: ['Tijuca', 'Vila Isabel', 'Maracanã', 'Andaraí', 'Grajaú', 'Praça da Bandeira'],
  },
  {
    id: 'barra-jacarepagua',
    label: 'Barra/Jacarepaguá',
    neighborhoods: [
      'Barra da Tijuca',
      'Jacarepaguá',
      'Recreio',
      'Recreio dos Bandeirantes',
      'Vargem Grande',
      'Vargem Pequena',
      'Itanhangá',
      'Taquara',
      'Freguesia',
    ],
  },
  {
    id: 'zona-norte',
    label: 'Zona Norte',
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
    cities: ['Niterói'],
    neighborhoods: ['Icaraí', 'Santa Rosa', 'Centro', 'São Francisco', 'Charitas', 'Pendotiba'],
  },
] as const;

export type HomeRegionId = (typeof HOME_REGIONS)[number]['id'];
export type HomeRegion = (typeof HOME_REGIONS)[number];

export function findHomeRegion(id?: string | null): HomeRegion | null {
  if (!id) return null;
  return HOME_REGIONS.find((r) => r.id === id) ?? null;
}

/** Prisma/mock OR clauses para filtrar prestadores de uma região. */
export function regionFilterOr(region: HomeRegion): Array<Record<string, unknown>> {
  const neighborhoodOr = region.neighborhoods.map((n) => ({
    neighborhood: { contains: n },
  }));
  const cityOr =
    'cities' in region && region.cities
      ? region.cities.map((c) => ({ city: { contains: c } }))
      : [];
  return [...neighborhoodOr, ...cityOr];
}

function locationMatchesRegion(
  loc: { neighborhood?: string | null; city?: string | null },
  region: HomeRegion
): boolean {
  const n = (loc.neighborhood || '').toLowerCase();
  const c = (loc.city || '').toLowerCase();
  if (n && region.neighborhoods.some((bn) => n.includes(bn.toLowerCase()))) {
    return true;
  }
  if (
    c &&
    'cities' in region &&
    region.cities &&
    region.cities.some((city) => c.includes(city.toLowerCase()))
  ) {
    return true;
  }
  return false;
}

/**
 * Regiões que têm pelo menos um prestador nas localizações dadas
 * (para popular o seletor só com opções úteis na categoria).
 */
export function regionsPresentInLocations(
  locations: Array<{ neighborhood?: string | null; city?: string | null }>
): HomeRegionId[] {
  return HOME_REGIONS.filter((region) =>
    locations.some((loc) => locationMatchesRegion(loc, region))
  ).map((r) => r.id);
}
