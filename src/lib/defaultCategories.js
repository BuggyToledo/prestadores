/**
 * Categorias padrão do Guia Síndico Né!
 * Usado pelo seed (MySQL) e pelo mock local — sem subcategorias.
 */
const DEFAULT_CATEGORIES = [
  {
    id: 'cat_gestao_condominial',
    name: 'Gestão Condominial e Imobiliária',
    slug: 'gestao-condominial-e-imobiliaria',
    description:
      'Administradoras, síndicos profissionais, consultoria condominial, avaliação e gestão imobiliária.',
    icon: 'Building2',
    order: 1,
  },
  {
    id: 'cat_juridico_contabil',
    name: 'Jurídico, Contábil e Seguros',
    slug: 'juridico-contabil-e-seguros',
    description:
      'Advocacia condominial, contabilidade, auditoria, seguros prediais e assessoria jurídica.',
    icon: 'Scale',
    order: 2,
  },
  {
    id: 'cat_obras_engenharia',
    name: 'Obras, Engenharia e Laudos',
    slug: 'obras-engenharia-e-laudos',
    description:
      'Engenharia civil, reformas, laudos técnicos, perícias, projetos e acompanhamento de obras.',
    icon: 'HardHat',
    order: 3,
  },
  {
    id: 'cat_manutencao_predial',
    name: 'Manutenção Predial e Instalações',
    slug: 'manutencao-predial-e-instalacoes',
    description:
      'Elétrica, hidráulica, elevadores, ar-condicionado, portões, bombas e manutenção geral predial.',
    icon: 'Wrench',
    order: 4,
  },
  {
    id: 'cat_seguranca_incendio',
    name: 'Segurança e Prevenção de Incêndio',
    slug: 'seguranca-e-prevencao-de-incendio',
    description:
      'Brigada, extintores, SPDA, CFTV, portaria, controle de acesso e sistemas de alarme.',
    icon: 'Flame',
    order: 5,
  },
  {
    id: 'cat_limpeza_pragas',
    name: 'Limpeza, Conservação e Controle de Pragas',
    slug: 'limpeza-conservacao-e-controle-de-pragas',
    description:
      'Limpeza predial, conservação de áreas comuns, dedetização, desratização e higienização.',
    icon: 'Sparkles',
    order: 6,
  },
  {
    id: 'cat_residuos_ambiente',
    name: 'Resíduos, Meio Ambiente e Sustentabilidade',
    slug: 'residuos-meio-ambiente-e-sustentabilidade',
    description:
      'Coleta seletiva, gestão de resíduos, reciclagem, eficiência energética e práticas sustentáveis.',
    icon: 'Leaf',
    order: 7,
  },
  {
    id: 'cat_materiais_locacoes',
    name: 'Materiais, Equipamentos e Locações',
    slug: 'materiais-equipamentos-e-locacoes',
    description:
      'Fornecimento de materiais de construção, equipamentos e locação para condomínios e obras.',
    icon: 'Package',
    order: 8,
  },
  {
    id: 'cat_tecnologia_comunicacao',
    name: 'Tecnologia e Comunicação',
    slug: 'tecnologia-e-comunicacao',
    description:
      'Automação, internet, interfonia, software de gestão condominial e infraestrutura de TI.',
    icon: 'Wifi',
    order: 9,
  },
  {
    id: 'cat_servicos_operacionais',
    name: 'Serviços Operacionais e Mão de Obra',
    slug: 'servicos-operacionais-e-mao-de-obra',
    description:
      'Zeladoria, jardinagem, mão de obra especializada, serviços gerais e apoio operacional.',
    icon: 'Users',
    order: 10,
  },
  {
    id: 'cat_saude_bem_estar',
    name: 'Saúde, Bem-estar e Assistência Social',
    slug: 'saude-bem-estar-e-assistencia-social',
    description:
      'Saúde ocupacional, bem-estar, assistência social e serviços de apoio à comunidade condominial.',
    icon: 'HeartPulse',
    order: 11,
  },
  {
    id: 'cat_orgaos_emergencias',
    name: 'Órgãos Públicos, Emergências e Utilidades',
    slug: 'orgaos-publicos-emergencias-e-utilidades',
    description:
      'Contatos úteis de órgãos públicos, emergências, concessionárias e serviços de utilidade pública.',
    icon: 'Landmark',
    order: 12,
  },
];

module.exports = { DEFAULT_CATEGORIES };
