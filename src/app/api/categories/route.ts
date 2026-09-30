import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// Listar categorias
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        subcategories: {
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
        },
        _count: {
          select: {
            providers: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json({ error: 'Erro ao listar categorias.' }, { status: 500 });
  }
}

// Criar nova categoria (Admin)
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, order } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'O nome da categoria é obrigatório.' }, { status: 400 });
    }

    const slug = slugify(name);

    // Verificar se slug já existe
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Já existe uma categoria com este nome.' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon?.trim() || 'Briefcase',
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar categoria.' }, { status: 500 });
  }
}
