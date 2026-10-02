# RUNBOOK DE VIRADA — Guia Síndico Né!

Passos numerados para um leigo. Faça **na ordem**. Não pule etapas.

> **Desenho aprovado:** o banco de **produção atual não recebe migration**. Ele fica **intacto** como rollback.  
> O site novo usa um **banco novo** (ex.: `prestadores_v2`) importado do `*_teste` já migrado e limpo.

> **Merge:** mergear **apenas o PR #9** na `main` (o #8 já está incluído). **Não faça merge** até concluir os passos de banco e variáveis abaixo.

---

## Princípios

| Regra | Detalhe |
|---|---|
| Produção antiga | **Nunca** `migrate deploy` / `db push` no banco que o site usa hoje |
| Scripts que **escrevem** (`clean-data --apply`, sync admin) | Só em banco cujo **nome** termina em `_teste` ou `_test` |
| Banco novo de produção | Nome **sem** `_teste` / `_test` (ex.: `prestadores_v2`) — scripts **recusam** escrever nele de propósito |
| Deploy Vercel | `build` = `prisma generate && next build` — **não** altera banco |
| Rollback rápido | Promote deploy anterior + `DATABASE_URL` antiga — **sem** restore de dump |

---

## 0) O que NÃO acontece no deploy

```text
"build": "prisma generate && next build"
```

Sem `vercel.json`. `npm run db:migrate` está bloqueado (exit 1). Migrations e limpeza são **sempre manuais**.

---

## 1) Backup novo da produção (banco atual)

1. Exporte dump **completo** do banco que a produção usa **hoje** (DreamHost / phpMyAdmin / `mysqldump`).
2. Nomeie com data: `backup-prod-AAAA-MM-DD.sql`.
3. Guarde fora do GitHub.

Este backup é histórico e referência para o delta (passo 10). **Não** é o rollback de 1 minuto — o rollback é trocar URL + deploy (passo 12).

---

## 2) Restaurar no banco de TESTE (`*_teste`)

1. Crie ou use um banco cujo nome **termina** em `_teste` ou `_test`  
   Ex.: `catalogo_servicos_teste`.
2. Importe o dump do passo 1 **nesse** banco.
3. No `.env` local:

```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:3306/catalogo_servicos_teste"
USE_REAL_PRISMA="true"
JWT_SECRET="chave_aleatoria_com_pelo_menos_32_caracteres"
```

4. Anote a contagem de prestadores (para conferência depois):

```sql
SELECT COUNT(*) AS total FROM providers;
```

---

## 3) Migrations só no `*_teste`

Na pasta do projeto:

```bash
npm install
npx prisma generate
npx prisma migrate resolve --applied 20251002120000_baseline
npx prisma migrate deploy
```

Isso adiciona colunas/tabelas novas **sem apagar** prestadores.  
**Não repita** estes comandos no banco de produção **antigo**.

Confira no MySQL: `sessionVersion` em `users`, `kind` / `displayName` em `providers`, tabela `audit_logs`.

---

## 4) clean-data: dry-run → revisão → apply (só no `*_teste`)

```bash
npm run clean-data -- --from-db
```

1. Abra `reports/clean-data-review.csv`.
2. Coluna `aprovado`: escreva **`SIM`** só nas linhas autorizadas.
3. Aplique **somente** no teste:

```bash
npm run clean-data -- --apply --from-review reports/clean-data-review.csv
```

Se o nome do banco **não** terminar em `_teste`/`_test`, o script **aborta** (proteção contra escrita em produção).

Guia detalhado: `docs/GUIA-CLEAN-DATA.md`.

---

## 5) Exportar o `*_teste` limpo

Exporte **apenas dados + schema** do banco de teste **já migrado e limpo**.

**Incluir:** tabelas e dados.  
**Excluir / evitar no arquivo:**

- `DROP DATABASE`
- `CREATE DATABASE`
- `USE outro_banco`

### Opção A — phpMyAdmin

Exportar o banco `*_teste` → formato SQL → marque opções que **não** dropem/criem database (export “personalizado” sem CREATE DATABASE).

### Opção B — mysqldump (exemplo)

```bash
mysqldump -h HOST -u USER -p \
  --single-transaction \
  --no-create-db \
  catalogo_servicos_teste > export-teste-limpo.sql
```

Revise o início do arquivo: não deve conter `CREATE DATABASE` nem `USE` indesejado.

---

## 6) Importar em banco NOVO de produção (`prestadores_v2`)

1. Crie um banco **novo** no MySQL, **sem** sufixo `_teste` / `_test`  
   Ex.: `prestadores_v2`.
2. Importe `export-teste-limpo.sql` **nesse** banco.
3. Confira contagens (devem bater com o teste pós-limpeza):

```sql
SELECT COUNT(*) FROM providers;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM users;
```

4. Opcional: registre na tabela `_prisma_migrations` (já vem no dump se o export incluiu). O app **não** roda migrate no deploy.

> O banco de produção **antigo** permanece **sem alteração** — é o fallback de dados se precisar reverter a URL.

---

## 7) Variáveis de ambiente (Vercel) — ordem

Configure **antes** do merge do #9. Detalhes: `docs/VARIAVEIS-AMBIENTE.md`.

### Ordem recomendada

