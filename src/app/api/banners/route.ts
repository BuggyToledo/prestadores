import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateCatalog } from '@/lib/catalogCache';
import { getSessionUser } from '@/lib/auth';
import { sanitizeBannerFields } from '@/lib/sanitizeInputs';

// Listar Banners
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const all = searchParams.get('all') === 'true'; // Admin: ativos e inativos

    if (all) {
      const session = await getSessionUser(request);
      if (!session) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
      }
    }

    const where: Record<string, unknown> = {};

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

    if (!title) {
      return NextResponse.json({ error: 'Título do banner é obrigatório.' }, { status: 400 });
    }

    const fields = sanitizeBannerFields({ imageUrl, linkUrl });
    if (!fields.ok) {
      return NextResponse.json({ error: fields.error }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        imageUrl: fields.imageUrl,
        linkUrl: fields.linkUrl,
        target: target || '_blank',
        position: position || 'HERO_TOP',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: Number(order) || 0,
      },
    });

    revalidateCatalog('banners');
    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    return NextResponse.json({ error: 'Erro ao salvar banner de publicidade.' }, { status: 500 });
  }
}
