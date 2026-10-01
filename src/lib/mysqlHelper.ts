import mysql from 'mysql2/promise';
import { MockDatabase } from './prisma';

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export function parseDatabaseUrl(rawUrl: string): MySqlConfig {
  try {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname.replace(/^\//, '') || 'catalogo_servicos',
    };
  } catch {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'catalogo_servicos',
    };
  }
}

export function buildDatabaseUrl(config: MySqlConfig): string {
  const encUser = encodeURIComponent(config.user);
  const encPass = config.password ? `:${encodeURIComponent(config.password)}` : '';
  const port = config.port || 3306;
  return `mysql://${encUser}${encPass}@${config.host}:${port}/${config.database}`;
}

export async function testMySqlConnection(configOrUrl: string | MySqlConfig): Promise<{
  success: boolean;
  version?: string;
  database?: string;
  tables?: string[];
  error?: string;
  code?: string;
  clientIp?: string;
}> {
  const config = typeof configOrUrl === 'string' ? parseDatabaseUrl(configOrUrl) : configOrUrl;

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 7000,
    });

    const [versionRows] = await connection.query<any[]>('SELECT VERSION() as version');
    const version = versionRows?.[0]?.version || 'MySQL Desconhecido';

    const [tableRows] = await connection.query<any[]>('SHOW TABLES');
    const tables = tableRows.map((r) => Object.values(r)[0] as string);

    await connection.end();

    return {
      success: true,
      version,
      database: config.database,
      tables,
    };
  } catch (err: any) {
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }

    let clientIp: string | undefined;
    const ipMatch = err.message?.match(/@'([^']+)'/);
    if (ipMatch) {
      clientIp = ipMatch[1];
    }

    return {
      success: false,
      error: err.message || 'Falha ao conectar com o MySQL',
      code: err.code || 'UNKNOWN_ERROR',
      clientIp,
    };
  }
}

