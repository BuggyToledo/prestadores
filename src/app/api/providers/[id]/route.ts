import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { formatDatabaseError } from '@/lib/dbError';

interface Params {
  params: Promise<{ id: string }>;
}

// Obter prestador por ID ou Slug
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const provider = await prisma.provider.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Prestador não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Erro ao buscar prestador:', error);
    return NextResponse.json({ error: 'Erro ao buscar prestador.' }, { status: 500 });
  }
}

// Atualizar prestador (Admin)
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;
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
        { error: 'Nome, Cidade, Estado e Categoria são obrigatórios.' },
        { status: 400 }
      );
    }

    const existing = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Prestador não encontrado.' }, { status: 404 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json(
        {
          error:
            'Categoria não encontrada no banco. Sincronize as categorias no MySQL antes de atualizar.',
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

    // Se o nome mudou, atualizar o slug
    let slug = existing.slug;
    if (existing.name !== name) {
      const baseSlug = slugify(name);
      slug = baseSlug;
      let count = 1;
      while (
        await prisma.provider.findFirst({
          where: { slug, id: { not: id } },
        })
      ) {
        slug = `${baseSlug}-${count}`;
        count++;
      }
    }

    const updated = await prisma.provider.update({
      where: { id },
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

    return NextResponse.json({ success: true, provider: updated });
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error);
    return NextResponse.json(
      { error: formatDatabaseError(error, 'Erro ao atualizar prestador no MySQL.') },
      { status: 500 }
    );
  }
}

// Excluir prestador (Admin)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Prestador excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir prestador:', error);
    return NextResponse.json(
      { error: formatDatabaseError(error, 'Erro ao excluir prestador no MySQL.') },
      { status: 500 }
    );
  }
}
