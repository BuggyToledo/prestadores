/**
 * Catálogo de ícones das categorias do Guia Síndico Né!
 * SVGs estáticos em /public/icons/categories/{Name}.svg
 * Componentes Lucide via <CategoryIcon name="Building2" />.
 */

export type CategoryIconMeta = {
  name: string;
  label: string;
  svg: string;
};

export const CATEGORY_ICONS: CategoryIconMeta[] = [
  {
    name: 'Building2',
    label: 'Gestão Condominial e Imobiliária',
    svg: '/icons/categories/Building2.svg',
  },
  {
    name: 'Scale',
    label: 'Jurídico, Contábil e Seguros',
    svg: '/icons/categories/Scale.svg',
  },
  {
    name: 'HardHat',
    label: 'Obras, Engenharia e Laudos',
    svg: '/icons/categories/HardHat.svg',
  },
  {
    name: 'Wrench',
    label: 'Manutenção Predial e Instalações',
    svg: '/icons/categories/Wrench.svg',
  },
  {
    name: 'Flame',
    label: 'Segurança e Prevenção de Incêndio',
    svg: '/icons/categories/Flame.svg',
  },
  {
    name: 'Sparkles',
    label: 'Limpeza, Conservação e Controle de Pragas',
    svg: '/icons/categories/Sparkles.svg',
  },
  {
    name: 'Leaf',
    label: 'Resíduos, Meio Ambiente e Sustentabilidade',
    svg: '/icons/categories/Leaf.svg',
  },
  {
    name: 'Package',
    label: 'Materiais, Equipamentos e Locações',
    svg: '/icons/categories/Package.svg',
  },
  {
    name: 'Wifi',
    label: 'Tecnologia e Comunicação',
    svg: '/icons/categories/Wifi.svg',
  },
  {
    name: 'Users',
    label: 'Serviços Operacionais e Mão de Obra',
    svg: '/icons/categories/Users.svg',
  },
  {
    name: 'HeartPulse',
    label: 'Saúde, Bem-estar e Assistência Social',
    svg: '/icons/categories/HeartPulse.svg',
  },
  {
    name: 'Landmark',
    label: 'Órgãos Públicos, Emergências e Utilidades',
    svg: '/icons/categories/Landmark.svg',
  },
];

/** Ícones extras disponíveis no seletor do admin (além dos 12 padrão). */
export const EXTRA_ICONS = [
  'Shield',
  'ShieldAlert',
  'Briefcase',
  'Truck',
  'Home',
  'FileText',
  'Settings',
  'Heart',
  'Bug',
  'Recycle',
  'Zap',
  'Paintbrush',
  'Hammer',
  'Key',
  'Computer',
  'Camera',
  'Plug',
  'Car',
  'Wind',
  'Scissors',
] as const;

export const PRIMARY_ICON_NAMES = CATEGORY_ICONS.map((i) => i.name);

export const ALL_ICON_NAMES = [...PRIMARY_ICON_NAMES, ...EXTRA_ICONS];

export function getCategoryIconMeta(name?: string | null): CategoryIconMeta | null {
  if (!name) return null;
  return CATEGORY_ICONS.find((i) => i.name === name) || null;
}

export function getCategoryIconSvgPath(name?: string | null): string | null {
  const meta = getCategoryIconMeta(name);
  if (meta) return meta.svg;
  if (name && PRIMARY_ICON_NAMES.includes(name)) {
    return `/icons/categories/${name}.svg`;
  }
  return null;
}
