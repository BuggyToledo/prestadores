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
  const [envHint, setEnvHint] = useState<{ DATABASE_URL?: string; USE_REAL_PRISMA?: string } | null>(null);

  // Formulário de conexão (padrão DreamHost: mysql.seudominio.com)
  const [formData, setFormData] = useState({
    host: 'mysql.sindicone.com.br',
    port: '3306',
    user: 'prestadores',
    password: '',
    database: 'catalogo_servicos',
    databaseUrl: '',
    useRealPrisma: true,
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
          useRealPrisma: Boolean(data.useRealPrismaEnv ?? data.isRealPrismaActive),
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
      setEnvHint(null);

      const res = await authFetch('/api/admin/database/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar configuração.');
      }

      if (data.envPersisted === false) {
        setEnvHint(data.requiredEnvVars || null);
        setSuccessMsg(
          data.message ||
            'Na Vercel o .env não pode ser gravado. Configure as variáveis abaixo no painel da hospedagem e faça Redeploy.'
        );
      } else {
        setSuccessMsg(data.message || 'Configurações atualizadas com sucesso!');
      }
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

      {statusData?.warning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Configuração incompleta</p>
            <p className="text-xs leading-relaxed">{statusData.warning}</p>
          </div>
        </div>
      )}

      {(statusData?.serverless || envHint) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-slate-100 text-sm space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <p className="font-bold text-sm">Vercel / serverless — variáveis obrigatórias</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            O disco em <code className="text-amber-300">/var/task</code> é somente leitura (erro EROFS).
            Cadastre estas variáveis em <strong>Vercel → Project → Settings → Environment Variables</strong>,
            depois clique em <strong>Redeploy</strong>:
          </p>
          <div className="bg-black/40 rounded-xl p-3 font-mono text-[11px] space-y-2 overflow-x-auto">
            <div>
              <span className="text-slate-400">DATABASE_URL=</span>
              <span className="text-emerald-300">
                {envHint?.DATABASE_URL ||
                  `mysql://${formData.user}:SUA_SENHA@${formData.host}:${formData.port}/${formData.database}`}
              </span>
            </div>
            <div>
              <span className="text-slate-400">USE_REAL_PRISMA=</span>
              <span className="text-emerald-300">{envHint?.USE_REAL_PRISMA || 'true'}</span>
            </div>
            <div>
              <span className="text-slate-400">JWT_SECRET=</span>
              <span className="text-emerald-300">uma_chave_longa_e_aleatoria</span>
            </div>
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
                  ? statusData?.isRealPrismaActive
                    ? `Conexão ativa com ${statusData?.host}:${statusData?.port}. Cadastros e importações estão gravando no MySQL.`
                    : `MySQL responde em ${statusData?.host}:${statusData?.port}, mas USE_REAL_PRISMA está desligado — ative a opção abaixo e sincronize para gravar no banco.`
                  : 'Os prestadores, categorias e banners estão sendo salvos no disco local (data/database.json). Para conectar ao MySQL da hospedagem, siga as instruções de liberação abaixo.'}
              </p>
            </div>

            {/* Caixa explicativa DreamHost Allowable Hosts (Access denied) */}
            {!isConnected && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/90 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>DreamHost — Allowable Hosts (obrigatório)</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  A DreamHost vem com <code className="bg-slate-100 px-1 rounded">%.dreamhost.com</code> por
                  padrão — isso <strong>bloqueia a Vercel</strong>, mesmo com senha correta. O host recusado
                  agora foi:{' '}
                  <code className="bg-rose-50 text-rose-800 px-1 rounded text-[11px] break-all">
                    {detectedIp || 'ec2-....amazonaws.com'}
                  </code>
                </p>

                <ol className="text-xs text-slate-700 space-y-2.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Abra{' '}
                    <a
                      href="https://panel.dreamhost.com/index.cgi?tree=support.dashboard&amp;"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-800 font-bold underline underline-offset-2"
                    >
                      panel.dreamhost.com
                    </a>{' '}
                    → <strong>Databases → MySQL Databases</strong>.
                  </li>
                  <li>
                    Clique no <strong>nome do usuário</strong> (ex.: <code className="bg-slate-100 px-1 rounded">prestadores</code>),
                    não só no nome do banco.
                  </li>
                  <li>
                    No campo <strong>Allowable Hosts</strong>, cole exatamente estas 3 linhas (uma por linha):
                    <div className="mt-2 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl p-3 space-y-0.5">
                      <div>%.dreamhost.com</div>
                      <div>%.amazonaws.com</div>
                      <div>%</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy('%.dreamhost.com\n%.amazonaws.com\n%', 'wildcard')
                      }
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
                    >
                      {copiedWildcard ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWildcard ? 'Copiado!' : 'Copiar as 3 linhas'}</span>
                    </button>
                  </li>
                  <li>
                    Clique em <strong>Modify [usuário] now!</strong> e aguarde ~1 minuto.
                  </li>
                  <li>
                    Confirme o hostname MySQL (ex.: <code className="bg-slate-100 px-1 rounded">mysql.sindicone.com.br</code>)
                    na Vercel em <code className="bg-slate-100 px-1 rounded">DATABASE_URL</code> +{' '}
                    <code className="bg-slate-100 px-1 rounded">USE_REAL_PRISMA=true</code>, faça Redeploy e
                    clique em <strong>Testar Conexão</strong>.
                  </li>
                </ol>

                {detectedIp && (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-amber-100">
                    Host AWS recusado (opcional adicionar também):{' '}
                    <button
                      type="button"
                      onClick={() => handleCopy(detectedIp, 'ip')}
                      className="font-mono text-slate-800 underline cursor-pointer"
                    >
                      {detectedIp}
                    </button>
                    {copiedIp ? ' ✓' : ''}
                  </p>
                )}
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
                placeholder="mysql.seudominio.com (DreamHost)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                DreamHost: use o hostname MySQL do painel (ex. mysql.sindicone.com.br), não localhost.
              </p>
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
                  Com esta opção ativa, cadastros, edições e importações gravam direto no MySQL.
                  Se a conexão falhar, o sistema mostra o erro real (não salva &quot;de mentira&quot; no armazenamento local).
                  Após ativar, use &quot;Sincronizar Tudo para o MySQL&quot; para enviar categorias e dados locais.
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
                <span>
                  {statusData?.serverless ? 'Testar e Aplicar nesta Sessão' : 'Salvar Configurações'}
                </span>
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
