import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.banner.update({
      where: { id },
      data: {
        clicksCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar clique no banner:', error);
    return NextResponse.json({ error: 'Erro ao registrar métrica.' }, { status: 500 });
  }
}
