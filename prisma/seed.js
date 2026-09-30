const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

  // 2. Criar Categorias Iniciais
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

  const categoryMap = {};

  for (const cat of categoriesData) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap[cat.slug] = upserted.id;
    console.log(`📁 Categoria sincronizada: ${cat.name}`);
  }

  // 3. Criar Prestadores de Exemplo
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
      description: 'Especialistas em instalações elétricas residenciais e comerciais. Atendimento emergencial 24 horas, troca de disjuntores, adequação de padrão de entrada e projetos luminotécnicos com garantia e emissão de ART.',
      services: 'Instalação de tomadas e interruptores, Troca de fiação antiga, Instalação de chuveiros e aquecedores, Laudo elétrico, Montagem de quadros de distribuição',
      logoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
      isFeatured: true,
      isActive: true,
      categoryId: categoryMap['eletricistas'],
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
      description: 'Serviço rápido de caça-vazamentos não destrutivo com geofone, desentupimento de pias, ralos, vasos sanitários e redes de esgoto pluvial. Atendimento 24h sem taxa de visita.',
      services: 'Caça vazamentos eletrônico, Desentupimento por hidrojateamento, Troca de tubulação, Instalação de válvulas de descarga, Limpeza de caixa de gordura',
      logoUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop&q=80',
      isFeatured: true,
      isActive: true,
      categoryId: categoryMap['encanadores'],
    },
    {
      name: 'Arte & Cor Pinturas Profissionais',
      slug: 'arte-cor-pinturas-profissionais',
      cnpj: '34.567.890/0001-12',
      phone: '(11) 2233-4455',
      whatsapp: '11977112233',
      email: 'orcamento@arteecorpinturas.com.br',
      website: 'https://arteecorpinturas.com.br',
      instagram: '@artecor.pinturas',
      address: 'Rua Augusta, 850',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01304-001',
      description: 'Equipe especializada em pintura de alto padrão, aplicação de cimento queimado, efeitos decorativos, restauração de fachadas e impermeabilização. Trabalhamos com limpeza total e proteção de todo o ambiente.',
      services: 'Pintura interna e externa, Aplicação de cimento queimado e texturas, Massa corrida e gesso, Laqueação de portas e janelas, Verniz em decks e pergolados',
      logoUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80',
      isFeatured: false,
      isActive: true,
      categoryId: categoryMap['pintores'],
    },
    {
      name: 'ClimaFrio Refrigeração e Ar-Condicionado',
      slug: 'climafrio-refrigeracao-ar-condicionado',
      cnpj: '45.678.901/0001-23',
      phone: '(11) 3344-5566',
      whatsapp: '11988223344',
      email: 'contato@climafrio.com.br',
      website: 'https://climafrio.com.br',
      instagram: '@climafrio_refrigeracao',
      address: 'Rua Domingos de Morais, 1200',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04010-100',
      description: 'Venda, instalação e manutenção de sistemas de climatização Split, Multi Split e VRF. Higienização antibactericida completa e contratos PMOC para empresas.',
      services: 'Instalação de Ar-Condicionado Split e Inverter, Higienização profunda com laudo, Carga de gás ecológico R410/R32, Manutenção de placas eletrônicas',
      logoUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&auto=format&fit=crop&q=80',
      isFeatured: true,
      isActive: true,
      categoryId: categoryMap['ar-condicionado'],
    },
    {
      name: 'Chaveiro Express Central 24h',
      slug: 'chaveiro-express-central-24h',
      cnpj: '56.789.012/0001-34',
      phone: '(11) 3100-2020',
      whatsapp: '11991112222',
      email: 'socorro@chaveiroexpress24h.com',
      website: 'https://chaveiroexpress24h.com',
      instagram: '@chaveiro_express24',
      address: 'Rua Vergueiro, 500',
      neighborhood: 'Liberdade',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01504-000',
      description: 'Unidade móvel de atendimento rápido em até 20 minutos para aberturas residenciais e automotivas, confecção de chaves pantográficas e canivete, troca de segredos e fechaduras digitais.',
      services: 'Abertura de portas e cofres, Chaves codificadas automotivas, Instalação de fechaduras biométricas/digitais, Troca de cilindro e segredo',
      logoUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=80',
      isFeatured: false,
      isActive: true,
      categoryId: categoryMap['chaveiros'],
    },
    {
      name: 'Studio Nobre Móveis Planejados',
      slug: 'studio-nobre-moveis-planejados',
      cnpj: '67.890.123/0001-45',
      phone: '(11) 2589-7412',
      whatsapp: '11984445555',
      email: 'projetos@studionobremarcenaria.com.br',
      website: 'https://studionobremarcenaria.com.br',
      instagram: '@studionobre_moveis',
      address: 'Av. Moema, 680',
      neighborhood: 'Moema',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04077-020',
      description: 'Marcenaria fina com tecnologia de ponta. Criamos cozinhas planejadas, closets, home theaters e mobiliário corporativo com acabamentos exclusivos em MDF 100%, amortecimento e iluminação embutida em LED.',
      services: 'Cozinhas planejadas, Dormitórios e closets, Painéis ripados e divisórias, Mobiliário corporativo, Consultoria de projetos 3D',
      logoUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop&q=80',
      isFeatured: true,
      isActive: true,
      categoryId: categoryMap['marcenaria'],
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
      description: 'Empresa especializada em limpeza pós-obra, higienização e impermeabilização de estofados, colchões, sofás e carpetes com produtos ecológicos certificados pela Anvisa.',
      services: 'Limpeza pós-obra fina e pesada, Higienização de sofás e poltronas a seco, Impermeabilização de estofados, Limpeza de vidros em altura, Tratamento de pisos',
      logoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
      isFeatured: false,
      isActive: true,
      categoryId: categoryMap['limpeza'],
    },
  ];

  for (const provider of providersData) {
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    });
    console.log(`🛠️ Prestador sincronizado: ${provider.name}`);
  }

  console.log('🎉 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
