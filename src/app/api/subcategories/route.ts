import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// Listar subcategorias
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const subcategories = await prisma.subcategory.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error('Erro ao listar subcategorias:', error);
    return NextResponse.json({ error: 'Erro ao listar subcategorias.' }, { status: 500 });
  }
}

// Criar nova subcategoria (Admin)
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, categoryId, description, order } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Nome da subcategoria e Categoria pai são obrigatórios.' },
        { status: 400 }
      );
    }

    let slug = slugify(name.trim());
    const existingSlug = await prisma.subcategory.findFirst({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        name: name.trim(),
        slug,
        categoryId,
        description: description?.trim() || null,
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, subcategory }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar subcategoria:', error);
    return NextResponse.json({ error: 'Erro ao salvar subcategoria.' }, { status: 500 });
  }
}
