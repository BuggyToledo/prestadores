import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
    }

    const body = await request.json();
    const providers = body?.providers;

    if (!Array.isArray(providers) || providers.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum prestador válido foi enviado para importação.' },
        { status: 400 }
      );
    }

    // Carregar todas as categorias existentes para correspondência rápida
    const allCategories = await prisma.category.findMany();
    const categoryMap = new Map<string, string>(); // Chave normalizada -> categoryId

    allCategories.forEach((cat) => {
      categoryMap.set(cat.id.toLowerCase(), cat.id);
      categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      categoryMap.set(cat.slug.toLowerCase().trim(), cat.id);
    });

    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as Array<{ row: number; name?: string; message: string }>,
    };

    for (let i = 0; i < providers.length; i++) {
      const row = providers[i];
      const rowNumber = i + 1;

      try {
        const name = row.name ? String(row.name).trim() : '';
        const city = row.city ? String(row.city).trim() : 'São Paulo';
        const state = row.state ? String(row.state).trim().toUpperCase() : 'SP';
        const rawCategory = row.category || row.categoryName || row.categoryId || 'Geral';

        if (!name) {
          results.failedCount++;
          results.errors.push({
            row: rowNumber,
            message: 'O campo "Nome" é obrigatório e está em branco.',
          });
          continue;
        }

        // Encontrar ou criar categoria
        let categoryId: string | undefined;
        const normalizedCat = String(rawCategory).toLowerCase().trim();

        if (categoryMap.has(normalizedCat)) {
          categoryId = categoryMap.get(normalizedCat);
        } else {
          // Criar nova categoria automaticamente
          const catName = String(rawCategory).trim();
          let catSlug = slugify(catName) || `categoria-${Date.now()}`;

          // Evitar slug duplicado para categoria
          const existingSlug = allCategories.find((c) => c.slug === catSlug);
          if (existingSlug) {
            catSlug = `${catSlug}-${Math.floor(Math.random() * 1000)}`;
          }

          const newCategory = await prisma.category.create({
            data: {
              name: catName,
              slug: catSlug,
              description: `Categoria de ${catName}`,
              icon: 'Briefcase',
              order: allCategories.length + 1,
            },
          });

          allCategories.push(newCategory);
          categoryId = newCategory.id;
          categoryMap.set(catName.toLowerCase(), newCategory.id);
          categoryMap.set(newCategory.slug.toLowerCase(), newCategory.id);
          categoryMap.set(newCategory.id.toLowerCase(), newCategory.id);
        }

        if (!categoryId) {
          categoryId = allCategories[0]?.id;
        }

        // Gerar slug único para o prestador
        const baseSlug = slugify(name) || `prestador-${Date.now()}`;
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.provider.findFirst({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Formatar booleano isFeatured
        let isFeatured = false;
        if (typeof row.isFeatured === 'boolean') {
          isFeatured = row.isFeatured;
        } else if (typeof row.isFeatured === 'string') {
          const lower = row.isFeatured.trim().toLowerCase();
          isFeatured = lower === 'sim' || lower === 'true' || lower === '1' || lower === 's';
        }

        await prisma.provider.create({
          data: {
            name,
            slug,
            cnpj: row.cnpj ? String(row.cnpj).trim() : null,
            phone: row.phone ? String(row.phone).trim() : null,
            whatsapp: row.whatsapp ? String(row.whatsapp).trim() : null,
            email: row.email ? String(row.email).trim() : null,
            website: row.website ? String(row.website).trim() : null,
            instagram: row.instagram ? String(row.instagram).trim() : null,
            address: row.address ? String(row.address).trim() : null,
            neighborhood: row.neighborhood ? String(row.neighborhood).trim() : null,
            city,
            state,
            zipCode: row.zipCode ? String(row.zipCode).trim() : null,
            description: row.description ? String(row.description).trim() : null,
            services: row.services ? String(row.services).trim() : null,
            logoUrl: row.logoUrl ? String(row.logoUrl).trim() : null,
            coverUrl: row.coverUrl ? String(row.coverUrl).trim() : null,
            isFeatured,
            isActive: true,
            categoryId: categoryId!,
          },
        });

        results.successCount++;
      } catch (err: any) {
        results.failedCount++;
        results.errors.push({
          row: rowNumber,
          name: row.name,
          message: err.message || 'Erro desconhecido ao salvar prestador.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      successCount: results.successCount,
      failedCount: results.failedCount,
      total: providers.length,
      errors: results.errors,
      message: `${results.successCount} prestador(es) importado(s) com sucesso.`,
    });
  } catch (error: any) {
    console.error('Erro na rota de importação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar arquivo de importação.' },
      { status: 500 }
    );
  }
}