1. **`JWT_SECRET`** (Production) — mesma chave forte (≥32 chars) que você usará depois; se mudar, todos os logins caem.
2. **`USE_REAL_PRISMA`** = `true` (Production e Preview).
3. **`DATABASE_URL`**:
   - **Production:** aponte para o banco **novo** (`prestadores_v2`) **antes** do merge.
   - **Preview (PR #9):** aponte para o `*_teste` **já migrado** (mesmo host/usuário, nome terminando em `_teste`).
4. **`NEXT_PUBLIC_APP_URL`** — URL pública (Production = domínio final; Preview pode ser a URL do preview da Vercel).
5. **`PRODUCTION_DATABASE_HOSTS`** (opcional) — denylist extra; padrão inclui `mysql.sindicone.com.br`.
6. **`ADMIN_*`** — **não** são obrigatórias em runtime na Vercel (só para `npm run db:seed` local).

### Preview do PR #9

O deploy de preview **precisa** de:

- `DATABASE_URL` → banco `*_teste` com baseline + migrations já aplicadas (passos 2–3).
- `USE_REAL_PRISMA=true`
- `JWT_SECRET` (≥32) — pode ser uma chave só de preview, diferente da Production.

Sem isso, o preview cai em mock ou falha auth/middleware.

**Production** no dia da virada: `DATABASE_URL` → `prestadores_v2` (nunca `*_teste`).

---

## 8) Congelar admin e janela de cadastros (delta)

Entre o **backup (passo 1)** e o **site apontando para `prestadores_v2`**, qualquer cadastro/edição na produção **antiga** **não** entra no banco novo.

| Estratégia | O que fazer |
|---|---|
| **Congelar (recomendado)** | Avisar equipe; parar de usar `/admin` na produção antiga desde o backup até a virada; só testar no preview/`_*teste`. |
| **Reaplicar delta** | Se alguém editou a produção antiga depois do backup: exportar só linhas novas/alteradas (por `updatedAt` ou diff) e importar manualmente em `prestadores_v2`, **ou** refazer backup → restore no `_*teste` → migrations → clean-data → export (trabalhoso). |

Anote **data/hora do backup** e comunique: “cadastros após HH:MM não vão para v2 até reaplicar delta”.

---

## 9) Virada: merge e verificação

**Ordem obrigatória:**

1. Banco `prestadores_v2` importado e contagem conferida (passo 6).
2. Vercel **Production** → `DATABASE_URL` = `prestadores_v2` + demais vars (passo 7).
3. **Merge do PR #9** na `main` (deploy automático).
4. Checklist pós-virada (passo 10).
5. Troque a senha em `/admin/alterar-senha` (banco novo já tem `sessionVersion`).

**Antes da virada** no banco **antigo** (sem `sessionVersion`), use `scripts/hash-password.ts` + `UPDATE users SET passwordHash=...` — ver `docs/GUIA-CLEAN-DATA.md` parte E / runbook antigo § senha.

---

## 10) Checklist pós-virada

Marque cada item na Production após o deploy:

- [ ] **Contagem de prestadores** — igual (ou explicável) vs. contagem anotada no passo 2/6
- [ ] **Login admin** — `/admin/login` com credencial conhecida
- [ ] **Alterar senha** — `/admin/alterar-senha` salva e invalida sessão antiga
- [ ] **`/admin` protegido** — aba anônima em `/admin` redireciona para login
- [ ] **Página de categoria** — abrir uma categoria pública e listar prestadores
- [ ] **Busca** — termo conhecido retorna resultados
- [ ] **WhatsApp** — link `wa.me` / botão abre número E.164 correto em um prestador amostra
- [ ] **Banners** — home exibe banners de publicidade em largura esperada

Se algo falhar → passo 11 (rollback).

---

## 11) Rollback em ~1 minuto (sem restore de dump)

1. Vercel → **Deployments** → deploy **anterior** (código pré-#9) → **Promote to Production**.
2. Vercel → **Environment Variables** → **Production** → `DATABASE_URL` = banco **antigo** (o que existia antes da virada).
3. Redeploy se a Vercel pedir para aplicar env.
4. Teste login e home.

O banco antigo **nunca foi migrado**, então o código antigo continua compatível.  
O banco `prestadores_v2` pode ficar parado para análise; não é necessário importar backup.

---

## 12) Ordem resumida (checklist)

1. Backup produção **atual** (intacto para rollback de URL)  
2. Restore em `*_teste`  
3. `migrate resolve` (baseline) + `migrate deploy` **só no teste**  
4. `clean-data` dry-run → revisão → `--apply` **só no teste**  
5. Export teste limpo (sem DROP/CREATE DATABASE)  
6. Import em **`prestadores_v2`** (ou nome sem `_teste`)  
7. Conferir contagens  
8. Vercel: Production `DATABASE_URL` → v2; Preview → `*_teste` migrado  
9. Congelar admin ou planejar delta  
10. **Merge #9** → checklist pós-virada  
11. Rollback se preciso: promote deploy anterior + `DATABASE_URL` antiga  

---

## Referências

| Tópico | Arquivo |
|---|---|
| Limpeza de dados | `docs/GUIA-CLEAN-DATA.md` |
| Variáveis Vercel | `docs/VARIAVEIS-AMBIENTE.md` |
| CSV amostra (10 prestadores → 41 linhas) | `docs/samples/clean-data-review-amostra.csv` |
| PRs | Merge **só #9**; #8 incluído |

---

## FAQ técnico (pré-merge)

**Build altera banco?** Não — só `prisma generate && next build`.

**Por que produção nova não pode terminar em `_teste`?**  
Para nunca confundir com alvo de scripts destrutivos; a allowlist **exige** sufixo de teste para **escrita** via scripts/sync.

**Preview PR #9?**  
`DATABASE_URL` = mesmo servidor, banco `*_teste` já no passo 3.
