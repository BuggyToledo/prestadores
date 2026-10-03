#!/usr/bin/env npx tsx
/**
 * clean-data — dry-run por padrão.
 *
 * Exemplos:
 *   npx tsx scripts/clean-data.ts --from-csv data/amostra-providers.csv
 *   npx tsx scripts/clean-data.ts --from-db
 *   npx tsx scripts/clean-data.ts --apply --from-review reports/revisao.csv
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  assertSafeTestDatabase,
  maskDatabaseUrl,
} from '../src/lib/dbSafety';
import {
  buildReviewRows,
  filterApprovedRows,
  parseReviewCsv,
  reviewRowsToCsv,
  splitCsvLine,
} from '../src/lib/cleanData/engine';
import type { CleanProviderInput } from '../src/lib/cleanData/types';
import {
  computeLocationCoverage,
  suggestCityFromNeighborhoodAndDdd,
} from '../src/lib/regions';

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = { dryRun: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--from-db') args.fromDb = true;
    else if (a === '--from-csv') args.fromCsv = argv[++i];
    else if (a === '--from-review') args.fromReview = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function loadProvidersFromCsv(filePath: string): CleanProviderInput[] {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const get = (cols: string[], name: string) => {
    const i = headers.indexOf(name);
    return i >= 0 ? (cols[i] || '').trim() : '';
  };

  const providers: CleanProviderInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (!get(cols, 'id') && !get(cols, 'name')) continue;
    providers.push({
      id: get(cols, 'id') || `row_${i}`,
      name: get(cols, 'name') || get(cols, 'nome'),
      displayName: get(cols, 'displayname') || null,
      slug: get(cols, 'slug') || null,
      phone: get(cols, 'phone') || get(cols, 'telefone') || null,
      whatsapp: get(cols, 'whatsapp') || null,
      address: get(cols, 'address') || get(cols, 'endereco') || null,
      neighborhood: get(cols, 'neighborhood') || get(cols, 'bairro') || null,
      city: get(cols, 'city') || get(cols, 'cidade') || null,
      state: get(cols, 'state') || get(cols, 'uf') || null,
      categoryName: get(cols, 'category') || get(cols, 'categoria') || null,
      kind: get(cols, 'kind') || null,
    });
  }
  return providers;
}

async function loadProvidersFromDb(): Promise<CleanProviderInput[]> {
  assertSafeTestDatabase(process.env.DATABASE_URL);
  console.log('Conectando (mascarado):', maskDatabaseUrl(process.env.DATABASE_URL));

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const list = await prisma.provider.findMany({
      include: { category: { select: { name: true } } },
    });
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: (p as { displayName?: string | null }).displayName,
      slug: p.slug,
      phone: p.phone,
      whatsapp: p.whatsapp,
      address: p.address,
      neighborhood: p.neighborhood,
      city: p.city,
      state: p.state,
      categoryName: p.category?.name,
      kind: (p as { kind?: string }).kind,
    }));
  } finally {
    await prisma.$disconnect();
  }
}

async function applyFromReview(reviewPath: string) {
  assertSafeTestDatabase(process.env.DATABASE_URL);
  console.log('Apply (mascarado):', maskDatabaseUrl(process.env.DATABASE_URL));

  const content = fs.readFileSync(reviewPath, 'utf8');
  const approved = filterApprovedRows(parseReviewCsv(content));
  if (approved.length === 0) {
    console.log('Nenhuma linha com aprovado=SIM. Nada a fazer.');
    return;
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  let applied = 0;
  try {
    for (const row of approved) {
      if (!row.id || !row.campo) continue;
      if (row.acao_sugerida === 'flag_duplicate') continue;

      const data: Record<string, unknown> = {};
      switch (row.campo) {
        case 'kind':
          data.kind = row.valor_novo;
          break;
        case 'displayName':
          data.displayName = row.valor_novo;
          break;
        case 'slug':
          data.slug = row.valor_novo;
          break;
        case 'address':
          data.address = row.valor_novo;
          break;
        case 'neighborhood':
          data.neighborhood = row.valor_novo;
          break;
        case 'city':
          data.city = row.valor_novo;
          break;
        case 'state':
          data.state = row.valor_novo;
          break;
        case 'phone':
          data.phone = row.valor_novo || null;
          break;
        case 'whatsapp':
          data.whatsapp = row.valor_novo || null;
          break;
        case 'needsReview':
          data.needsReview = row.valor_novo === 'true';
          data.reviewNotes = row.motivo;
          break;
        default:
          console.warn(`Campo ignorado: ${row.campo}`);
          continue;
      }

      await prisma.provider.update({
        where: { id: row.id },
        data: data as never,
      });
      applied++;
    }
    console.log(`Aplicadas ${applied} alterações aprovadas.`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Uso:
  npx tsx scripts/clean-data.ts --from-csv data/amostra-providers.csv
  npx tsx scripts/clean-data.ts --from-db
  npx tsx scripts/clean-data.ts --apply --from-review reports/revisao.csv

Dry-run é o padrão. --apply só com --from-review e banco *_test/_teste.`);
    return;
  }

  if (!args.dryRun) {
    if (!args.fromReview) {
      console.error('--apply exige --from-review arquivo.csv');
      process.exit(1);
    }
    await applyFromReview(String(args.fromReview));
    return;
  }

  let providers: CleanProviderInput[] = [];
  if (args.fromDb) {
    providers = await loadProvidersFromDb();
  } else {
    const csvPath = String(args.fromCsv || 'data/amostra-providers.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`Arquivo CSV não encontrado: ${csvPath}`);
      process.exit(1);
    }
    console.log('Lendo CSV:', csvPath);
    providers = loadProvidersFromCsv(csvPath);
  }

  console.log(`Prestadores lidos: ${providers.length}`);

  // Métrica pós-extração (bairro/cidade preenchidos no input atual)
  const coverage = computeLocationCoverage(providers);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  console.log('--- Cobertura de localização ---');
  console.log(`  Com bairro:     ${coverage.withNeighborhood}/${coverage.total} (${pct(coverage.pctNeighborhood)})`);
  console.log(`  Com cidade:     ${coverage.withCity}/${coverage.total} (${pct(coverage.pctCity)})`);
  console.log(`  Com ambos:      ${coverage.withBoth}/${coverage.total} (${pct(coverage.pctBoth)})`);
  console.log(`  Matchable RJ:   ${coverage.matchable}/${coverage.total} (${pct(coverage.pctMatchable)})`);
  let inferred = 0;
  for (const p of providers) {
    if (suggestCityFromNeighborhoodAndDdd(p)) inferred++;
  }
  console.log(`  Inferíveis DDD: ${inferred} (bairro na lista + DDD 21/22/24, city vazia)`);

  const review = buildReviewRows(providers);
  const outDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = String(args.out || path.join(outDir, 'clean-data-review.csv'));
  fs.writeFileSync(outPath, reviewRowsToCsv(review), 'utf8');
  console.log(`Relatório dry-run: ${outPath} (${review.length} linhas)`);
  console.log('Revise a coluna "aprovado" (escreva SIM) e rode com --apply --from-review ...');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
