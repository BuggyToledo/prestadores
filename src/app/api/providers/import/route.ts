import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado. Faça login novamente no painel.' }, { status: 401 });
    }

    const body = await request.json();
    const providers = body?.providers;

    if (!Array.isArray(providers) || providers.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum prestador válido foi enviado para importação.' },
        { status: 400 }
      );
    }

    // Carregar todas as categorias e subcategorias existentes do banco para correspondência rápida
    const [allCategories, allSubcategories] = await Promise.all([
      prisma.category.findMany(),
      prisma.subcategory.findMany(),
    ]);

    const categoryMap = new Map<string, string>(); // Chave normalizada -> categoryId
    const subcategoryMap = new Map<string, string>(); // Chave normalizada `${catId}_${subName}` -> subcategoryId

    allCategories.forEach((cat) => {
      categoryMap.set(cat.id.toLowerCase(), cat.id);
      categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      categoryMap.set(cat.slug.toLowerCase().trim(), cat.id);
    });

    allSubcategories.forEach((sub) => {
      const key = `${sub.categoryId}_${sub.name.toLowerCase().trim()}`;
      subcategoryMap.set(key, sub.id);
      subcategoryMap.set(`${sub.categoryId}_${sub.slug.toLowerCase().trim()}`, sub.id);
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
        const rawSubcategory = row.subcategory || row.subcategoria || row.subCategory || row.especialidade || '';

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
          // Criar ou localizar categoria no banco
          const catName = String(rawCategory).trim();
          const catSlug = slugify(catName) || `categoria-${Date.now()}`;

          // Verificar se já existe no banco
          const existingCategory = await prisma.category.findFirst({
            where: {
              OR: [{ name: catName }, { slug: catSlug }],
            },
          });

          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            const currentCatCount = await prisma.category.count();
            const newCategory = await prisma.category.create({
              data: {
                name: catName,
                slug: catSlug,
                description: `Serviços especializados em ${catName}`,
                icon: 'Briefcase',
                order: currentCatCount + 1,
              },
            });
            categoryId = newCategory.id;
          }

          categoryMap.set(catName.toLowerCase(), categoryId);
          categoryMap.set(normalizedCat, categoryId);
        }

        if (!categoryId) {
          const firstCat = await prisma.category.findFirst();
          categoryId = firstCat?.id;
        }

        // Encontrar ou criar subcategoria
        let subcategoryId: string | null = null;
        if (rawSubcategory && String(rawSubcategory).trim() && categoryId) {
          const subName = String(rawSubcategory).trim();
          const subKey = `${categoryId}_${subName.toLowerCase()}`;

          if (subcategoryMap.has(subKey)) {
            subcategoryId = subcategoryMap.get(subKey) || null;
          } else {
            const subSlug = slugify(subName) || `sub-${Date.now()}`;
            const existingSub = await prisma.subcategory.findFirst({
              where: {
                categoryId,
                OR: [{ name: subName }, { slug: subSlug }],
              },
            });

            if (existingSub) {
              subcategoryId = existingSub.id;
            } else {
              const count = await prisma.subcategory.count({ where: { categoryId } });
              const newSub = await prisma.subcategory.create({
                data: {
                  name: subName,
                  slug: `${categoryId.slice(0, 4)}-${subSlug}`,
                  categoryId,
                  order: count + 1,
                },
              });
              subcategoryId = newSub.id;
            }

            subcategoryMap.set(subKey, subcategoryId);
          }
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
            subcategoryId,
          },
        });

        results.successCount++;
      } catch (err: any) {
        console.error(`Erro ao importar linha ${rowNumber}:`, err);
        results.failedCount++;
        results.errors.push({
          row: rowNumber,
          name: row.name,
          message: err.message || 'Erro ao gravar prestador no banco.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      successCount: results.successCount,
      failedCount: results.failedCount,
      total: providers.length,
      errors: results.errors,
      message: `${results.successCount} prestador(es) importado(s) e salvo(s) com sucesso.`,
    });
  } catch (error: any) {
    console.error('Erro na rota de importação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar arquivo de importação.' },
      { status: 500 }
    );
  }
}
