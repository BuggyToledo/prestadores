import { NextResponse } from 'next/server';
import { buildSampleCsvContent } from '@/lib/providerImportParse';

export async function GET() {
  return new NextResponse(buildSampleCsvContent(), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="modelo_importacao_prestadores.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
