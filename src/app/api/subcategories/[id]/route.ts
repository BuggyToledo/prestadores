import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

interface Params {
  params: Promise<{ id: string }>;
}

// Obter subcategoria por ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
    });

    if (!subcategory) {
      return NextResponse.json({ error: 'Subcategoria não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error('Erro ao buscar subcategoria:', error);
    return NextResponse.json({ error: 'Erro ao buscar subcategoria.' }, { status: 500 });
  }
}

// Atualizar subcategoria (Admin)
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, categoryId, description, order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
    }

    const updated = await prisma.subcategory.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: slugify(name.trim()),
        ...(categoryId ? { categoryId } : {}),
        description: description?.trim() || null,
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, subcategory: updated });
  } catch (error) {
    console.error('Erro ao atualizar subcategoria:', error);
    return NextResponse.json({ error: 'Erro ao atualizar subcategoria.' }, { status: 500 });
  }
}

// Excluir subcategoria (Admin)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.subcategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Subcategoria excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir subcategoria:', error);
    return NextResponse.json({ error: 'Erro ao excluir subcategoria.' }, { status: 500 });
  }
}
