import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateCatalog } from '@/lib/catalogCache';
import { getSessionUser } from '@/lib/auth';
import { sanitizeBannerFields } from '@/lib/sanitizeInputs';

interface Params {
  params: Promise<{ id: string }>;
}

// Obter banner por ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const banner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      return NextResponse.json({ error: 'Banner não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Erro ao buscar banner:', error);
    return NextResponse.json({ error: 'Erro ao buscar banner.' }, { status: 500 });
  }
}

// Atualizar banner (Admin)
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, imageUrl, linkUrl, target, position, isActive, order } = body;

    if (!title) {
      return NextResponse.json({ error: 'Título do banner é obrigatório.' }, { status: 400 });
    }

    const fields = sanitizeBannerFields({ imageUrl, linkUrl });
    if (!fields.ok) {
      return NextResponse.json({ error: fields.error }, { status: 400 });
    }

    const updated = await prisma.banner.update({
      where: { id },
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
    return NextResponse.json({ success: true, banner: updated });
  } catch (error) {
    console.error('Erro ao atualizar banner:', error);
    return NextResponse.json({ error: 'Erro ao atualizar banner.' }, { status: 500 });
  }
}

// Excluir banner (Admin)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.banner.delete({
      where: { id },
    });

    revalidateCatalog('banners');
    return NextResponse.json({ success: true, message: 'Banner excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir banner:', error);
    return NextResponse.json({ error: 'Erro ao excluir banner.' }, { status: 500 });
  }
}
