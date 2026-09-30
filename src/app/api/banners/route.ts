import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// Listar Banners
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const all = searchParams.get('all') === 'true'; // Se true (Admin), traz ativos e inativos

    const where: any = {};

    if (!all) {
      where.isActive = true;
    }

    if (position) {
      where.position = position;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Erro ao listar banners:', error);
    return NextResponse.json({ error: 'Erro ao listar banners.' }, { status: 500 });
  }
}

// Criar Banner (Admin)
export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, imageUrl, linkUrl, target, position, isActive, order } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: 'Título do banner e imagem são obrigatórios.' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl?.trim() || null,
        target: target || '_blank',
        position: position || 'HERO_TOP',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    return NextResponse.json({ error: 'Erro ao salvar banner de publicidade.' }, { status: 500 });
  }
}
