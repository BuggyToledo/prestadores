import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

interface Params {
  params: Promise<{ id: string }>;
}

// Obter categoria por ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { providers: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return NextResponse.json({ error: 'Erro ao buscar categoria.' }, { status: 500 });
  }
}

// Atualizar categoria
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, order } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'O nome da categoria é obrigatório.' }, { status: 400 });
    }

    const slug = slugify(name);

    // Verificar se já existe outra categoria com mesmo nome ou slug
    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: [{ name: name.trim() }, { slug }],
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Já existe outra categoria com este nome.' }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon?.trim() || 'Briefcase',
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria.' }, { status: 500 });
  }
}

// Excluir categoria
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se existem prestadores vinculados
    const count = await prisma.provider.count({
      where: { categoryId: id },
    });

    if (count > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir esta categoria pois ela possui ${count} prestador(es) vinculado(s). Reatribua-os antes de excluir.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Categoria excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria.' }, { status: 500 });
  }
}
