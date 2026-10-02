const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed do Banco de Dados...');

  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminName = (process.env.ADMIN_NAME || 'Administrador').trim();

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Seed abortado: defina ADMIN_EMAIL e ADMIN_PASSWORD no ambiente (senha mínima 12 caracteres).'
    );
  }
  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres.');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Usuário Administrador criado (${adminEmail}). Senha não é exibida.`);
  } else {
    console.log(`ℹ️ Usuário Administrador já existe (${adminEmail}).`);
  }

  // Categorias iniciais (idempotente)
  const categoriesData = [
    {
      name: 'Eletricistas',
      slug: 'eletricistas',
      description: 'Instalação elétrica, reparos em disjuntores, fiação, iluminação residencial e industrial.',
      icon: 'Zap',
      order: 1,
    },
    {
      name: 'Encanadores e Desentupidoras',
      slug: 'encanadores',
      description: 'Conserto de vazamentos, desentupimento, instalação de louças e tubulações hidráulicas.',
      icon: 'Wrench',
      order: 2,
    },
    {
      name: 'Pintores e Acabamentos',
      slug: 'pintores',
      description: 'Pintura residencial, predial, texturas, massa corrida, impermeabilização e verniz.',
      icon: 'Paintbrush',
      order: 3,
    },
    {
      name: 'Ar-Condicionado e Refrigeração',
      slug: 'ar-condicionado',
      description: 'Instalação, limpeza, manutenção preventiva e recarga de gás para ar-condicionado.',
      icon: 'Wind',
      order: 4,
    },
    {
      name: 'Chaveiros 24 Horas',
      slug: 'chaveiros',
      description: 'Abertura de portas, cópia de chaves codificadas, troca de fechaduras residenciais e automotivas.',
      icon: 'Key',
      order: 5,
    },
    {
      name: 'Marcenaria e Móveis Planejados',
      slug: 'marcenaria',
      description: 'Fabricação e conserto de móveis sob medida, restauração e montagem de móveis.',
      icon: 'Hammer',
      order: 6,
    },
    {
      name: 'Mecânica e Auto Center',
      slug: 'mecanica',
      description: 'Revisão mecânica, suspensão, freios, injeção eletrônica, alinhamento e balanceamento.',
      icon: 'Car',
      order: 7,
    },
    {
      name: 'Limpeza e Diaristas',
      slug: 'limpeza',
      description: 'Serviços de faxina residencial, limpeza pós-obra, higienização de estofados e tapetes.',
      icon: 'Sparkles',
      order: 8,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    console.log(`📁 Categoria sincronizada: ${cat.name}`);
  }

  console.log('🎉 Seed finalizado (sem prestadores de exemplo).');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
