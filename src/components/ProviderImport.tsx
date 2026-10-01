'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Users,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import {
  ParsedProvider,
  PROVIDER_IMPORT_HEADERS,
  PROVIDER_IMPORT_SAMPLE_ROWS,
  buildSampleCsvContent,
  csvTextToMatrix,
  parseProviderMatrix,
} from '@/lib/providerImportParse';

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('excel')
  );
}

export function ProviderImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedProvider[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    failed: number;
    errors: Array<{ row: number; name?: string; message: string }>;
  } | null>(null);

  const handleDownloadSampleCsv = () => {
    const csvContent = buildSampleCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_prestadores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleXlsx = () => {
    const aoa = [Array.from(PROVIDER_IMPORT_HEADERS), ...PROVIDER_IMPORT_SAMPLE_ROWS];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!cols'] = PROVIDER_IMPORT_HEADERS.map((header) => ({
      wch: Math.max(14, header.length + 2),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prestadores');
    XLSX.writeFile(workbook, 'modelo_importacao_prestadores.xlsx');
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setParseError('');
    setImportResult(null);
    setIsParsing(true);
    setFileName(file.name);

    try {
      let matrix: unknown[][];

      if (isExcelFile(file)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('A planilha Excel está vazia (nenhuma aba encontrada).');
        }
        const sheet = workbook.Sheets[firstSheetName];
        matrix = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
          blankrows: false,
        }) as unknown[][];
      } else {
        const text = await file.text();
        matrix = csvTextToMatrix(text);
      }

      const parsed = parseProviderMatrix(matrix);
      setParsedRows(parsed);
    } catch (err: any) {
      setParseError(err.message || 'Erro ao processar o arquivo.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClear = () => {
    setParsedRows([]);
    setFileName('');
    setParseError('');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setParseError('');

    try {
      const res = await authFetch('/api/providers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: parsedRows }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao importar prestadores.');
      }

      setImportResult({
        success: true,
        count: data.successCount || 0,
        failed: data.failedCount || 0,
        errors: data.errors || [],
      });
      setParsedRows([]);
    } catch (err: any) {
      setParseError(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Bloco de Download de Arquivo de Exemplo */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent p-6 rounded-3xl border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modelo Pronto para Preenchimento</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Baixe a planilha modelo de exemplo
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Arquivo com as colunas corretas (Nome, Categoria, Cidade, Estado, WhatsApp, etc.).
            Disponível em <strong>Excel (.xlsx)</strong> e <strong>CSV</strong> — compatível com
            Microsoft Excel, Google Planilhas e LibreOffice.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadSampleXlsx}
            type="button"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all text-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Modelo (.XLSX)</span>
          </button>
          <button
            onClick={handleDownloadSampleCsv}
            type="button"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold px-5 py-3 rounded-2xl border border-slate-200 shadow-xs transition-all text-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Baixar Modelo (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Resultado de Importação Realizada */}
      {importResult && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-emerald-950">
                Importação concluída com sucesso!
              </h3>
              <p className="text-sm text-emerald-800 mt-1">
                Foram cadastrados <strong>{importResult.count} prestador(es)</strong> no catálogo do
                Guia Síndico Né!.
                {importResult.failed > 0 && ` (${importResult.failed} registro(s) com erro).`}
              </p>

              {importResult.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                  <div className="font-bold">Avisos da importação:</div>
                  {importResult.errors.map((e, idx) => (
                    <div key={idx}>
                      Linha {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Link
                  href="/admin/prestadores"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Ver Todos os Prestadores</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <span>Importar Novo Arquivo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Erro */}
      {parseError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Erro no arquivo de importação:</span>
            <span>{parseError}</span>
          </div>
        </div>
      )}

      {/* Área de Upload (Drag and Drop) */}
      {!parsedRows.length && !importResult && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
            dragActive
              ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
            {isParsing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 stroke-[2.2]" />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isParsing
                ? 'Processando arquivo...'
                : 'Arraste seu arquivo aqui ou clique para selecionar'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Formatos aceitos: <strong>.XLSX</strong> (Excel) e <strong>.CSV</strong> (UTF-8,
              separador <code>;</code> ou <code>,</code>)
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-100/70 px-3 py-1.5 rounded-xl mt-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tamanho máximo recomendado: 5 MB</span>
          </div>
        </div>
      )}

      {/* Pré-visualização dos Dados Carregados */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 flex-wrap">
                  <span>{fileName || 'Arquivo'}</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    {parsedRows.length} prestador(es) pronto(s)
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Revise os dados antes de gravar no banco de dados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClear}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Descartar</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Importar {parsedRows.length} Prestadores</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px] rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Prestador</th>
                  <th className="py-3 px-4">Categoria / Subcategoria</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Destaque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {parsedRows.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-bold">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{row.name}</div>
                      {row.cnpj && (
                        <div className="text-[10px] text-slate-400">CNPJ: {row.cnpj}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-block bg-slate-100 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          {row.category}
                        </span>
                        {row.subcategory && (
                          <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium px-1.5 py-0.5 rounded">
                            ↳ {row.subcategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        {row.city} / {row.state}
                      </div>
                      {row.neighborhood && (
                        <div className="text-[10px] text-slate-400">{row.neighborhood}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.whatsapp ? (
                        <div className="text-emerald-700 font-semibold">{row.whatsapp}</div>
                      ) : row.phone ? (
                        <div>{row.phone}</div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {row.email && <div className="text-[10px] text-slate-400">{row.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {row.isFeatured ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          SIM
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">NÃO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsedRows.length > 50 && (
            <p className="text-xs text-slate-500 text-center py-2">
              Mostrando as primeiras 50 de {parsedRows.length} linhas. Todas as linhas serão
              importadas ao confirmar.
            </p>
          )}
        </div>
      )}

      {/* Dicas e Instruções */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-500" />
          <span>Orientações para preenchimento da planilha</span>
        </h4>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Formatos:</strong> envie <code>.xlsx</code> (Excel) ou <code>.csv</code>. No
            Excel, a primeira aba da planilha é a que será lida.
          </li>
          <li>
            <strong>Campos obrigatórios:</strong> Nome da empresa ou profissional. Se Cidade ou
            Estado não forem informados, serão preenchidos com os padrões (São Paulo/SP).
          </li>
          <li>
            <strong>Categorias e Subcategorias:</strong> Se a categoria ou subcategoria informada
            ainda não existir no catálogo, ela será{' '}
            <strong>criada e associada automaticamente</strong> durante a importação.
          </li>
          <li>
            <strong>Contatos:</strong> Preencha o WhatsApp com DDD para habilitar o botão de contato
            direto dos síndicos.
          </li>
          <li>
            <strong>Destaque:</strong> Utilize <code>SIM</code> ou <code>NAO</code> para indicar se
            a empresa deve aparecer na seção de prestadores em destaque.
          </li>
        </ul>
      </div>
    </div>
  );
}
