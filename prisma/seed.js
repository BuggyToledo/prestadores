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
  const categoryMap = {};

  for (const cat of DEFAULT_CATEGORIES) {
    const { id: _fixedId, ...payload } = cat;
    const upserted = await prisma.category.upsert({
      where: { slug: payload.slug },
      update: {
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        order: payload.order,
      },
      create: payload,
    });
    categoryMap[cat.slug] = upserted.id;
    console.log(`📁 Categoria sincronizada: ${cat.name} (${cat.icon})`);
  }

  // 3. Prestadores de exemplo (opcional — só se ainda não existirem)
  const providersData = [
    {
      name: 'EletroSilva Serviços Elétricos',
      slug: 'eletrosilva-servicos-eletricos',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 3456-7890',
      whatsapp: '11987654321',
      email: 'contato@eletrosilva.com.br',
      website: 'https://eletrosilva.com.br',
      instagram: '@eletrosilva_eletrica',
      address: 'Rua das Palmeiras, 150',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01420-000',
      description:
        'Especialistas em instalações elétricas residenciais e comerciais. Atendimento emergencial 24 horas, troca de disjuntores, adequação de padrão de entrada e projetos luminotécnicos com garantia e emissão de ART.',
      services:
        'Instalação de tomadas e interruptores, Troca de fiação antiga, Instalação de chuveiros e aquecedores, Laudo elétrico, Montagem de quadros de distribuição',
      logoUrl:
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
      isFeatured: true,
      isActive: true,
      categoryId: categoryMap['manutencao-predial-e-instalacoes'],
    },
    {
      name: 'SOS Desentupidora & Hidráulica Água Limpa',
      slug: 'sos-desentupidora-hidraulica-agua-limpa',
      cnpj: '23.456.789/0001-01',
      phone: '(11) 4002-8922',
      whatsapp: '11999887766',
      email: 'atendimento@agualimpadesentupimento.com',
      website: 'https://agualimpadesentupimento.com',
      instagram: '@desentupidora_agualimpa',
      address: 'Av. Paulista, 2000, Sala 42',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      description:
        'Serviço rápido de caça-vazamentos não destrutivo com geofone, desentupimento de pias, ralos, vasos sanitários e redes de esgoto pluvial. Atendimento 24h sem taxa de visita.',
      services:
        'Caça vazamentos eletrônico, Desentupimento por hidrojateamento, Troca de tubulação, Instalação de válvulas de descarga, Limpeza de caixa de gordura',
      logoUrl:
        'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop&q=80',
      isFeatured: true,
      isActive: true,
      categoryId: categoryMap['manutencao-predial-e-instalacoes'],
    },
    {
      name: 'CleanMaster Higienização & Limpeza Profissional',
      slug: 'cleanmaster-higienizacao-limpeza-profissional',
      cnpj: '78.901.234/0001-56',
      phone: '(11) 3211-9876',
      whatsapp: '11993334444',
      email: 'contato@cleanmasterlimpeza.com.br',
      website: 'https://cleanmasterlimpeza.com.br',
      instagram: '@cleanmaster_higienizacao',
      address: 'Rua Teodoro Sampaio, 1800',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05406-150',
      description:
        'Empresa especializada em limpeza pós-obra, higienização e impermeabilização de estofados, colchões, sofás e carpetes com produtos ecológicos certificados pela Anvisa.',
      services:
        'Limpeza pós-obra fina e pesada, Higienização de sofás e poltronas a seco, Impermeabilização de estofados, Limpeza de vidros em altura, Tratamento de pisos',
      logoUrl:
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
      isFeatured: false,
      isActive: true,
      categoryId: categoryMap['limpeza-conservacao-e-controle-de-pragas'],
    },
  ];

  for (const provider of providersData) {
    if (!provider.categoryId) {
      console.warn(`⚠️ Prestador sem categoria mapeada: ${provider.name}`);
      continue;
    }
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    });
    console.log(`🛠️ Prestador sincronizado: ${provider.name}`);
  }

  console.log('🎉 Seed finalizado com sucesso! (12 categorias, sem subcategorias)');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
