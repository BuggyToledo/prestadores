import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

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
    const session = await getSessionUser();
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
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, provider: updated });
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error);
    return NextResponse.json({ error: 'Erro ao atualizar prestador.' }, { status: 500 });
  }
}

// Excluir prestador (Admin)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
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
    return NextResponse.json({ error: 'Erro ao excluir prestador.' }, { status: 500 });
  }
}
