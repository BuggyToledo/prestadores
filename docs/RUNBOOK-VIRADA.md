# RUNBOOK DE VIRADA — Guia Síndico Né!

Passos numerados para um leigo. Faça **na ordem**. Não pule etapas.

> **Regra de ouro:** o código novo (PR #9) **só pode ir ao ar depois** das migrations aditivas no banco.  
> Se o código subir antes, o login pode quebrar.

---

## Respostas pré-merge (checklist)

### 1) Build/deploy altera o banco?

**Não.** Não existe `vercel.json`. O `package.json` define:

```text
"build": "prisma generate && next build"
```

Só gera o client Prisma e compila o Next. **Não** roda `prisma db push`, **não** roda `migrate deploy`, **não** há `postinstall` de migration.

- `npm run db:migrate` está **bloqueado** (exit 1) — só serve de lembrete.
- `npm run db:push` existe como atalho **manual local**; **nunca** é chamado pelo build/deploy.

Migrations = sempre manuais, no seu computador / painel MySQL.

### 2) Ordem dos PRs #8 e #9

| PR | Branch | Conteúdo |
|---|---|---|
| #8 | `cursor/fase-1-seguranca-ea94` | Só Fase 1A (segurança) |
| #9 | `cursor/fase-1b-dados-ea94` | **1A + 1B** (allowlist, alterar senha, clean-data, migrations) |

- Os commits do #8 (`39a92ec`, `9d433cd`) **estão dentro** do #9 (ancestrais da branch).
- **Ordem correta:** mergear **apenas o #9** na `main`.
- O #8 fica opcional — pode fechar como “incluído no #9”. Não precisa mergear #8 antes.

### 3) Runbook de virada

Segue nas seções **1 → 9** abaixo (backup → baseline → clean-data teste → migrations prod → deploy → rollback).

### 4) CSV de revisão: 41 linhas ≠ 550 registros

É o **resultado completo da amostra fixture**, não um recorte de ~550.

- Entrada: `data/amostra-providers.csv` → **10 prestadores** (p1…p10).
- Saída: `docs/samples/clean-data-review-amostra.csv` → **41 linhas de mudança** (vários campos por registro).
- O catálogo real (~6,7k) ou uma amostra de ~550 exige `--from-db` no banco `*_teste` ou um CSV maior.

**Regras que geram cada tipo de linha:**

| `acao_sugerida` / campo | Quando |
|---|---|
| `set_kind` | Nome/categoria casa com padrão de utilidade pública (senador, ouvidoria, prefeitura, vereador, etc.) → `kind=utilidade_publica` |
| `needs_review` (kind) | Ambíguo (ex.: prestador na categoria órgãos públicos) → marca `needsReview=true`, não força kind |
| `set_display_name` | Title Case no nome (siglas LTDA/ME/ADV/SOS; preposições “da/do/de”) |
| slug (`set_display_name`) | Slug recalculado a partir do novo displayName |
| `set_address` / `set_neighborhood` | Endereço/bairro detectados no texto do nome (padrão “RUA … - BAIRRO”) e campo vazio |
| `set_whatsapp_e164` / `set_phone_e164` | Telefone BR válido → formato `55…` E.164 |
| `needs_review` (telefone) | Telefone inválido (ex.: `123`) → sugerir limpar / revisar |
| `needs_review` (state) | Heurística cidade/UF (ex.: Brasília + RJ → sugerir DF) |
| `flag_duplicate` | Mesmo WhatsApp/telefone E.164 em 2+ IDs — **só marca**; merge é manual |

### 5) `/admin/alterar-senha` e `sessionVersion`

**Sim, depende das colunas novas.** A API faz `UPDATE` em `passwordHash` **e** `sessionVersion`, e tenta gravar `audit_logs`. Sem a migration aditiva de user/session, a tela do código novo **quebra**.

**Antes da virada** (banco antigo, sem essas colunas), troque a senha assim:

```bash
npx tsx scripts/hash-password.ts "SuaNovaSenhaForteAqui"
```

Depois no MySQL:

```sql
UPDATE users
SET passwordHash = 'COLE_O_HASH_AQUI'
WHERE email = 'admin@seuemail.com';
```

Isso **não** precisa de `sessionVersion`. Depois do deploy + migrations, use a tela normalmente.

---

## 0) O que NÃO acontece no deploy

O comando de build na Vercel é só:

```text
prisma generate && next build
```

Isso **gera o cliente Prisma** e **compila o site**.  
**Não** roda `db push`, **não** roda `migrate deploy`, **não** altera tabelas.

Migrations são **sempre manuais** (você no seu computador / painel MySQL).

---

## 1) Backup novo da produção

1. Entre no painel da DreamHost (ou no cliente MySQL que você usa).
2. Exporte um dump completo do banco de produção (todas as tabelas).
3. Salve o arquivo com data, por exemplo: `backup-prod-2026-04-02.sql`.
4. Guarde em local seguro (não no GitHub).

Se der errado depois, este arquivo é o seu “desfazer”.

---

## 2) Criar / preparar banco de TESTE (nome obrigatório)

1. Crie um banco **novo** cujo nome termina em `_teste` ou `_test`  
   Exemplo: `catalogo_servicos_teste`.
2. Restaure o backup da produção **dentro desse banco de teste**.
3. No seu computador, no arquivo `.env` do projeto, aponte:

```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:3306/catalogo_servicos_teste"
USE_REAL_PRISMA="true"
JWT_SECRET="sua_chave_com_pelo_menos_32_caracteres"
```

Se o nome do banco **não** terminar em `_teste`/`_test`, os scripts **recusam** rodar.

---

## 3) Baseline + migrations aditivas no banco de teste

No terminal, na pasta do projeto:

```bash
npm install
npx prisma generate
```

### 3a) Marcar o baseline (não recria tabelas)

O banco já tem as tabelas antigas. Por isso marcamos o baseline como “já aplicado”:

```bash
npx prisma migrate resolve --applied 20251002120000_baseline
```

### 3b) Aplicar só as migrations aditivas (colunas novas)

```bash
npx prisma migrate deploy
```

Isso adiciona, entre outras:

- em `providers`: `kind`, `trustTier`, `displayName`, `needsReview`, etc.
- em `users`: `sessionVersion`
- tabela `audit_logs`

**Não apaga** prestadores.

Confira no MySQL se as colunas existem antes de seguir.

---

## 4) (Opcional agora) Trocar senha do admin **antes** da virada

Se ainda estiver no banco **sem** a coluna `sessionVersion` (produção antiga), **não use** a tela `/admin/alterar-senha` do código novo.

Use o script de hash (veja seção 8 abaixo) e um `UPDATE` manual no MySQL.

Depois que as colunas existirem (no teste ou na produção pós-migration), use a tela **Alterar Senha** no admin.

---

## 5) Rodar clean-data no banco de TESTE

### 5a) Gerar relatório (não altera nada)

```bash
npm run clean-data -- --from-db
```

Abre `reports/clean-data-review.csv` no Excel.

### 5b) Revisar

Na coluna `aprovado`, escreva `SIM` só nas linhas que você quer aplicar.  
Salve o CSV.

### 5c) Aplicar só o aprovado (escreve no banco de TESTE)

```bash
npm run clean-data -- --apply --from-review reports/clean-data-review.csv
```

Confira no site local / consultas SQL se os dados ficaram corretos.

---

## 6) Aplicar as mesmas migrations na PRODUÇÃO (ainda sem trocar o site)

Com um `.env` temporário apontando para produção **só para este passo**  
(ou rode os SQL das pastas `prisma/migrations/20251002121000_*` e `20251002122000_*` no painel MySQL):

1. Backup de novo (passo 1) se passou tempo.
2. No banco de **produção**:
   ```bash
   npx prisma migrate resolve --applied 20251002120000_baseline
   npx prisma migrate deploy
   ```
3. Confirme colunas novas.
4. **Tire** a `DATABASE_URL` de produção do seu `.env` local em seguida  
   (volte a apontar para `*_teste`).

> Os scripts `clean-data --apply` **não** devem apontar para produção  
> (nome do banco de produção normalmente **não** termina em `_teste`).

A limpeza de dados em massa fica no teste; a promoção dos dados limpos para produção  
é um passo seu (dump do teste → restore seletivo, ou reaplicar o CSV aprovado  
num fluxo controlado). Se preferir só schema na produção e limpar depois,  
pode pular o apply de dados na produção nesta virada.

---

## 7) Deploy do código + troca da DATABASE_URL

Ordem correta:

1. **Já ter** migrations aplicadas no banco que a Vercel vai usar.
2. Na Vercel → Environment Variables:
   - `DATABASE_URL` = banco desejado (produção já migrada)
   - `USE_REAL_PRISMA=true`
   - `JWT_SECRET` forte (≥32)
3. Faça o **Deploy** do branch/PR (merge do #9 na main, ou deploy do branch).
4. Abra o site, teste login admin e uma página pública.
5. Troque a senha do admin em `/admin/alterar-senha`.

---

## 8) Trocar senha ANTES da virada (sem colunas novas)

No computador, com o projeto:

```bash
npx tsx scripts/hash-password.ts "SuaNovaSenhaForteAqui"
```

O script imprime um hash bcrypt. No MySQL (produção ou teste):

```sql
UPDATE users
SET passwordHash = 'COLE_O_HASH_AQUI'
WHERE email = 'admin@seuemail.com';
```

Isso **não** precisa de `sessionVersion`.  
Funciona no banco antigo.

---

## 9) Como voltar atrás em ~1 minuto

### Se o problema foi o **código** (site quebrado)

1. Na Vercel → Deployments → abra o deploy **anterior** (que estava ok).
2. Clique em **Promote to Production** / Redeploy desse deploy.
3. Em menos de 1 minuto o site volta ao código antigo.

> Se você já aplicou migrations aditivas, o código antigo normalmente **ainda funciona**  
> (colunas novas sobram no banco; o app antigo as ignora).

### Se o problema foi **dado / migration**

1. Pare o tráfego se necessário (Vercel: redeploy do código antigo).
2. Restaure o dump do passo 1 no banco:
   ```bash
   # exemplo genérico — use o cliente que você já usa na DreamHost
   mysql -h HOST -u USER -p NOME_DO_BANCO < backup-prod-AAAA-MM-DD.sql
   ```
3. Confirme login e listagem de prestadores.

### Se só a senha ficou errada

Refaça o passo 8 com uma senha que você controle.

---

## Ordem resumida (checklist)

1. Backup produção  
2. Banco `*_teste` restaurado do backup  
3. `migrate resolve --applied baseline` + `migrate deploy` no **teste**  
4. `clean-data` dry-run → revisar CSV → `--apply` no **teste**  
5. `migrate resolve` + `migrate deploy` na **produção** (só schema)  
6. Deploy do código (Vercel) com `DATABASE_URL` já migrada  
7. Alterar senha no `/admin/alterar-senha`  
8. Se falhar: Promote deploy anterior (+ restore do backup se for dado)

---

## Ordem dos PRs

| PR | Conteúdo | Merge? |
|---|---|---|
| #8 | Só segurança (1A) | Opcional — **já está dentro do #9** |
| #9 | 1A + allowlist + alterar senha + clean-data + migrations | **Este é o PR a mergear** |

Ordem recomendada: **mergear apenas o #9** na `main`.  
O #8 pode ser fechado como “incluído no #9”.
