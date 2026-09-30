import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.provider.updateMany({
      where: {
        OR: [{ id }, { slug: id }],
      },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao incrementar visualizações:', error);
    return NextResponse.json({ error: 'Erro ao registrar visualização.' }, { status: 500 });
  }
}
