import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  PROVIDER_IMPORT_HEADERS,
  PROVIDER_IMPORT_SAMPLE_ROWS,
} from '@/lib/providerImportParse';

export async function GET() {
  const aoa = [Array.from(PROVIDER_IMPORT_HEADERS), ...PROVIDER_IMPORT_SAMPLE_ROWS];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = PROVIDER_IMPORT_HEADERS.map((header) => ({
    wch: Math.max(14, header.length + 2),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prestadores');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modelo_importacao_prestadores.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