export async function createTablesInMySql(conn: mysql.Connection): Promise<void> {
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) UNIQUE NOT NULL,
      passwordHash VARCHAR(191) NOT NULL,
      role ENUM('ADMIN', 'EDITOR') DEFAULT 'ADMIN' NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(191) UNIQUE NOT NULL,
      slug VARCHAR(191) UNIQUE NOT NULL,
      description TEXT NULL,
      icon VARCHAR(191) DEFAULT 'Briefcase' NULL,
      \`order\` INT DEFAULT 0 NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS subcategories (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      slug VARCHAR(191) UNIQUE NOT NULL,
      description TEXT NULL,
      \`order\` INT DEFAULT 0 NOT NULL,
      categoryId VARCHAR(191) NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
      INDEX idx_subcategories_categoryId (categoryId),
      CONSTRAINT fk_subcategories_category FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS providers (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      slug VARCHAR(191) UNIQUE NOT NULL,
      cnpj VARCHAR(191) NULL,
      phone VARCHAR(191) NULL,
      whatsapp VARCHAR(191) NULL,
      email VARCHAR(191) NULL,
      website VARCHAR(191) NULL,
      instagram VARCHAR(191) NULL,
      address VARCHAR(191) NULL,
      neighborhood VARCHAR(191) NULL,
      city VARCHAR(191) NOT NULL,
      state VARCHAR(191) NOT NULL,
      zipCode VARCHAR(191) NULL,
      description TEXT NULL,
      services TEXT NULL,
      logoUrl TEXT NULL,
      coverUrl TEXT NULL,
      isFeatured BOOLEAN DEFAULT FALSE NOT NULL,
      isActive BOOLEAN DEFAULT TRUE NOT NULL,
      viewsCount INT DEFAULT 0 NOT NULL,
      categoryId VARCHAR(191) NOT NULL,
      subcategoryId VARCHAR(191) NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
      INDEX idx_providers_category (categoryId),
      INDEX idx_providers_subcategory (subcategoryId),
      INDEX idx_providers_city_state (city, state),
      INDEX idx_providers_active (isActive),
      CONSTRAINT fk_providers_category FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT,
      CONSTRAINT fk_providers_subcategory FOREIGN KEY (subcategoryId) REFERENCES subcategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS banners (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(191) NOT NULL,
      imageUrl LONGTEXT NOT NULL,
      linkUrl TEXT NULL,
      target VARCHAR(50) DEFAULT '_blank' NOT NULL,
      position ENUM('HERO_TOP', 'MIDDLE', 'SIDEBAR', 'FOOTER') DEFAULT 'HERO_TOP' NOT NULL,
      isActive BOOLEAN DEFAULT TRUE NOT NULL,
      \`order\` INT DEFAULT 0 NOT NULL,
      clicksCount INT DEFAULT 0 NOT NULL,
      viewsCount INT DEFAULT 0 NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
      INDEX idx_banners_pos_active (position, isActive)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
  ];

  await conn.query('SET FOREIGN_KEY_CHECKS=0;');
  try {
    for (const sql of ddlStatements) {
      await conn.query(sql);
    }
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
  }
}

export async function syncDatabaseToMySql(conn: mysql.Connection, db: MockDatabase): Promise<{
  usersSynced: number;
  categoriesSynced: number;
  subcategoriesSynced: number;
  providersSynced: number;
  bannersSynced: number;
}> {
  // Desabilitar restrições temporariamente para permitir sincronização idempotente sem erros de FK
  await conn.query('SET FOREIGN_KEY_CHECKS=0;');

  try {
    // 1. Criar tabelas se não existirem
    await createTablesInMySql(conn);

    // 2. Sincronizar Usuários
    let usersSynced = 0;
    for (const u of db.users) {
      await conn.query(
        `INSERT INTO users (id, name, email, passwordHash, role, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), passwordHash=VALUES(passwordHash), role=VALUES(role), updatedAt=VALUES(updatedAt)`,
        [u.id, u.name, u.email, u.passwordHash, u.role, u.createdAt, u.updatedAt]
      );
      usersSynced++;
    }

    // 3. Sincronizar Categorias
    let categoriesSynced = 0;
    const categoryIdMap = new Map<string, string>(); // mockId -> realDbId

    for (const c of db.categories) {
      await conn.query(
        `INSERT INTO categories (id, name, slug, description, icon, \`order\`, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon), \`order\`=VALUES(\`order\`), updatedAt=VALUES(updatedAt)`,
        [c.id, c.name, c.slug, c.description, c.icon, c.order, c.createdAt, c.updatedAt]
      );
      categoriesSynced++;
    }

    // Consultar IDs reais das categorias no MySQL para mapear com segurança
    const [existingCats] = await conn.query<any[]>('SELECT id, name, slug FROM categories');
    existingCats.forEach((ec: any) => {
      categoryIdMap.set(ec.id, ec.id);
      categoryIdMap.set(ec.slug, ec.id);
      categoryIdMap.set(ec.name.toLowerCase(), ec.id);
    });

    // 4. Sincronizar Subcategorias
    let subcategoriesSynced = 0;
    const subcategoryIdMap = new Map<string, string>();

    if (db.subcategories && db.subcategories.length > 0) {
      for (const s of db.subcategories) {
        // Obter ID de categoria correspondente caso tenha divergência
        const resolvedCatId = categoryIdMap.get(s.categoryId) || s.categoryId;

        await conn.query(
          `INSERT INTO subcategories (id, name, slug, description, \`order\`, categoryId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), \`order\`=VALUES(\`order\`), categoryId=VALUES(categoryId), updatedAt=VALUES(updatedAt)`,
          [s.id, s.name, s.slug, s.description, s.order, resolvedCatId, s.createdAt, s.updatedAt]
        );
        subcategoriesSynced++;
      }
    }

    // Consultar IDs reais das subcategorias no MySQL
    const [existingSubs] = await conn.query<any[]>('SELECT id, name, slug, categoryId FROM subcategories');
    existingSubs.forEach((es: any) => {
      subcategoryIdMap.set(es.id, es.id);
      subcategoryIdMap.set(es.slug, es.id);
      subcategoryIdMap.set(`${es.categoryId}_${es.name.toLowerCase()}`, es.id);
    });

    // 5. Sincronizar Prestadores
    let providersSynced = 0;
    for (const p of db.providers) {
      const resolvedCatId = categoryIdMap.get(p.categoryId) || p.categoryId;
      const resolvedSubId = p.subcategoryId ? (subcategoryIdMap.get(p.subcategoryId) || p.subcategoryId) : null;

      await conn.query(
        `INSERT INTO providers (
          id, name, slug, cnpj, phone, whatsapp, email, website, instagram,
          address, neighborhood, city, state, zipCode, description, services,
          logoUrl, coverUrl, isFeatured, isActive, viewsCount, categoryId, subcategoryId,
          createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name=VALUES(name), slug=VALUES(slug), cnpj=VALUES(cnpj), phone=VALUES(phone),
          whatsapp=VALUES(whatsapp), email=VALUES(email), website=VALUES(website),
          instagram=VALUES(instagram), address=VALUES(address), neighborhood=VALUES(neighborhood),
          city=VALUES(city), state=VALUES(state), zipCode=VALUES(zipCode),
          description=VALUES(description), services=VALUES(services), logoUrl=VALUES(logoUrl),
          coverUrl=VALUES(coverUrl), isFeatured=VALUES(isFeatured), isActive=VALUES(isActive),
          viewsCount=VALUES(viewsCount), categoryId=VALUES(categoryId), subcategoryId=VALUES(subcategoryId),
          updatedAt=VALUES(updatedAt)`,
        [
          p.id,
          p.name,
          p.slug,
          p.cnpj,
          p.phone,
          p.whatsapp,
          p.email,
          p.website,
          p.instagram,
          p.address,
          p.neighborhood,
          p.city,
          p.state,
          p.zipCode,
          p.description,
          p.services,
          p.logoUrl,
          p.coverUrl,
          p.isFeatured ? 1 : 0,
          p.isActive ? 1 : 0,
          p.viewsCount || 0,
          resolvedCatId,
          resolvedSubId,
          p.createdAt,
          p.updatedAt,
        ]
      );
      providersSynced++;
    }

    // 6. Sincronizar Banners
    let bannersSynced = 0;
    if (db.banners && db.banners.length > 0) {
      for (const b of db.banners) {
        await conn.query(
          `INSERT INTO banners (
            id, title, imageUrl, linkUrl, target, position, isActive,
            \`order\`, clicksCount, viewsCount, createdAt, updatedAt
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            title=VALUES(title), imageUrl=VALUES(imageUrl), linkUrl=VALUES(linkUrl),
            target=VALUES(target), position=VALUES(position), isActive=VALUES(isActive),
            \`order\`=VALUES(\`order\`), clicksCount=VALUES(clicksCount), viewsCount=VALUES(viewsCount),
            updatedAt=VALUES(updatedAt)`,
          [
            b.id,
            b.title,
            b.imageUrl,
            b.linkUrl,
            b.target || '_blank',
            b.position || 'HERO_TOP',
            b.isActive ? 1 : 0,
            b.order || 0,
            b.clicksCount || 0,
            b.viewsCount || 0,
            b.createdAt,
            b.updatedAt,
          ]
        );
        bannersSynced++;
      }
    }

    return {
      usersSynced,
      categoriesSynced,
      subcategoriesSynced,
      providersSynced,
      bannersSynced,
    };
  } finally {
    // Reativar restrições de chave estrangeira
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
  }
}

