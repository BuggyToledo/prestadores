import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateCatalog } from '@/lib/catalogCache';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { sanitizeProviderContacts } from '@/lib/sanitizeInputs';
import { Prisma } from '@prisma/client';

// Listar prestadores com filtros avançados
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const categorySlug = searchParams.get('categoria') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const subcategorySlug = searchParams.get('subcategoria') || '';
    const subcategoryId = searchParams.get('subcategoryId') || '';
    const city = searchParams.get('cidade') || '';
    const state = searchParams.get('uf') || '';
    const featuredOnly = searchParams.get('destaque') === 'true';
    const allStatus = searchParams.get('all') === 'true'; // Admin: ativos e inativos
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    if (allStatus) {
      const session = await getSessionUser(request);
      if (!session) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
      }
    }

    const where: Prisma.ProviderWhereInput = {};

    // Filtro de status (usuários públicos só veem ativos)
    if (!allStatus) {
      where.isActive = true;
    }

    if (featuredOnly) {
      where.isFeatured = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    } else if (subcategorySlug) {
      where.subcategory = {
        slug: subcategorySlug,
      };
    }

    if (city) {
      where.city = {
        contains: city,
      };
    }

    if (state) {
      where.state = state.toUpperCase();
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { services: { contains: q } },
        { neighborhood: { contains: q } },
        { city: { contains: q } },
        { category: { name: { contains: q } } },
        { subcategory: { name: { contains: q } } },
      ];
    }

    const [total, providers] = await Promise.all([
      prisma.provider.count({ where }),
      prisma.provider.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
          subcategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { name: 'asc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      providers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar prestadores:', error);
    return NextResponse.json({ error: 'Erro ao buscar prestadores.' }, { status: 500 });
  }
}

// Cadastrar novo prestador (Admin)
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      cnpj,
      phone,
      whatsapp,
      email,
      website,
      instagram,
      address,
      neighborhood,
      city,
      state,
      zipCode,
      description,
      services,
      logoUrl,
      coverUrl,
      isFeatured,
      isActive,
      categoryId,
      subcategoryId,
    } = body;

    if (!name || !city || !state || !categoryId) {
      return NextResponse.json(
        { error: 'Nome, Cidade, Estado e Categoria são campos obrigatórios.' },
        { status: 400 }
      );
    }

    const contacts = sanitizeProviderContacts({
      phone,
      whatsapp,
      website,
      instagram,
      logoUrl,
      coverUrl,
    });
    if (!contacts.ok) {
      return NextResponse.json({ error: contacts.error }, { status: 400 });
    }

    // Gerar slug único
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await prisma.provider.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    const provider = await prisma.provider.create({
      data: {
        name: name.trim(),
        slug,
        cnpj: cnpj?.trim() || null,
        phone: contacts.data.phone,
        whatsapp: contacts.data.whatsapp,
        email: email?.trim() || null,
        website: contacts.data.website,
        instagram: contacts.data.instagram,
        address: address?.trim() || null,
        neighborhood: neighborhood?.trim() || null,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode?.trim() || null,
        description: description?.trim() || null,
        services: services?.trim() || null,
        logoUrl: contacts.data.logoUrl,
        coverUrl: contacts.data.coverUrl,
        isFeatured: Boolean(isFeatured),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        categoryId,
        subcategoryId: subcategoryId || null,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    revalidateCatalog('providers');
    return NextResponse.json({ success: true, provider }, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar prestador:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar prestador de serviços.' }, { status: 500 });
  }
}
