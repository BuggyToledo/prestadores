import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Types for in-memory models
export interface MockUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'EDITOR';
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAuditLog {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  createdAt: Date;
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockSubcategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockProvider {
  id: string;
  name: string;
  displayName?: string | null;
  slug: string;
  cnpj: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  zipCode: string | null;
  description: string | null;
  services: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  viewsCount: number;
  kind?: 'prestador' | 'utilidade_publica';
  trustTier?: 'cadastrado' | 'documentado' | 'oficial';
  serves24h?: boolean;
  issuesNfe?: boolean;
  acceptsInvoicingTerms?: boolean;
  needsReview?: boolean;
  reviewNotes?: string | null;
  categoryId: string;
  subcategoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  target: string;
  position: 'HERO_TOP' | 'MIDDLE' | 'SIDEBAR' | 'FOOTER';
  isActive: boolean;
  order: number;
  clicksCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockDatabase {
  users: MockUser[];
  categories: MockCategory[];
  subcategories: MockSubcategory[];
  providers: MockProvider[];
  banners: MockBanner[];
  auditLogs: MockAuditLog[];
}

function initializeMockDb(): MockDatabase {
  const users: MockUser[] = [];
  const seedPassword = process.env.ADMIN_PASSWORD;
  const seedEmail = (process.env.ADMIN_EMAIL || 'admin@localhost').trim().toLowerCase();

  if (seedPassword && seedPassword.length >= 12) {
    users.push({
      id: 'usr_admin_1',
      name: process.env.ADMIN_NAME || 'Administrador',
      email: seedEmail,
      passwordHash: bcrypt.hashSync(seedPassword, 10),
      role: 'ADMIN',
      sessionVersion: 0,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    });
  }

  const categories: MockCategory[] = [
    {
      id: 'cat_eletricistas',
      name: 'Eletricistas',
      slug: 'eletricistas',
      description: 'Instalação elétrica, reparos em disjuntores, fiação, iluminação residencial e industrial.',
      icon: 'Zap',
      order: 1,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cat_encanadores',
      name: 'Encanadores e Desentupidoras',
      slug: 'encanadores',
      description: 'Conserto de vazamentos, desentupimento, instalação de louças e tubulações hidráulicas.',
      icon: 'Wrench',
      order: 2,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cat_pintores',
      name: 'Pintores e Acabamentos',
      slug: 'pintores',
      description: 'Pintura residencial, predial, texturas, massa corrida, impermeabilização e verniz.',
      icon: 'Paintbrush',
      order: 3,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cat_ar_condicionado',
      name: 'Ar-Condicionado e Refrigeração',
      slug: 'ar-condicionado',
      description: 'Instalação, limpeza, manutenção preventiva e recarga de gás para ar-condicionado.',
      icon: 'Wind',
      order: 4,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cat_chaveiros',
      name: 'Chaveiros 24 Horas',
      slug: 'chaveiros',
      description: 'Abertura de portas, cópia de chaves codificadas, troca de fechaduras residenciais e automotivas.',
      icon: 'Key',
      order: 5,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cat_marcenaria',
      name: 'Marcenaria e Móveis Planejados',
      slug: 'marcenaria',
      description: 'Fabricação e conserto de móveis sob medida, restauração e montagem de móveis.',
      icon: 'Hammer',
      order: 6,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cat_mecanica',
      name: 'Mecânica e Auto Center',
      slug: 'mecanica',
      description: 'Revisão mecânica, suspensão, freios, injeção eletrônica, alinhamento e balanceamento.',
      icon: 'Car',
      order: 7,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cat_limpeza',
      name: 'Limpeza e Diaristas',
      slug: 'limpeza',
      description: 'Serviços de faxina residencial, limpeza pós-obra, higienização de estofados e tapetes.',
      icon: 'Sparkles',
      order: 8,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ];

  const subcategories: MockSubcategory[] = [
    { id: 'sub_elet_1', name: 'Instalação e Reparos', slug: 'elet-instalacao-reparos', description: null, order: 1, categoryId: 'cat_eletricistas', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_elet_2', name: 'Laudos e SPDA', slug: 'elet-laudos-spda', description: null, order: 2, categoryId: 'cat_eletricistas', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_elet_3', name: 'Padrão de Entrada', slug: 'elet-padrao-entrada', description: null, order: 3, categoryId: 'cat_eletricistas', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_enc_1', name: 'Caça-Vazamentos', slug: 'enc-caca-vazamentos', description: null, order: 1, categoryId: 'cat_encanadores', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_enc_2', name: 'Desentupimentos', slug: 'enc-desentupimentos', description: null, order: 2, categoryId: 'cat_encanadores', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_enc_3', name: 'Prumadas e Tubulações', slug: 'enc-prumadas-tubulacoes', description: null, order: 3, categoryId: 'cat_encanadores', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_pint_1', name: 'Pintura Residencial', slug: 'pint-residencial', description: null, order: 1, categoryId: 'cat_pintores', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_pint_2', name: 'Restauração de Fachadas', slug: 'pint-fachadas', description: null, order: 2, categoryId: 'cat_pintores', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_ar_1', name: 'Instalação de Split', slug: 'ar-instalacao-split', description: null, order: 1, categoryId: 'cat_ar-condicionado', createdAt: new Date(), updatedAt: new Date() },
    { id: 'sub_ar_2', name: 'Higienização e PMOC', slug: 'ar-higienizacao-pmoc', description: null, order: 2, categoryId: 'cat_ar-condicionado', createdAt: new Date(), updatedAt: new Date() },
  ];

  const providers: MockProvider[] = [
    {
      id: 'prov_eletrosilva',
      name: 'EletroSilva Serviços Elétricos',
      slug: 'eletrosilva-servicos-eletricos',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 3456-7890',
      whatsapp: '11987654321',
      email: 'contato@eletrosilva.com.br',
      website: 'https://eletrosilva.com.br',
      instagram: '@eletrosilva_eletrica',
      address: 'Rua Voluntários da Pátria, 150',
      neighborhood: 'Botafogo',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22270-000',
      description: 'Especialistas em instalações elétricas residenciais e comerciais. Atendimento emergencial 24 horas, troca de disjuntores, adequação de padrão de entrada e projetos luminotécnicos com garantia e emissão de ART.',
      services: 'Instalação de tomadas e interruptores, Troca de fiação antiga, Instalação de chuveiros e aquecedores, Laudo elétrico, Montagem de quadros de distribuição',
      logoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
      coverUrl: null,
      isFeatured: true,
      isActive: true,
      viewsCount: 142,
      categoryId: 'cat_eletricistas',
      createdAt: new Date('2024-01-10T10:00:00Z'),
      updatedAt: new Date('2024-01-10T10:00:00Z'),
    },
    {
      id: 'prov_eletro_sem_bairro',
      name: 'Eletricista Sem Bairro Demo',
      slug: 'eletricista-sem-bairro-demo',
      cnpj: null,
      phone: '(21) 3333-4444',
      whatsapp: '21988887777',
      email: null,
      website: null,
      instagram: null,
      address: null,
      neighborhood: null,
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: null,
      description: 'Prestador de demonstração sem bairro — permanece na listagem padrão e sai só com filtro de região.',
      services: 'Instalações elétricas',
      logoUrl: null,
      coverUrl: null,
      isFeatured: false,
      isActive: true,
      viewsCount: 0,
      categoryId: 'cat_eletricistas',
      createdAt: new Date('2024-01-11T10:00:00Z'),
      updatedAt: new Date('2024-01-11T10:00:00Z'),
    },
    {
      id: 'prov_sos_agua_limpa',
      name: 'SOS Desentupidora & Hidráulica Água Limpa',
      slug: 'sos-desentupidora-hidraulica-agua-limpa',
      cnpj: '23.456.789/0001-01',
      phone: '(11) 4002-8922',
      whatsapp: '11999887766',
      email: 'atendimento@agualimpadesentupimento.com',
      website: 'https://agualimpadesentupimento.com',
      instagram: '@desentupidora_agualimpa',
      address: 'Rua Barata Ribeiro, 200, Sala 42',
      neighborhood: 'Copacabana',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22040-000',
      description: 'Serviço rápido de caça-vazamentos não destrutivo com geofone, desentupimento de pias, ralos, vasos sanitários e redes de esgoto pluvial. Atendimento 24h sem taxa de visita.',
      services: 'Caça vazamentos eletrônico, Desentupimento por hidrojateamento, Troca de tubulação, Instalação de válvulas de descarga, Limpeza de caixa de gordura',
      logoUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop&q=80',
      coverUrl: null,
      isFeatured: true,
      isActive: true,
      viewsCount: 98,
      categoryId: 'cat_encanadores',
      createdAt: new Date('2024-01-12T11:00:00Z'),
      updatedAt: new Date('2024-01-12T11:00:00Z'),
    },
    {
      id: 'prov_arte_cor',
      name: 'Arte & Cor Pinturas Profissionais',
      slug: 'arte-cor-pinturas-profissionais',
      cnpj: '34.567.890/0001-12',
      phone: '(11) 2233-4455',
      whatsapp: '11977112233',
      email: 'orcamento@arteecorpinturas.com.br',
      website: 'https://arteecorpinturas.com.br',
      instagram: '@artecor.pinturas',
      address: 'Rua Conde de Bonfim, 850',
      neighborhood: 'Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20520-000',
      description: 'Equipe especializada em pintura de alto padrão, aplicação de cimento queimado, efeitos decorativos, restauração de fachadas e impermeabilização. Trabalhamos com limpeza total e proteção de todo o ambiente.',
      services: 'Pintura interna e externa, Aplicação de cimento queimado e texturas, Massa corrida e gesso, Laqueação de portas e janelas, Verniz em decks e pergolados',
      logoUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80',
      coverUrl: null,
      isFeatured: false,
      isActive: true,
      viewsCount: 65,
      categoryId: 'cat_pintores',
      createdAt: new Date('2024-01-15T09:30:00Z'),
      updatedAt: new Date('2024-01-15T09:30:00Z'),
    },
    {
      id: 'prov_climafrio',
      name: 'ClimaFrio Refrigeração e Ar-Condicionado',
      slug: 'climafrio-refrigeracao-ar-condicionado',
      cnpj: '45.678.901/0001-23',
      phone: '(11) 3344-5566',
      whatsapp: '11988223344',
      email: 'contato@climafrio.com.br',
      website: 'https://climafrio.com.br',
      instagram: '@climafrio_refrigeracao',
      address: 'Av. das Américas, 1200',
      neighborhood: 'Barra da Tijuca',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22640-100',
      description: 'Venda, instalação e manutenção de sistemas de climatização Split, Multi Split e VRF. Higienização antibactericida completa e contratos PMOC para empresas.',
      services: 'Instalação de Ar-Condicionado Split e Inverter, Higienização profunda com laudo, Carga de gás ecológico R410/R32, Manutenção de placas eletrônicas',
      logoUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&auto=format&fit=crop&q=80',
      coverUrl: null,
      isFeatured: true,
      isActive: true,
      viewsCount: 112,
      categoryId: 'cat_ar_condicionado',
      createdAt: new Date('2024-01-18T14:15:00Z'),
      updatedAt: new Date('2024-01-18T14:15:00Z'),
    },
    {
      id: 'prov_chaveiro_express',
      name: 'Chaveiro Express Central 24h',
      slug: 'chaveiro-express-central-24h',
      cnpj: '56.789.012/0001-34',
      phone: '(11) 3100-2020',
      whatsapp: '11991112222',
      email: 'socorro@chaveiroexpress24h.com',
      website: 'https://chaveiroexpress24h.com',
      instagram: '@chaveiro_express24',
      address: 'Av. Rio Branco, 500',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20040-020',
      description: 'Unidade móvel de atendimento rápido em até 20 minutos para aberturas residenciais e automotivas, confecção de chaves pantográficas e canivete, troca de segredos e fechaduras digitais.',
      services: 'Abertura de portas e cofres, Chaves codificadas automotivas, Instalação de fechaduras biométricas/digitais, Troca de cilindro e segredo',
      logoUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=80',
      coverUrl: null,
      isFeatured: false,
      isActive: true,
      viewsCount: 77,
      categoryId: 'cat_chaveiros',
      createdAt: new Date('2024-01-20T16:00:00Z'),
      updatedAt: new Date('2024-01-20T16:00:00Z'),
    },
    {
      id: 'prov_studio_nobre',
      name: 'Studio Nobre Móveis Planejados',
      slug: 'studio-nobre-moveis-planejados',
      cnpj: '67.890.123/0001-45',
      phone: '(11) 2589-7412',
      whatsapp: '11984445555',
      email: 'projetos@studionobremarcenaria.com.br',
      website: 'https://studionobremarcenaria.com.br',
      instagram: '@studionobre_moveis',
      address: 'Rua Moreira César, 680',
      neighborhood: 'Icaraí',
      city: 'Niterói',
      state: 'RJ',
      zipCode: '24230-050',
      description: 'Marcenaria fina com tecnologia de ponta. Criamos cozinhas planejadas, closets, home theaters e mobiliário corporativo com acabamentos exclusivos em MDF 100%, amortecimento e iluminação embutida em LED.',
      services: 'Cozinhas planejadas, Dormitórios e closets, Painéis ripados e divisórias, Mobiliário corporativo, Consultoria de projetos 3D',
      logoUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop&q=80',
      coverUrl: null,
      isFeatured: true,
      isActive: true,
      viewsCount: 89,
      categoryId: 'cat_marcenaria',
      createdAt: new Date('2024-01-22T08:00:00Z'),
      updatedAt: new Date('2024-01-22T08:00:00Z'),
    },
    {
      id: 'prov_cleanmaster',
      name: 'CleanMaster Higienização & Limpeza Profissional',
      slug: 'cleanmaster-higienizacao-limpeza-profissional',
      cnpj: '78.901.234/0001-56',
      phone: '(11) 3211-9876',
      whatsapp: '11993334444',
      email: 'contato@cleanmasterlimpeza.com.br',
      website: 'https://cleanmasterlimpeza.com.br',
      instagram: '@cleanmaster_higienizacao',
      address: 'Rua Dias da Cruz, 1800',
      neighborhood: 'Méier',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20720-012',
      description: 'Empresa especializada em limpeza pós-obra, higienização e impermeabilização de estofados, colchões, sofás e carpetes com produtos ecológicos certificados pela Anvisa.',
      services: 'Limpeza pós-obra fina e pesada, Higienização de sofás e poltronas a seco, Impermeabilização de estofados, Limpeza de vidros em altura, Tratamento de pisos',
      logoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
      coverUrl: null,
      isFeatured: false,
      isActive: true,
      viewsCount: 54,
      categoryId: 'cat_limpeza',
      createdAt: new Date('2024-01-25T11:45:00Z'),
      updatedAt: new Date('2024-01-25T11:45:00Z'),
    },
  ];

  const banners: MockBanner[] = [
    {
      id: 'ban_hero_1',
      title: 'Anuncie Aqui seu Negócio - Espaço de Destaque',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
      linkUrl: 'https://wa.me/5511999998888?text=Ola,%20gostaria%20de%20anunciar%20no%20Catalogo!',
      target: '_blank',
      position: 'HERO_TOP',
      isActive: true,
      order: 1,
      clicksCount: 28,
      viewsCount: 340,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'ban_middle_1',
      title: 'Desconto Especial em Manutenção Predial e Reformas',
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      linkUrl: 'https://wa.me/5511999998888?text=Quero%20aproveitar%20o%20desconto%20especial',
      target: '_blank',
      position: 'MIDDLE',
      isActive: true,
      order: 1,
      clicksCount: 15,
      viewsCount: 210,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ];

  return { users, categories, subcategories, providers, banners, auditLogs: [] };
}

let idSequence = 0;
export function generateUniqueId(prefix: string): string {
  idSequence++;
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${idSequence}_${rand}`;
}

export function sanitizeAndDeduplicateDb(mockDb: MockDatabase) {
  const seenCategoryIds = new Set<string>();
  for (let i = 0; i < mockDb.categories.length; i++) {
    const cat = mockDb.categories[i];
    if (!cat.id || seenCategoryIds.has(cat.id)) {
      cat.id = generateUniqueId('cat');
    }
    seenCategoryIds.add(cat.id);
  }

  const seenProviderIds = new Set<string>();
  for (let i = 0; i < mockDb.providers.length; i++) {
    const prov = mockDb.providers[i];
    if (!prov.id || seenProviderIds.has(prov.id)) {
      prov.id = generateUniqueId('prov');
    }
    seenProviderIds.add(prov.id);
  }
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'database.json');

export function saveDbToDisk(mockDb: MockDatabase) {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(mockDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Prisma Persistence] Error saving database to disk:', err);
  }
}

function loadDbFromDisk(): MockDatabase | null {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.providers) && Array.isArray(parsed.categories)) {
        parsed.users?.forEach((u: any) => {
          u.createdAt = new Date(u.createdAt);
          u.updatedAt = new Date(u.updatedAt);
        });
        parsed.categories?.forEach((c: any) => {
          c.createdAt = new Date(c.createdAt);
          c.updatedAt = new Date(c.updatedAt);
        });
        parsed.subcategories?.forEach((s: any) => {
          s.createdAt = new Date(s.createdAt);
          s.updatedAt = new Date(s.updatedAt);
        });
        parsed.providers?.forEach((p: any) => {
          p.createdAt = new Date(p.createdAt);
          p.updatedAt = new Date(p.updatedAt);
        });
        parsed.banners?.forEach((b: any) => {
          b.createdAt = new Date(b.createdAt);
          b.updatedAt = new Date(b.updatedAt);
        });
        if (!parsed.subcategories) parsed.subcategories = [];
        if (!parsed.banners) parsed.banners = [];
        return parsed as MockDatabase;
      }
    }
  } catch (err) {
    console.error('[Prisma Persistence] Error reading database from disk:', err);
  }
  return null;
}

// Global persistence across Next.js dev reloads
const globalForDb = globalThis as unknown as {
  __mockDatabase?: MockDatabase;
};

if (!globalForDb.__mockDatabase) {
  const diskData = loadDbFromDisk();
  if (diskData) {
    globalForDb.__mockDatabase = diskData;
  } else {
    globalForDb.__mockDatabase = initializeMockDb();
    saveDbToDisk(globalForDb.__mockDatabase);
  }
}

const db = globalForDb.__mockDatabase!;
if (!db.subcategories) {
  db.subcategories = [];
}
if (!db.banners) {
  db.banners = [];
}
if (!db.auditLogs) {
  db.auditLogs = [];
}
for (const u of db.users) {
  if (typeof u.sessionVersion !== 'number') u.sessionVersion = 0;
}
sanitizeAndDeduplicateDb(db);

export function getMockDatabase(): MockDatabase {
  return db;
}

function matchesWhere(item: any, where: any, dbRef: MockDatabase): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR') {
      const orClauses = value as any[];
      if (!Array.isArray(orClauses) || orClauses.length === 0) continue;
      const matchedAny = orClauses.some((clause) => matchesWhere(item, clause, dbRef));
      if (!matchedAny) return false;
      continue;
    }

    if (key === 'AND') {
      const andClauses = value as any[];
      if (!Array.isArray(andClauses) || andClauses.length === 0) continue;
      const matchedAll = andClauses.every((clause) => matchesWhere(item, clause, dbRef));
      if (!matchedAll) return false;
      continue;
    }

    if (key === 'category') {
      const cat = dbRef.categories.find((c) => c.id === item.categoryId);
      if (!cat) return false;
      if (!matchesWhere(cat, value, dbRef)) return false;
      continue;
    }

    if (key === 'subcategory') {
      const sub = dbRef.subcategories.find((s) => s.id === item.subcategoryId);
      if (!sub) return false;
      if (!matchesWhere(sub, value, dbRef)) return false;
      continue;
    }

    const itemVal = item[key];

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if ('contains' in value) {
        const needle = String((value as any).contains).toLowerCase();
        const haystack = String(itemVal || '').toLowerCase();
        if (!haystack.includes(needle)) return false;
        continue;
      }
      if ('not' in value) {
        const notVal = (value as any).not;
        if (itemVal === notVal) return false;
        continue;
      }
    }

    if (itemVal !== value) {
      if (typeof itemVal === 'string' && typeof value === 'string') {
        if (itemVal.toLowerCase() !== value.toLowerCase()) return false;
      } else {
        return false;
      }
    }
  }

  return true;
}

function sortItems<T>(items: T[], orderBy: any): T[] {
  if (!orderBy) return items;

  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];

  return [...items].sort((a: any, b: any) => {
    for (const order of orders) {
      for (const [k, dir] of Object.entries(order)) {
        const valA = a[k];
        const valB = b[k];
        const multiplier = (dir as string).toLowerCase() === 'desc' ? -1 : 1;

        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          if (valA !== valB) {
            return (valA ? 1 : -1) * multiplier;
          }
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          if (valA !== valB) {
            return (valA - valB) * multiplier;
          }
        } else if (valA instanceof Date && valB instanceof Date) {
          if (valA.getTime() !== valB.getTime()) {
            return (valA.getTime() - valB.getTime()) * multiplier;
          }
        } else {
          const comp = String(valA || '').localeCompare(String(valB || ''));
          if (comp !== 0) {
            return comp * multiplier;
          }
        }
      }
    }
    return 0;
  });
}

function attachCategory(provider: MockProvider, include?: any) {
  const res: any = { ...provider };
  if (include?.category) {
    const cat = db.categories.find((c) => c.id === provider.categoryId);
    if (include.category.select) {
      const sel = include.category.select;
      const selected: any = {};
      for (const key of Object.keys(sel)) {
        if (sel[key]) selected[key] = (cat as any)?.[key];
      }
      res.category = selected;
    } else {
      res.category = cat ? { ...cat } : null;
    }
  }

  if (include?.subcategory) {
    const sub = db.subcategories.find((s) => s.id === provider.subcategoryId);
    if (include.subcategory.select) {
      const sel = include.subcategory.select;
      const selected: any = {};
      for (const key of Object.keys(sel)) {
        if (sel[key]) selected[key] = (sub as any)?.[key];
      }
      res.subcategory = selected;
    } else {
      res.subcategory = sub ? { ...sub } : null;
    }
  }

  return res;
}

function attachCategoryProviders(category: MockCategory, include?: any) {
  const result: any = { ...category };

  if (include?.subcategories) {
    result.subcategories = db.subcategories.filter((s) => s.categoryId === category.id);
  }

  if (include?._count) {
    const pWhere = include._count.select?.providers?.where;
    const count = db.providers.filter((p) => {
      if (p.categoryId !== category.id) return false;
      if (pWhere && !matchesWhere(p, pWhere, db)) return false;
      return true;
    }).length;
    result._count = {
      providers: count,
      subcategories: db.subcategories.filter((s) => s.categoryId === category.id).length,
    };
  }

  if (include?.providers) {
    const provOptions = typeof include.providers === 'object' ? include.providers : {};
    let provList = db.providers.filter((p) => p.categoryId === category.id);
    if (provOptions.where) {
      provList = provList.filter((p) => matchesWhere(p, provOptions.where, db));
    }
    if (provOptions.orderBy) {
      provList = sortItems(provList, provOptions.orderBy);
    }
    if (provOptions.include?.category) {
      provList = provList.map((p) => attachCategory(p, { category: true }));
    }
    result.providers = provList;
  }

  return result;
}

const shouldUseRealPrisma = Boolean(process.env.DATABASE_URL) && process.env.USE_REAL_PRISMA !== 'false';

let globalPrismaClient: PrismaClient | null = null;
if (shouldUseRealPrisma) {
  try {
    const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient };
    if (!globalForPrisma.prismaClient) {
      globalForPrisma.prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    }
    globalPrismaClient = globalForPrisma.prismaClient;
  } catch (e) {
    console.warn('[Prisma] Error creating PrismaClient instance, falling back to mock:', e);
  }
}

function createSafePrismaClient(realClient: PrismaClient, fallbackMock: any): PrismaClient {
  return new Proxy(fallbackMock, {
    get(target, prop) {
      if (prop === '$disconnect') {
        return async () => {
          try {
            await realClient.$disconnect();
          } catch {}
        };
      }
      const realTarget = (realClient as any)[prop];
      const mockTarget = target[prop];

      if (!realTarget) return mockTarget;
      if (typeof realTarget === 'function') {
        return async (...args: any[]) => {
          try {
            return await realTarget.apply(realClient, args);
          } catch (err: any) {
            console.warn(`[Prisma Safe Mode] Fallback on ${String(prop)}:`, err?.message || err);
            return typeof mockTarget === 'function' ? mockTarget.apply(target, args) : mockTarget;
          }
        };
      }

      // If it's a model like user, category, provider
      return new Proxy(mockTarget || {}, {
        get(mTarget, mProp) {
          const realMethod = realTarget[mProp];
          const mockMethod = mTarget[mProp];
          if (typeof realMethod !== 'function') return mockMethod;

          return async (...args: any[]) => {
            try {
              return await realMethod.apply(realTarget, args);
            } catch (err: any) {
              console.warn(
                `[Prisma Safe Mode] Connection failed on ${String(prop)}.${String(mProp)}, using in-memory store:`,
                err?.message || err
              );
              if (typeof mockMethod === 'function') {
                return await mockMethod.apply(mTarget, args);
              }
              return null;
            }
          };
        },
      });
    },
  });
}

const mockPrisma = {
  $disconnect: async () => {},

  user: {
    findUnique: async (args: { where: any; select?: any }) => {
      const u = db.users.find((user) => matchesWhere(user, args.where, db));
      if (!u) return null;
      if (args.select) {
        const out: any = {};
        for (const k of Object.keys(args.select)) {
          if (args.select[k]) out[k] = (u as any)[k];
        }
        return out;
      }
      return { ...u };
    },

    findFirst: async (args?: { where?: any }) => {
      const u = db.users.find((user) => matchesWhere(user, args?.where, db));
      return u ? { ...u } : null;
    },

    create: async (args: { data: any }) => {
      const now = new Date();
      const newUser: MockUser = {
        id: args.data.id || generateUniqueId('usr'),
        name: args.data.name,
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        role: args.data.role || 'ADMIN',
        sessionVersion: args.data.sessionVersion ?? 0,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(newUser);
      saveDbToDisk(db);
      return { ...newUser };
    },

    update: async (args: { where: any; data: any }) => {
      const idx = db.users.findIndex((user) => matchesWhere(user, args.where, db));
      if (idx < 0) throw new Error('User not found');
      const current = db.users[idx];
      const updated: MockUser = {
        ...current,
        ...args.data,
        sessionVersion:
          typeof args.data.sessionVersion === 'number'
            ? args.data.sessionVersion
            : args.data.sessionVersion?.increment != null
              ? (current.sessionVersion || 0) + Number(args.data.sessionVersion.increment)
              : current.sessionVersion || 0,
        updatedAt: new Date(),
      };
      // Prisma increment style: data: { sessionVersion: { increment: 1 } }
      if (args.data.sessionVersion && typeof args.data.sessionVersion === 'object') {
        delete (updated as any).sessionVersion;
        updated.sessionVersion =
          (current.sessionVersion || 0) + Number(args.data.sessionVersion.increment || 0);
      }
      if (args.data.passwordHash) updated.passwordHash = args.data.passwordHash;
      db.users[idx] = updated;
      saveDbToDisk(db);
      return { ...updated };
    },
  },

  auditLog: {
    create: async (args: { data: any }) => {
      const entry: MockAuditLog = {
        id: args.data.id || generateUniqueId('aud'),
        userId: args.data.userId ?? null,
        action: args.data.action,
        details: args.data.details ?? null,
        ip: args.data.ip ?? null,
        createdAt: new Date(),
      };
      db.auditLogs.push(entry);
      saveDbToDisk(db);
      return { ...entry };
    },
  },

  category: {
    count: async (args?: { where?: any }) => {
      if (!args?.where) return db.categories.length;
      return db.categories.filter((c) => matchesWhere(c, args.where, db)).length;
    },

    findMany: async (args?: { where?: any; orderBy?: any; include?: any }) => {
      sanitizeAndDeduplicateDb(db);
      let list = db.categories.filter((c) => matchesWhere(c, args?.where, db));
      if (args?.orderBy) {
        list = sortItems(list, args.orderBy);
      }
      return list.map((c) => attachCategoryProviders(c, args?.include));
    },

    findUnique: async (args: { where: any; include?: any }) => {
      const cat = db.categories.find((c) => matchesWhere(c, args.where, db));
      if (!cat) return null;
      return attachCategoryProviders(cat, args.include);
    },

    findFirst: async (args?: { where?: any; include?: any }) => {
      const cat = db.categories.find((c) => matchesWhere(c, args?.where, db));
      if (!cat) return null;
      return attachCategoryProviders(cat, args?.include);
    },

    create: async (args: { data: any }) => {
      const now = new Date();
      const newCat: MockCategory = {
        id: args.data.id || generateUniqueId('cat'),
        name: args.data.name,
        slug: args.data.slug,
        description: args.data.description ?? null,
        icon: args.data.icon || 'Briefcase',
        order: Number(args.data.order) || 0,
        createdAt: now,
        updatedAt: now,
      };
      db.categories.push(newCat);
      saveDbToDisk(db);
      return { ...newCat };
    },

    update: async (args: { where: any; data: any }) => {
      const idx = db.categories.findIndex((c) => matchesWhere(c, args.where, db));
      if (idx === -1) throw new Error('Category not found');
      const cur = db.categories[idx];
      const updated: MockCategory = {
        ...cur,
        ...args.data,
        updatedAt: new Date(),
      };
      db.categories[idx] = updated;
      saveDbToDisk(db);
      return { ...updated };
    },

    delete: async (args: { where: any }) => {
      const idx = db.categories.findIndex((c) => matchesWhere(c, args.where, db));
      if (idx === -1) throw new Error('Category not found');
      const deleted = db.categories.splice(idx, 1)[0];
      saveDbToDisk(db);
      return { ...deleted };
    },

    upsert: async (args: { where: any; update: any; create: any }) => {
      const idx = db.categories.findIndex((c) => matchesWhere(c, args.where, db));
      if (idx >= 0) {
        db.categories[idx] = { ...db.categories[idx], ...args.update, updatedAt: new Date() };
        saveDbToDisk(db);
        return { ...db.categories[idx] };
      }
      const now = new Date();
      const newCat: MockCategory = {
        id: args.create.id || generateUniqueId('cat'),
        ...args.create,
        createdAt: now,
        updatedAt: now,
      };
      db.categories.push(newCat);
      saveDbToDisk(db);
      return { ...newCat };
    },
  },

  provider: {
    count: async (args?: { where?: any }) => {
      if (!args?.where) return db.providers.length;
      return db.providers.filter((p) => matchesWhere(p, args.where, db)).length;
    },

    aggregate: async (args: { _sum?: { viewsCount?: boolean } }) => {
      const totalViews = db.providers.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
      return {
        _sum: {
          viewsCount: totalViews,
        },
      };
    },

    findMany: async (args?: {
      where?: any;
      orderBy?: any;
      include?: any;
      skip?: number;
      take?: number;
    }) => {
      let list = db.providers.filter((p) => matchesWhere(p, args?.where, db));
      if (args?.orderBy) {
        list = sortItems(list, args.orderBy);
      }
      if (args?.skip !== undefined && args.skip > 0) {
        list = list.slice(args.skip);
      }
      if (args?.take !== undefined) {
        list = list.slice(0, args.take);
      }
      return list.map((p) => attachCategory(p, args?.include));
    },

    findUnique: async (args: { where: any; include?: any }) => {
      const p = db.providers.find((prov) => matchesWhere(prov, args.where, db));
      if (!p) return null;
      return attachCategory(p, args.include);
    },

    findFirst: async (args?: { where?: any; include?: any }) => {
      const p = db.providers.find((prov) => matchesWhere(prov, args?.where, db));
      if (!p) return null;
      return attachCategory(p, args?.include);
    },

    create: async (args: { data: any; include?: any }) => {
      const now = new Date();
      const newProv: MockProvider = {
        id: args.data.id || generateUniqueId('prov'),
        name: args.data.name,
        slug: args.data.slug,
        cnpj: args.data.cnpj ?? null,
        phone: args.data.phone ?? null,
        whatsapp: args.data.whatsapp ?? null,
        email: args.data.email ?? null,
        website: args.data.website ?? null,
        instagram: args.data.instagram ?? null,
        address: args.data.address ?? null,
        neighborhood: args.data.neighborhood ?? null,
        city: args.data.city,
        state: args.data.state,
        zipCode: args.data.zipCode ?? null,
        description: args.data.description ?? null,
        services: args.data.services ?? null,
        logoUrl: args.data.logoUrl ?? null,
        coverUrl: args.data.coverUrl ?? null,
        isFeatured: Boolean(args.data.isFeatured),
        isActive: args.data.isActive !== undefined ? Boolean(args.data.isActive) : true,
        viewsCount: 0,
        categoryId: args.data.categoryId,
        subcategoryId: args.data.subcategoryId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      db.providers.unshift(newProv);
      saveDbToDisk(db);
      return attachCategory(newProv, args.include);
    },

    update: async (args: { where: any; data: any; include?: any }) => {
      const idx = db.providers.findIndex((p) => matchesWhere(p, args.where, db));
      if (idx === -1) throw new Error('Provider not found');
      const cur = db.providers[idx];

      const patch: any = { ...args.data };
      if (patch.viewsCount && typeof patch.viewsCount === 'object' && 'increment' in patch.viewsCount) {
        patch.viewsCount = (cur.viewsCount || 0) + Number(patch.viewsCount.increment || 1);
      }

      const updated: MockProvider = {
        ...cur,
        ...patch,
        updatedAt: new Date(),
      };
      db.providers[idx] = updated;
      saveDbToDisk(db);
      return attachCategory(updated, args.include);
    },

    updateMany: async (args: { where: any; data: any }) => {
      let count = 0;
      for (let i = 0; i < db.providers.length; i++) {
        if (matchesWhere(db.providers[i], args.where, db)) {
          const cur = db.providers[i];
          const patch: any = { ...args.data };
          if (patch.viewsCount && typeof patch.viewsCount === 'object' && 'increment' in patch.viewsCount) {
            patch.viewsCount = (cur.viewsCount || 0) + Number(patch.viewsCount.increment || 1);
          }
          db.providers[i] = {
            ...cur,
            ...patch,
            updatedAt: new Date(),
          };
          count++;
        }
      }
      if (count > 0) saveDbToDisk(db);
      return { count };
    },

    delete: async (args: { where: any }) => {
      const idx = db.providers.findIndex((p) => matchesWhere(p, args.where, db));
      if (idx === -1) throw new Error('Provider not found');
      const deleted = db.providers.splice(idx, 1)[0];
      saveDbToDisk(db);
      return { ...deleted };
    },

    upsert: async (args: { where: any; update: any; create: any }) => {
      const idx = db.providers.findIndex((p) => matchesWhere(p, args.where, db));
      if (idx >= 0) {
        db.providers[idx] = { ...db.providers[idx], ...args.update, updatedAt: new Date() };
        saveDbToDisk(db);
        return { ...db.providers[idx] };
      }
      const now = new Date();
      const newProv: MockProvider = {
        id: args.create.id || generateUniqueId('prov'),
        ...args.create,
        viewsCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      db.providers.push(newProv);
      saveDbToDisk(db);
      return { ...newProv };
    },
  },

  banner: {
    count: async (args?: { where?: any }) => {
      if (!args?.where) return db.banners.length;
      return db.banners.filter((b) => matchesWhere(b, args.where, db)).length;
    },

    findMany: async (args?: {
      where?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
    }) => {
      let list = db.banners.filter((b) => matchesWhere(b, args?.where, db));
      if (args?.orderBy) {
        list = sortItems(list, args.orderBy);
      }
      if (args?.skip !== undefined && args.skip > 0) {
        list = list.slice(args.skip);
      }
      if (args?.take !== undefined) {
        list = list.slice(0, args.take);
      }
      return list;
    },

    findFirst: async (args?: { where?: any }) => {
      const b = db.banners.find((ban) => matchesWhere(ban, args?.where, db));
      return b || null;
    },

    findUnique: async (args: { where: any }) => {
      const b = db.banners.find((ban) => matchesWhere(ban, args.where, db));
      return b || null;
    },

    create: async (args: { data: any }) => {
      const now = new Date();
      const newBanner: MockBanner = {
        id: args.data.id || generateUniqueId('ban'),
        title: args.data.title,
        imageUrl: args.data.imageUrl,
        linkUrl: args.data.linkUrl ?? null,
        target: args.data.target || '_blank',
        position: args.data.position || 'HERO_TOP',
        isActive: args.data.isActive !== undefined ? Boolean(args.data.isActive) : true,
        order: Number(args.data.order) || 0,
        clicksCount: 0,
        viewsCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      db.banners.unshift(newBanner);
      saveDbToDisk(db);
      return { ...newBanner };
    },

    update: async (args: { where: any; data: any }) => {
      const idx = db.banners.findIndex((b) => matchesWhere(b, args.where, db));
      if (idx === -1) throw new Error('Banner not found');
      const cur = db.banners[idx];

      const patch: any = { ...args.data };
      if (patch.clicksCount && typeof patch.clicksCount === 'object' && 'increment' in patch.clicksCount) {
        patch.clicksCount = (cur.clicksCount || 0) + Number(patch.clicksCount.increment || 1);
      }
      if (patch.viewsCount && typeof patch.viewsCount === 'object' && 'increment' in patch.viewsCount) {
        patch.viewsCount = (cur.viewsCount || 0) + Number(patch.viewsCount.increment || 1);
      }

      const updated: MockBanner = {
        ...cur,
        ...patch,
        updatedAt: new Date(),
      };
      db.banners[idx] = updated;
      saveDbToDisk(db);
      return { ...updated };
    },

    updateMany: async (args: { where: any; data: any }) => {
      let count = 0;
      for (let i = 0; i < db.banners.length; i++) {
        if (matchesWhere(db.banners[i], args.where, db)) {
          const cur = db.banners[i];
          const patch: any = { ...args.data };
          if (patch.clicksCount && typeof patch.clicksCount === 'object' && 'increment' in patch.clicksCount) {
            patch.clicksCount = (cur.clicksCount || 0) + Number(patch.clicksCount.increment || 1);
          }
          if (patch.viewsCount && typeof patch.viewsCount === 'object' && 'increment' in patch.viewsCount) {
            patch.viewsCount = (cur.viewsCount || 0) + Number(patch.viewsCount.increment || 1);
          }
          db.banners[i] = {
            ...cur,
            ...patch,
            updatedAt: new Date(),
          };
          count++;
        }
      }
      if (count > 0) saveDbToDisk(db);
      return { count };
    },

    delete: async (args: { where: any }) => {
      const idx = db.banners.findIndex((b) => matchesWhere(b, args.where, db));
      if (idx === -1) throw new Error('Banner not found');
      const deleted = db.banners.splice(idx, 1)[0];
      saveDbToDisk(db);
      return { ...deleted };
    },
  },

  subcategory: {
    count: async (args?: { where?: any }) => {
      if (!args?.where) return db.subcategories.length;
      return db.subcategories.filter((s) => matchesWhere(s, args.where, db)).length;
    },

    findMany: async (args?: {
      where?: any;
      orderBy?: any;
      include?: any;
      skip?: number;
      take?: number;
    }) => {
      let list = db.subcategories.filter((s) => matchesWhere(s, args?.where, db));
      if (args?.orderBy) {
        list = sortItems(list, args.orderBy);
      }
      if (args?.skip !== undefined && args.skip > 0) {
        list = list.slice(args.skip);
      }
      if (args?.take !== undefined) {
        list = list.slice(0, args.take);
      }
      return list;
    },

    findFirst: async (args?: { where?: any }) => {
      const s = db.subcategories.find((sub) => matchesWhere(sub, args?.where, db));
      return s || null;
    },

    findUnique: async (args: { where: any }) => {
      const s = db.subcategories.find((sub) => matchesWhere(sub, args.where, db));
      return s || null;
    },

    create: async (args: { data: any }) => {
      const now = new Date();
      const newSub: MockSubcategory = {
        id: args.data.id || generateUniqueId('sub'),
        name: args.data.name,
        slug: args.data.slug,
        description: args.data.description ?? null,
        order: Number(args.data.order) || 0,
        categoryId: args.data.categoryId,
        createdAt: now,
        updatedAt: now,
      };
      db.subcategories.push(newSub);
      saveDbToDisk(db);
      return { ...newSub };
    },

    update: async (args: { where: any; data: any }) => {
      const idx = db.subcategories.findIndex((s) => matchesWhere(s, args.where, db));
      if (idx === -1) throw new Error('Subcategory not found');
      const cur = db.subcategories[idx];
      const updated: MockSubcategory = {
        ...cur,
        ...args.data,
        updatedAt: new Date(),
      };
      db.subcategories[idx] = updated;
      saveDbToDisk(db);
      return { ...updated };
    },

    delete: async (args: { where: any }) => {
      const idx = db.subcategories.findIndex((s) => matchesWhere(s, args.where, db));
      if (idx === -1) throw new Error('Subcategory not found');
      const deleted = db.subcategories.splice(idx, 1)[0];
      saveDbToDisk(db);
      return { ...deleted };
    },
  },
};

export const prisma: PrismaClient = (
  globalPrismaClient ? createSafePrismaClient(globalPrismaClient, mockPrisma) : mockPrisma
) as unknown as PrismaClient;

