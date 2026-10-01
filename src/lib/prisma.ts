import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { DEFAULT_CATEGORIES } from './defaultCategories';

// Types for in-memory models
export interface MockUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'EDITOR';
  createdAt: Date;
  updatedAt: Date;
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
}

function initializeMockDb(): MockDatabase {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const users: MockUser[] = [
    {
      id: 'usr_admin_1',
      name: 'Administrador',
      email: 'admin@catalogo.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ];

  const categories: MockCategory[] = DEFAULT_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    order: cat.order,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  }));

  // Sem subcategorias e sem prestadores de exemplo — catálogo inicia só com as 12 categorias
  const subcategories: MockSubcategory[] = [];
  const providers: MockProvider[] = [];

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

  return { users, categories, subcategories, providers, banners };
}

let idSequence = 0;
export function generateUniqueId(prefix: string): string {
  idSequence++;
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${idSequence}_${rand}`;
}

/** Categorias do seed antigo → slug da nova categoria padrão. */
const LEGACY_CATEGORY_REMAP: Record<string, string> = {
  eletricistas: 'manutencao-predial-e-instalacoes',
  encanadores: 'manutencao-predial-e-instalacoes',
  pintores: 'obras-engenharia-e-laudos',
  'ar-condicionado': 'manutencao-predial-e-instalacoes',
  chaveiros: 'seguranca-e-prevencao-de-incendio',
  marcenaria: 'obras-engenharia-e-laudos',
  mecanica: 'servicos-operacionais-e-mao-de-obra',
  limpeza: 'limpeza-conservacao-e-controle-de-pragas',
  cat_eletricistas: 'manutencao-predial-e-instalacoes',
  cat_encanadores: 'manutencao-predial-e-instalacoes',
  cat_pintores: 'obras-engenharia-e-laudos',
  cat_ar_condicionado: 'manutencao-predial-e-instalacoes',
  cat_chaveiros: 'seguranca-e-prevencao-de-incendio',
  cat_marcenaria: 'obras-engenharia-e-laudos',
  cat_mecanica: 'servicos-operacionais-e-mao-de-obra',
  cat_limpeza: 'limpeza-conservacao-e-controle-de-pragas',
};

/**
 * Garante só as 12 categorias padrão (nome, ícone, ordem) no mock local.
 * Remove qualquer outra categoria e todas as subcategorias.
 * Prestadores ligados a categorias removidas são apagados.
 */
export function ensureDefaultCategories(mockDb: MockDatabase): boolean {
  let changed = false;
  const bySlug = new Map(mockDb.categories.map((c) => [c.slug, c]));
  const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));

  for (const def of DEFAULT_CATEGORIES) {
    const existing = bySlug.get(def.slug);
    if (!existing) {
      mockDb.categories.push({
        id: def.id,
        name: def.name,
        slug: def.slug,
        description: def.description,
        icon: def.icon,
        order: def.order,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date(),
      });
      bySlug.set(def.slug, mockDb.categories[mockDb.categories.length - 1]);
      changed = true;
      continue;
    }

    // Prefere o id fixo do catálogo padrão quando o slug já existe com id antigo
    if (existing.id !== def.id) {
      for (const provider of mockDb.providers) {
        if (provider.categoryId === existing.id) {
          provider.categoryId = def.id;
          provider.subcategoryId = null;
          changed = true;
        }
      }
      existing.id = def.id;
      changed = true;
    }

    if (
      existing.name !== def.name ||
      existing.icon !== def.icon ||
      existing.order !== def.order ||
      existing.description !== def.description
    ) {
      existing.name = def.name;
      existing.icon = def.icon;
      existing.order = def.order;
      existing.description = def.description;
      existing.updatedAt = new Date();
      changed = true;
    }
  }

  const categoryById = new Map(mockDb.categories.map((c) => [c.id, c]));
  const categoryBySlug = new Map(mockDb.categories.map((c) => [c.slug, c]));

  // Remapeia prestadores das categorias antigas para as novas (antes de apagar as legadas)
  for (const provider of mockDb.providers) {
    const current = categoryById.get(provider.categoryId);
    const remapSlug =
      LEGACY_CATEGORY_REMAP[provider.categoryId] ||
      (current ? LEGACY_CATEGORY_REMAP[current.slug] : undefined);
    if (!remapSlug) continue;
    const target = categoryBySlug.get(remapSlug);
    if (target && provider.categoryId !== target.id) {
      provider.categoryId = target.id;
      provider.subcategoryId = null;
      changed = true;
    }
  }

  // Mantém somente as 12 categorias padrão
  const before = mockDb.categories.length;
  mockDb.categories = mockDb.categories.filter((c) => defaultSlugs.has(c.slug));
  if (mockDb.categories.length !== before) changed = true;

  // Sem subcategorias no catálogo padrão
  if (mockDb.subcategories.length > 0) {
    mockDb.subcategories = [];
    changed = true;
  }

  // Remove prestadores órfãos (categoria inexistente após o filtro)
  const validCatIds = new Set(mockDb.categories.map((c) => c.id));
  const provBefore = mockDb.providers.length;
  mockDb.providers = mockDb.providers.filter((p) => validCatIds.has(p.categoryId));
  if (mockDb.providers.length !== provBefore) changed = true;

  // Ordem fixa das 12 categorias
  const defaultSlugOrder = new Map(DEFAULT_CATEGORIES.map((c) => [c.slug, c.order]));
  mockDb.categories.sort((a, b) => {
    const oa = defaultSlugOrder.get(a.slug) ?? a.order + 1000;
    const ob = defaultSlugOrder.get(b.slug) ?? b.order + 1000;
    return oa - ob;
  });

  return changed;
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
sanitizeAndDeduplicateDb(db);
if (ensureDefaultCategories(db)) {
  saveDbToDisk(db);
}

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

/**
 * MySQL real só é usado quando USE_REAL_PRISMA=true E DATABASE_URL está definida.
 * Antes, qualquer DATABASE_URL ativava o Prisma e o fallback silencioso mascarava
 * erros de INSERT — a API retornava sucesso sem gravar no MySQL.
 */
const shouldUseRealPrisma = (): boolean =>
  Boolean(process.env.DATABASE_URL) && process.env.USE_REAL_PRISMA === 'true';

/** Operações de escrita: nunca caem no mock quando o MySQL está ativo. */
const WRITE_METHODS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);

let globalPrismaClient: PrismaClient | null = null;

function createPrismaClientInstance(): PrismaClient | null {
  if (!shouldUseRealPrisma()) return null;
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (e) {
    console.warn('[Prisma] Error creating PrismaClient instance:', e);
    return null;
  }
}

{
  const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient | null };
  if (shouldUseRealPrisma()) {
    if (!globalForPrisma.prismaClient) {
      globalForPrisma.prismaClient = createPrismaClientInstance();
    }
    globalPrismaClient = globalForPrisma.prismaClient || null;
  }
}

/**
 * Recria o PrismaClient após alterar DATABASE_URL / USE_REAL_PRISMA em runtime
 * (ex.: painel Admin > Banco). Sem isso, a config nova não entra em vigor.
 */
export async function reinitializePrismaClient(): Promise<{ active: boolean }> {
  const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient | null };

  if (globalForPrisma.prismaClient) {
    try {
      await globalForPrisma.prismaClient.$disconnect();
    } catch {}
  }

  globalForPrisma.prismaClient = null;
  globalPrismaClient = null;

  if (shouldUseRealPrisma()) {
    const client = createPrismaClientInstance();
    globalForPrisma.prismaClient = client;
    globalPrismaClient = client;
  }

  return { active: Boolean(globalPrismaClient) };
}

export function isRealPrismaEnabled(): boolean {
  return shouldUseRealPrisma() && Boolean(globalPrismaClient);
}

function getActiveRealClient(): PrismaClient | null {
  return globalPrismaClient;
}

/**
 * Proxy que encaminha para o PrismaClient MySQL atual (se ativo).
 * Lê sempre o client vivo — assim reinitializePrismaClient() passa a valer
 * sem precisar reiniciar o processo Node.
 */
function createAdaptivePrismaClient(fallbackMock: any): PrismaClient {
  return new Proxy(fallbackMock, {
    get(target, prop) {
      const realClient = getActiveRealClient();

      if (prop === '$disconnect') {
        return async () => {
          if (!realClient) return;
          try {
            await realClient.$disconnect();
          } catch {}
        };
      }

      // Sem MySQL ativo → mock puro
      if (!realClient) {
        return target[prop];
      }

      if (prop === '$queryRaw' || prop === '$executeRaw' || prop === '$transaction') {
        const realFn = (realClient as any)[prop];
        if (typeof realFn === 'function') {
          return (...args: any[]) => realFn.apply(realClient, args);
        }
      }

      const realTarget = (realClient as any)[prop];
      const mockTarget = target[prop];

      if (!realTarget) return mockTarget;
      if (typeof realTarget === 'function') {
        return async (...args: any[]) => {
          return await realTarget.apply(realClient, args);
        };
      }

      // Model delegates (user, category, provider, ...)
      return new Proxy(mockTarget || {}, {
        get(mTarget, mProp) {
          const methodName = String(mProp);
          // Resolve o client no momento da chamada (após possível reinit)
          const liveClient = getActiveRealClient();
          if (!liveClient) {
            const mockMethod = mTarget[mProp];
            return typeof mockMethod === 'function'
              ? (...args: any[]) => mockMethod.apply(mTarget, args)
              : mockMethod;
          }

          const liveModel = (liveClient as any)[prop];
          const realMethod = liveModel?.[mProp];
          const mockMethod = mTarget[mProp];
          if (typeof realMethod !== 'function') return mockMethod;

          return async (...args: any[]) => {
            try {
              return await realMethod.apply(liveModel, args);
            } catch (err: any) {
              // Escritas NÃO podem fingir sucesso no mock — isso fazia o admin
              // achar que o prestador foi salvo no MySQL quando não foi.
              if (WRITE_METHODS.has(methodName)) {
                console.error(
                  `[Prisma] Falha ao gravar em ${String(prop)}.${methodName} (MySQL):`,
                  err?.message || err
                );
                throw err;
              }

              // Leituras: só usam mock se for erro de conexão (não schema/FK).
              const { isConnectionError } = await import('./dbError');
              if (isConnectionError(err) && typeof mockMethod === 'function') {
                console.warn(
                  `[Prisma Safe Mode] Conexão falhou em ${String(prop)}.${methodName}, usando store local:`,
                  err?.message || err
                );
                return await mockMethod.apply(mTarget, args);
              }

              throw err;
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
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(newUser);
      saveDbToDisk(db);
      return { ...newUser };
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

export const prisma: PrismaClient = createAdaptivePrismaClient(mockPrisma) as unknown as PrismaClient;

