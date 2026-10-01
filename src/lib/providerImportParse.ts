export interface ParsedProvider {
  name: string;
  category: string;
  subcategory?: string;
  city: string;
  state: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  zipCode?: string;
  cnpj?: string;
  website?: string;
  instagram?: string;
  description?: string;
  services?: string;
  isFeatured?: boolean;
}

export const PROVIDER_IMPORT_HEADERS = [
  'Nome',
  'Categoria',
  'Subcategoria',
  'Cidade',
  'Estado',
  'Telefone',
  'WhatsApp',
  'Email',
  'Endereco',
  'Bairro',
  'CEP',
  'CNPJ',
  'Site',
  'Instagram',
  'Descricao',
  'Servicos',
  'Destaque',
] as const;

export const PROVIDER_IMPORT_SAMPLE_ROWS: string[][] = [
  [
    'Apex Engenharia Predial',
    'Manutenção Predial e Instalações',
    '',
    'São Paulo',
    'SP',
    '(11) 3214-5500',
    '(11) 98765-4321',
    'contato@apexpredial.com.br',
    'Av. Paulista, 1000',
    'Bela Vista',
    '01310-100',
    '12.345.678/0001-90',
    'https://apexpredial.com.br',
    '@apexpredial',
    'Especializada em reformas de fachadas, impermeabilização e manutenção condominial.',
    'Impermeabilização, Restauração de Fachadas, Pintura Externa',
    'SIM',
  ],
  [
    'Volts Engenharia Elétrica',
    'Manutenção Predial e Instalações',
    '',
    'Rio de Janeiro',
    'RJ',
    '(21) 2555-8900',
    '(21) 99887-1122',
    'atendimento@voltseng.com.br',
    'Rua Barata Ribeiro, 450',
    'Copacabana',
    '22040-001',
    '98.765.432/0001-10',
    '',
    '@volts.eletrica',
    'Laudos elétricos para condomínios, adequação de PC, SPDA e termografia.',
    'Laudo Elétrico, SPDA, Pára-raios, Adequação de PC',
    'SIM',
  ],
  [
    'SegurTech Portaria e CFTV',
    'Segurança e Prevenção de Incêndio',
    '',
    'Belo Horizonte',
    'MG',
    '(31) 3456-7890',
    '(31) 98877-6655',
    'comercial@segurtech.com.br',
    'Av. do Contorno, 5000',
    'Funcionários',
    '30110-028',
    '45.678.901/0001-23',
    'https://segurtech.com.br',
    '@segurtech',
    'Instalação e manutenção de portaria eletrônica, interfonia e câmeras de monitoramento.',
    'Controle de Acesso, Câmeras IP, Interfonia Condominial',
    'SIM',
  ],
  [
    'CleanMaster Higienização',
    'Limpeza, Conservação e Controle de Pragas',
    '',
    'Curitiba',
    'PR',
    '(41) 3012-3344',
    '(41) 99123-4567',
    'contato@cleanmaster.com',
    'Rua XV de Novembro, 1200',
    'Centro',
    '80060-000',
    '',
    '',
    '@cleanmaster',
    'Limpeza predial e higienização de áreas comuns.',
    'Limpeza Predial, Higienização, Conservação',
    'NAO',
  ],
];

