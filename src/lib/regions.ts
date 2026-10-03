/** Regiões do seletor da home — mapeiam para bairros/cidades no filtro. */
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

export function findHomeRegion(id?: string | null) {
  if (!id) return null;
  return HOME_REGIONS.find((r) => r.id === id) ?? null;
}
