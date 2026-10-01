const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DEFAULT_CATEGORIES } = require('../src/lib/defaultCategories');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed do Banco de Dados...');

  // 1. Criar Usuário Administrador Padrão
  const adminEmail = 'admin@catalogo.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Usuário Administrador criado com sucesso! (Email: admin@catalogo.com / Senha: admin123)');
  } else {
    console.log('ℹ️ Usuário Administrador já existe.');
  }

  // 2. Criar / atualizar as 12 categorias padrão (sem subcategorias)
  for (const cat of DEFAULT_CATEGORIES) {
    const { id: _fixedId, ...payload } = cat;
    await prisma.category.upsert({
      where: { slug: payload.slug },
      update: {
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        order: payload.order,
      },
      create: payload,
    });
    console.log(`📁 Categoria sincronizada: ${cat.name} (${cat.icon})`);
  }

  // 3. Catálogo limpo: apaga todos os prestadores e subcategorias
  const providerCount = await prisma.provider.deleteMany({});
  if (providerCount.count > 0) {
    console.log(`🧹 Removidos ${providerCount.count} prestador(es).`);
  }

  const subCount = await prisma.subcategory.deleteMany({});
  if (subCount.count > 0) {
    console.log(`🧹 Removidas ${subCount.count} subcategoria(s).`);
  }

  // Remove categorias que não estão no catálogo padrão
  const defaultSlugs = DEFAULT_CATEGORIES.map((c) => c.slug);
  const extras = await prisma.category.deleteMany({
    where: { slug: { notIn: defaultSlugs } },
  });
  if (extras.count > 0) {
    console.log(`🧹 Removidas ${extras.count} categoria(s) fora do catálogo padrão.`);
  }

  console.log('🎉 Seed finalizado com sucesso! (12 categorias, 0 prestadores, sem subcategorias)');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