export function generateSqlDump(db: MockDatabase): string {
  const escapeSql = (val: any) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
    return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  };

  let sql = `-- ========================================================
-- CATÁLOGO DE PRESTADORES DE SERVIÇOS - SINDÍCONE
-- SCRIPT DE CRIAÇÃO E CARGA DE DADOS MYSQL
-- GERADO AUTOMATICAMENTE: ${new Date().toISOString()}
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(191) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`passwordHash\` VARCHAR(191) NOT NULL,
  \`role\` ENUM('ADMIN', 'EDITOR') DEFAULT 'ADMIN' NOT NULL,
  \`createdAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
  \`updatedAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(191) NOT NULL UNIQUE,
  \`slug\` VARCHAR(191) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  \`icon\` VARCHAR(191) DEFAULT 'Briefcase' NULL,
  \`order\` INT DEFAULT 0 NOT NULL,
  \`createdAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
  \`updatedAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE SUBCATEGORIAS
CREATE TABLE IF NOT EXISTS \`subcategories\` (
  \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(191) NOT NULL,
  \`slug\` VARCHAR(191) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  \`order\` INT DEFAULT 0 NOT NULL,
  \`categoryId\` VARCHAR(191) NOT NULL,
  \`createdAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
  \`updatedAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
  INDEX \`idx_subcategories_categoryId\` (\`categoryId\`),
  CONSTRAINT \`fk_subcategories_category\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA DE PRESTADORES
CREATE TABLE IF NOT EXISTS \`providers\` (
  \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(191) NOT NULL,
  \`slug\` VARCHAR(191) NOT NULL UNIQUE,
  \`cnpj\` VARCHAR(191) NULL,
  \`phone\` VARCHAR(191) NULL,
  \`whatsapp\` VARCHAR(191) NULL,
  \`email\` VARCHAR(191) NULL,
  \`website\` VARCHAR(191) NULL,
  \`instagram\` VARCHAR(191) NULL,
  \`address\` VARCHAR(191) NULL,
  \`neighborhood\` VARCHAR(191) NULL,
  \`city\` VARCHAR(191) NOT NULL,
  \`state\` VARCHAR(191) NOT NULL,
  \`zipCode\` VARCHAR(191) NULL,
  \`description\` TEXT NULL,
  \`services\` TEXT NULL,
  \`logoUrl\` TEXT NULL,
  \`coverUrl\` TEXT NULL,
  \`isFeatured\` BOOLEAN DEFAULT FALSE NOT NULL,
  \`isActive\` BOOLEAN DEFAULT TRUE NOT NULL,
  \`viewsCount\` INT DEFAULT 0 NOT NULL,
  \`categoryId\` VARCHAR(191) NOT NULL,
  \`subcategoryId\` VARCHAR(191) NULL,
  \`createdAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
  \`updatedAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
  INDEX \`idx_providers_category\` (\`categoryId\`),
  INDEX \`idx_providers_subcategory\` (\`subcategoryId\`),
  INDEX \`idx_providers_city_state\` (\`city\`, \`state\`),
  INDEX \`idx_providers_active\` (\`isActive\`),
  CONSTRAINT \`fk_providers_category\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\` (\`id\`) ON DELETE RESTRICT,
  CONSTRAINT \`fk_providers_subcategory\` FOREIGN KEY (\`subcategoryId\`) REFERENCES \`subcategories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA DE BANNERS
CREATE TABLE IF NOT EXISTS \`banners\` (
  \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
  \`title\` VARCHAR(191) NOT NULL,
  \`imageUrl\` LONGTEXT NOT NULL,
  \`linkUrl\` TEXT NULL,
  \`target\` VARCHAR(50) DEFAULT '_blank' NOT NULL,
  \`position\` ENUM('HERO_TOP', 'MIDDLE', 'SIDEBAR', 'FOOTER') DEFAULT 'HERO_TOP' NOT NULL,
  \`isActive\` BOOLEAN DEFAULT TRUE NOT NULL,
  \`order\` INT DEFAULT 0 NOT NULL,
  \`clicksCount\` INT DEFAULT 0 NOT NULL,
  \`viewsCount\` INT DEFAULT 0 NOT NULL,
  \`createdAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
  \`updatedAt\` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) NOT NULL,
  INDEX \`idx_banners_pos_active\` (\`position\`, \`isActive\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- INSERÇÃO / ATUALIZAÇÃO DOS DADOS
-- ========================================================
`;

  // Users
  for (const u of db.users) {
    sql += `REPLACE INTO \`users\` (\`id\`, \`name\`, \`email\`, \`passwordHash\`, \`role\`, \`createdAt\`, \`updatedAt\`) VALUES (${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.email)}, ${escapeSql(u.passwordHash)}, ${escapeSql(u.role)}, ${escapeSql(u.createdAt)}, ${escapeSql(u.updatedAt)});\n`;
  }

  // Categories
  for (const c of db.categories) {
    sql += `REPLACE INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`description\`, \`icon\`, \`order\`, \`createdAt\`, \`updatedAt\`) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}, ${escapeSql(c.description)}, ${escapeSql(c.icon)}, ${escapeSql(c.order)}, ${escapeSql(c.createdAt)}, ${escapeSql(c.updatedAt)});\n`;
  }

  // Subcategories
  if (db.subcategories) {
    for (const s of db.subcategories) {
      sql += `REPLACE INTO \`subcategories\` (\`id\`, \`name\`, \`slug\`, \`description\`, \`order\`, \`categoryId\`, \`createdAt\`, \`updatedAt\`) VALUES (${escapeSql(s.id)}, ${escapeSql(s.name)}, ${escapeSql(s.slug)}, ${escapeSql(s.description)}, ${escapeSql(s.order)}, ${escapeSql(s.categoryId)}, ${escapeSql(s.createdAt)}, ${escapeSql(s.updatedAt)});\n`;
    }
  }

  // Providers
  for (const p of db.providers) {
    sql += `REPLACE INTO \`providers\` (\`id\`, \`name\`, \`slug\`, \`cnpj\`, \`phone\`, \`whatsapp\`, \`email\`, \`website\`, \`instagram\`, \`address\`, \`neighborhood\`, \`city\`, \`state\`, \`zipCode\`, \`description\`, \`services\`, \`logoUrl\`, \`coverUrl\`, \`isFeatured\`, \`isActive\`, \`viewsCount\`, \`categoryId\`, \`subcategoryId\`, \`createdAt\`, \`updatedAt\`) VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.slug)}, ${escapeSql(p.cnpj)}, ${escapeSql(p.phone)}, ${escapeSql(p.whatsapp)}, ${escapeSql(p.email)}, ${escapeSql(p.website)}, ${escapeSql(p.instagram)}, ${escapeSql(p.address)}, ${escapeSql(p.neighborhood)}, ${escapeSql(p.city)}, ${escapeSql(p.state)}, ${escapeSql(p.zipCode)}, ${escapeSql(p.description)}, ${escapeSql(p.services)}, ${escapeSql(p.logoUrl)}, ${escapeSql(p.coverUrl)}, ${escapeSql(p.isFeatured)}, ${escapeSql(p.isActive)}, ${escapeSql(p.viewsCount || 0)}, ${escapeSql(p.categoryId)}, ${escapeSql(p.subcategoryId)}, ${escapeSql(p.createdAt)}, ${escapeSql(p.updatedAt)});\n`;
  }

  // Banners
  if (db.banners) {
    for (const b of db.banners) {
      sql += `REPLACE INTO \`banners\` (\`id\`, \`title\`, \`imageUrl\`, \`linkUrl\`, \`target\`, \`position\`, \`isActive\`, \`order\`, \`clicksCount\`, \`viewsCount\`, \`createdAt\`, \`updatedAt\`) VALUES (${escapeSql(b.id)}, ${escapeSql(b.title)}, ${escapeSql(b.imageUrl)}, ${escapeSql(b.linkUrl)}, ${escapeSql(b.target || '_blank')}, ${escapeSql(b.position || 'HERO_TOP')}, ${escapeSql(b.isActive)}, ${escapeSql(b.order || 0)}, ${escapeSql(b.clicksCount || 0)}, ${escapeSql(b.viewsCount || 0)}, ${escapeSql(b.createdAt)}, ${escapeSql(b.updatedAt)});\n`;
    }
  }

  sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n-- FIM DO SCRIPT\n`;
  return sql;
}
