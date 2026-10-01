'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Upload,
  HardDrive,
  Cpu,
  Layers,
  Users,
  FolderTree,
  Image as ImageIcon,
  Key,
  Globe,
  ExternalLink,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

export default function AdminDatabasePage() {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedWildcard, setCopiedWildcard] = useState(false);

  const [statusData, setStatusData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulário de conexão
  const [formData, setFormData] = useState({
    host: 'mysql.sindicone.com.br',
    port: '3306',
    user: 'prestadores',
    password: '',
    database: 'catalogo_servicos',
    databaseUrl: '',
    useRealPrisma: false,
  });

  const loadStatus = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await authFetch('/api/admin/database/status');
      const data = await res.json();

      if (res.ok) {
        setStatusData(data);
        setFormData((prev) => ({
          ...prev,
          host: data.host || prev.host,
          port: String(data.port || prev.port),
          user: data.user || prev.user,
          database: data.database || prev.database,
          useRealPrisma: data.isRealPrismaActive || false,
        }));
      } else {
        setErrorMsg(data.error || 'Erro ao consultar status do banco.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro de comunicação ao carregar status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await authFetch('/api/admin/database/status');
      const data = await res.json();
      setStatusData(data);

      if (data.connection?.success) {
        setSuccessMsg(
          `Conexão bem-sucedida! MySQL versão ${data.connection.version} conectado ao banco "${data.connection.database}".`
        );
      } else {
        setErrorMsg(
          data.connection?.error ||
            'Não foi possível conectar ao MySQL. Verifique as credenciais ou as permissões de acesso remoto.'
        );
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Falha ao testar conexão.');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await authFetch('/api/admin/database/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar configuração.');
      }

      setSuccessMsg(data.message || 'Configurações atualizadas com sucesso!');
      loadStatus();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncToMySql = async () => {
    if (
      !confirm(
        'Deseja sincronizar todos os prestadores, categorias, subcategorias e banners para o MySQL agora?'
      )
    ) {
      return;
    }

    try {
      setSyncing(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await authFetch('/api/admin/database/sync', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao sincronizar com o MySQL.');
      }

      setSuccessMsg(
        `Sincronização concluída com sucesso! ${data.stats?.providersSynced || 0} prestadores, ${data.stats?.categoriesSynced || 0} categorias e ${data.stats?.subcategoriesSynced || 0} subcategorias gravados no MySQL.`
      );
      loadStatus();
    } catch (e: any) {
      setErrorMsg(e.message || 'Falha ao sincronizar dados com o MySQL.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = (text: string, type: 'ip' | 'wildcard') => {
    navigator.clipboard.writeText(text);
    if (type === 'ip') {
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2500);
    } else {
      setCopiedWildcard(true);
      setTimeout(() => setCopiedWildcard(false), 2500);
    }
  };

  const isConnected = statusData?.connection?.success;
  const detectedIp = statusData?.connection?.clientIp;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
            Infraestrutura & Persistência
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 flex items-center gap-2.5">
            <Database className="w-7 h-7 text-amber-500" />
            <span>Configurações do Banco de Dados MySQL</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie a conexão direta com o MySQL da hospedagem, teste o acesso remoto e sincronize dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-600 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testando...' : 'Testar Conexão'}</span>
          </button>
        </div>
      </div>

      {/* Alertas de Retorno */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Atenção na Conexão:</p>
            <p className="text-xs font-mono">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Card de Status da Conexão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status do MySQL */}
        <div
          className={`p-6 rounded-3xl border shadow-xs lg:col-span-2 flex flex-col justify-between ${
            isConnected
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Diagnóstico em Tempo Real
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                  isConnected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {isConnected ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>MySQL Conectado</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Armazenamento Local Persistente</span>
                  </>
                )}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                {isConnected
                  ? 'Banco de Dados MySQL Operacional'
                  : 'MySQL Remoto Aguardando Liberação de Acesso'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {isConnected
                  ? `Conexão ativa com ${statusData?.host}:${statusData?.port}. O sistema está pronto para leitura e gravação no banco de dados.`
                  : 'Os prestadores, categorias e banners estão sendo salvos e persistidos com segurança no disco local (data/database.json). Para conectar diretamente ao servidor MySQL da hospedagem, siga as instruções de liberação abaixo.'}
              </p>
            </div>

            {/* Caixa explicativa para liberação do cPanel */}
            {!isConnected && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/90 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Como liberar o acesso no cPanel da Sindícone:</span>
                </div>

                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Acesse o <strong>cPanel</strong> do seu domínio (<code>sindicone.com.br/cpanel</code>).
                  </li>
                  <li>
                    Procure e clique na opção <strong>&ldquo;MySQL Remoto&rdquo;</strong> (ou <em>Remote Database Access</em>).
                  </li>
                  <li>
                    No campo <strong>Adicionar Host de Acesso</strong>, adicione o curinga para autorizar conexões na nuvem:
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border border-slate-200">
                        %
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy('%', 'wildcard')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-xs transition-colors"
                      >
                        {copiedWildcard ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWildcard ? 'Copiado!' : 'Copiar %'}</span>
                      </button>
                    </div>
                  </li>
                  {detectedIp && (
                    <li className="pt-1">
                      Ou adicione o IP específico detectado nesta máquina:{' '}
                      <div className="mt-1 flex items-center gap-2">
                        <code className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded font-mono font-bold text-xs border border-slate-200">
                          {detectedIp}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(detectedIp, 'ip')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] cursor-pointer"
                        >
                          {copiedIp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIp ? 'Copiado' : 'Copiar IP'}</span>
                        </button>
                      </div>
                    </li>
                  )}
                  <li>
                    Clique em <strong>&ldquo;Adicionar Host&rdquo;</strong> e depois volte aqui e clique no botão <strong>&ldquo;Testar Conexão&rdquo;</strong>.
                  </li>
                </ol>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200/60 mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <strong>Host Atual:</strong> {statusData?.host || 'localhost'} | <strong>Banco:</strong>{' '}
              {statusData?.database || 'catalogo_servicos'}
            </div>
            {statusData?.connection?.version && (
              <div>
                <strong>Versão MySQL:</strong> {statusData.connection.version}
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas dos Dados */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registros no Sistema
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">Dados Armazenados</h3>
            <p className="text-xs text-slate-500">
              Tudo o que você cadastrar ou importar está preservado no sistema.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Prestadores Cadastrados</span>
              </span>
              <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {statusData?.localStats?.providersCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-amber-600" />
                <span>Categorias de Serviços</span>
              </span>
              <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {statusData?.localStats?.categoriesCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Subcategorias</span>
              </span>
              <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {statusData?.localStats?.subcategoriesCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Banners de Anúncios</span>
              </span>
              <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {statusData?.localStats?.bannersCount || 0}
              </span>
            </div>
          </div>

          {/* Botão de Exportação SQL */}
          <div className="pt-2">
            <a
              href="/api/admin/database/export-sql"
              download="catalogo_servicos_backup.sql"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Baixar Script SQL (.sql)</span>
            </a>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Gera arquivo pronto para importar direto no phpMyAdmin
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Configuração do MySQL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Parâmetros de Conexão MySQL</h2>
            <p className="text-xs text-slate-500">
              Altere ou teste os dados de conexão do servidor da sua hospedagem.
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-lg text-slate-600 border border-slate-200">
            Porta Padrão: 3306
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Host / Servidor MySQL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="mysql.sindicone.com.br ou localhost"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Porta
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="3306"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nome do Banco de Dados <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                placeholder="catalogo_servicos"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Usuário do MySQL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                placeholder="prestadores"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Senha do Banco de Dados
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Digite para alterar a senha atual do MySQL"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono font-medium"
              />
            </div>
          </div>

          {/* Opção USE_REAL_PRISMA */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.useRealPrisma}
                onChange={(e) => setFormData({ ...formData, useRealPrisma: e.target.checked })}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 mt-0.5 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Ativar Conexão Direta ao MySQL (USE_REAL_PRISMA)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Ao ativar, o sistema se conecta e grava diretamente no MySQL. Caso ocorra qualquer falha no servidor, o sistema continuará operando com segurança no armazenamento local sem travar o site.
                </span>
              </div>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncToMySql}
                disabled={syncing || testing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                ) : (
                  <Upload className="w-4 h-4 text-amber-700" />
                )}
                <span>{syncing ? 'Sincronizando...' : 'Sincronizar Tudo para o MySQL'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Salvar Configurações</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cartão de Dicas e Perguntas Frequentes */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <HelpCircle className="w-5 h-5" />
          <span>Perguntas Frequentes sobre a Conexão MySQL</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              1. Meus dados cadastrados ou importados foram perdidos?
            </h4>
            <p>
              Não! Todos os prestadores, categorias e subcategorias que você cadastrou ou importou estão armazenados de forma persistente em arquivo no servidor (<code>data/database.json</code>). Assim que o MySQL for liberado, você pode clicar em &ldquo;Sincronizar Tudo para o MySQL&rdquo; para gravá-los no banco com 1 clique.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">
              2. Como importar diretamente no phpMyAdmin sem precisar de acesso remoto?
            </h4>
            <p>
              Basta clicar no botão preto <strong>&ldquo;Baixar Script SQL (.sql)&rdquo;</strong> acima. Em seguida, acesse o phpMyAdmin da sua hospedagem, selecione o banco <code>catalogo_servicos</code> e clique na aba <strong>Importar</strong>. Todas as tabelas e dados serão criados instantaneamente!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
