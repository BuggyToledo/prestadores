import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { formatDatabaseError } from '@/lib/dbError';
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
    const allStatus = searchParams.get('all') === 'true'; // Se true (Admin), retorna ativos e inativos
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

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

    // Garantir que a categoria existe no banco ativo (MySQL ou mock)
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json(
        {
          error:
            'Categoria não encontrada no banco. Sincronize as categorias no MySQL (Admin > Banco) ou selecione outra categoria.',
        },
        { status: 400 }
      );
    }

    let resolvedSubcategoryId: string | null = subcategoryId || null;
    if (resolvedSubcategoryId) {
      const subcategory = await prisma.subcategory.findUnique({ where: { id: resolvedSubcategoryId } });
      if (!subcategory || subcategory.categoryId !== categoryId) {
        return NextResponse.json(
          {
            error:
              'Subcategoria inválida para a categoria selecionada. Escolha outra especialidade ou deixe em branco.',
          },
          { status: 400 }
        );
      }
    }

    // Gerar slug único
    let baseSlug = slugify(name);
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
        phone: phone?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        instagram: instagram?.trim() || null,
        address: address?.trim() || null,
        neighborhood: neighborhood?.trim() || null,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode?.trim() || null,
        description: description?.trim() || null,
        services: services?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        coverUrl: coverUrl?.trim() || null,
        isFeatured: Boolean(isFeatured),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        categoryId,
        subcategoryId: resolvedSubcategoryId,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    return NextResponse.json({ success: true, provider }, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar prestador:', error);
    return NextResponse.json(
      { error: formatDatabaseError(error, 'Erro ao cadastrar prestador de serviços no MySQL.') },
      { status: 500 }
    );
  }
}