function normalizeHeader(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function cellValue(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  const raw = row[index];
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}

function parseFeatured(value: string): boolean {
  const val = value.toLowerCase().trim();
  return val === 'sim' || val === 'true' || val === '1' || val === 's' || val === 'yes';
}

/**
 * Converte uma matriz (cabeçalho + linhas) em prestadores para importação.
 * Aceita saída de CSV ou da primeira planilha de um XLSX.
 */
export function parseProviderMatrix(matrix: unknown[][]): ParsedProvider[] {
  if (!matrix || matrix.length < 2) {
    throw new Error('O arquivo precisa ter pelo menos o cabeçalho e 1 linha com dados.');
  }

  const headerRow = (matrix[0] || []).map((h) => normalizeHeader(String(h ?? '')));
  const findIndex = (aliases: string[]) =>
    headerRow.findIndex((h) => aliases.some((a) => h.includes(a)));

  const idxName = findIndex(['nome', 'prestador', 'empresa', 'profissional', 'razao']);
  const idxCategory = findIndex(['categoria', 'segmento', 'ramo', 'servico principal']);
  const idxSubcategory = findIndex([
    'subcategoria',
    'sub-categoria',
    'sub categoria',
    'especialidade',
  ]);
  const idxCity = findIndex(['cidade', 'municipio']);
  const idxState = findIndex(['estado', 'uf']);
  const idxPhone = findIndex(['telefone', 'fone', 'tel']);
  const idxWhatsapp = findIndex(['whatsapp', 'whats', 'celular', 'cel']);
  const idxEmail = findIndex(['email', 'e-mail']);
  const idxAddress = findIndex(['endereco', 'logradouro', 'rua']);
  const idxNeighborhood = findIndex(['bairro']);
  const idxZipCode = findIndex(['cep']);
  const idxCnpj = findIndex(['cnpj', 'cpf']);
  const idxWebsite = findIndex(['site', 'website', 'url', 'pagina']);
  const idxInstagram = findIndex(['instagram', 'insta', 'rede']);
  const idxDescription = findIndex(['descricao', 'sobre', 'apresentacao']);
  const idxServices = findIndex(['servicos', 'especialidades', 'atuacao']);
  const idxFeatured = findIndex(['destaque', 'destacado', 'vip', 'premium']);

  if (idxName === -1) {
    throw new Error('Não foi possível identificar a coluna de "Nome" no cabeçalho do arquivo.');
  }

  const parsed: ParsedProvider[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const row = (matrix[i] || []) as unknown[];
    if (!row.length || row.every((c) => String(c ?? '').trim() === '')) continue;

    const name = cellValue(row, idxName);
    if (!name) continue;

    parsed.push({
      name,
      category: idxCategory !== -1 ? cellValue(row, idxCategory) || 'Geral' : 'Geral',
      subcategory: idxSubcategory !== -1 ? cellValue(row, idxSubcategory) : '',
      city: idxCity !== -1 ? cellValue(row, idxCity) || 'São Paulo' : 'São Paulo',
      state: idxState !== -1 ? cellValue(row, idxState) || 'SP' : 'SP',
      phone: idxPhone !== -1 ? cellValue(row, idxPhone) : '',
      whatsapp: idxWhatsapp !== -1 ? cellValue(row, idxWhatsapp) : '',
      email: idxEmail !== -1 ? cellValue(row, idxEmail) : '',
      address: idxAddress !== -1 ? cellValue(row, idxAddress) : '',
      neighborhood: idxNeighborhood !== -1 ? cellValue(row, idxNeighborhood) : '',
      zipCode: idxZipCode !== -1 ? cellValue(row, idxZipCode) : '',
      cnpj: idxCnpj !== -1 ? cellValue(row, idxCnpj) : '',
      website: idxWebsite !== -1 ? cellValue(row, idxWebsite) : '',
      instagram: idxInstagram !== -1 ? cellValue(row, idxInstagram) : '',
      description: idxDescription !== -1 ? cellValue(row, idxDescription) : '',
      services: idxServices !== -1 ? cellValue(row, idxServices) : '',
      isFeatured: idxFeatured !== -1 ? parseFeatured(cellValue(row, idxFeatured)) : false,
    });
  }

  if (parsed.length === 0) {
    throw new Error('Nenhum registro com nome preenchido foi encontrado no arquivo.');
  }

  return parsed;
}

export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export function csvTextToMatrix(text: string): unknown[][] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('O arquivo precisa ter pelo menos o cabeçalho e 1 linha com dados.');
  }

  const firstLine = lines[0];
  const countSemicolon = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  let delimiter = ';';
  if (countComma > countSemicolon && countComma > countTab) {
    delimiter = ',';
  } else if (countTab > countSemicolon && countTab > countComma) {
    delimiter = '\t';
  }

  return lines.map((line) => parseCSVLine(line, delimiter));
}

export function buildSampleCsvContent(): string {
  const header = PROVIDER_IMPORT_HEADERS.join(';');
  const rows = PROVIDER_IMPORT_SAMPLE_ROWS.map((row) =>
    row.map((cell) => {
      const value = String(cell ?? '');
      if (value.includes(';') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(';')
  );
  return `\uFEFF${header}\n${rows.join('\n')}\n`;
}
