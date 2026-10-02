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

## Compatibilidade: código antigo × schema novo

### Colunas/tabelas das migrations aditivas

Todas são **NULL** ou têm **DEFAULT** — nenhuma exige valor na INSERT do app antigo:

| Objeto | Tipo | NULL / DEFAULT |
|---|---|---|
| `providers.kind` | VARCHAR(32) | `NOT NULL DEFAULT 'prestador'` |
| `providers.trustTier` | VARCHAR(32) | `NOT NULL DEFAULT 'cadastrado'` |
| `providers.displayName` | VARCHAR(191) | **NULL** |
| `providers.serves24h` | BOOLEAN | `NOT NULL DEFAULT false` |
| `providers.issuesNfe` | BOOLEAN | `NOT NULL DEFAULT false` |
| `providers.acceptsInvoicingTerms` | BOOLEAN | `NOT NULL DEFAULT false` |
| `providers.needsReview` | BOOLEAN | `NOT NULL DEFAULT false` |
| `providers.reviewNotes` | TEXT | **NULL** |
| `users.sessionVersion` | INT | `NOT NULL DEFAULT 0` |
| tabela `audit_logs` | nova | só usada pelo código **novo**; app antigo **ignora** |

**Conclusão:** o código da `main` atual (antes do #9) **consegue ler e gravar** (cadastrar/editar prestadores, banners, login) num banco com schema novo (`prestadores_v2`). O Prisma antigo só lista colunas do schema antigo; o MySQL preenche DEFAULT nas colunas novas.  
**Nenhuma coluna impede** o app antigo. Banners não mudaram de schema.

> O rollback oficial aponta o código antigo para o banco **antigo** (não migrado).  
> Mesmo se alguém apontasse o código antigo para `prestadores_v2`, não há coluna bloqueante.

---

## Users no export e senha pós-virada

O dump do `*_teste` inclui a tabela **`users`** completa:

| Campo | Vai no export? |
|---|---|
| `id`, `name`, `email`, `passwordHash`, `role` | Sim |
| `sessionVersion` | Sim (DEFAULT 0 se nunca trocou senha no teste) |
| `createdAt`, `updatedAt` | Sim |

**Sim:** se você trocou a senha **no `*_teste`** (via `hash-password` + `UPDATE`, ou via `/admin/alterar-senha` no preview apontando para o teste) **antes** do export, o `passwordHash` novo vai para `prestadores_v2`.

### Validar na checagem pós-virada

1. Anote o e-mail do admin e a senha que você definiu no teste.
2. Após merge, em Production: logout → `/admin/login` com essa senha.
3. Se falhar: no MySQL de `prestadores_v2`:
   ```sql
   SELECT email, LEFT(passwordHash, 7) AS hash_prefix, sessionVersion
   FROM users WHERE role = 'ADMIN';
   ```
   - `hash_prefix` deve ser `$2a$10$` / `$2b$10$` (bcrypt).
   - Compare com o mesmo `SELECT` no `*_teste` — `passwordHash` deve ser **idêntico**.
4. Se o hash no v2 for o antigo: você trocou senha só na produção antiga (não exportada) — rode `hash-password` e `UPDATE` **direto em `prestadores_v2`** (SQL manual; não use `clean-data`).

---

## Manutenção futura do schema (após a virada)

A allowlist bloqueia **scripts de escrita da aplicação** (`clean-data --apply`, sync admin) em bancos **sem** `_teste`.  
**Não** bloqueia `npx prisma migrate deploy` — esse comando é CLI Prisma e você aponta a URL **manualmente**.

### Fluxo seguro (sempre)

1. **Ensaio no `*_teste`**
   - Aplique a nova migration:  
     `DATABASE_URL=.../*_teste` `npx prisma migrate deploy`
   - Rode testes / preview Vercel apontando para esse teste.
   - Se a migration for aditiva (NULL/DEFAULT), ok; se for destrutiva, **pare** e redesenhe.

2. **Aplicar no `prestadores_v2` (manual, fora do deploy)**
   - Em janela curta, no seu computador (nunca no build Vercel):
     ```bash
     # .env temporário SÓ para este comando — depois volte para *_teste
     export DATABASE_URL="mysql://.../prestadores_v2"
     npx prisma migrate deploy
     unset DATABASE_URL   # ou restaure .env do teste
     ```
   - Ou rode o SQL da pasta `prisma/migrations/<timestamp>_*/migration.sql` no phpMyAdmin de `prestadores_v2`.

3. **Só então** faça deploy do código que **depende** das colunas novas.

4. **Nunca** confie no `npm run build` da Vercel para migrar (ele só faz `prisma generate`).

Regra: **ensaio em `_teste` → migrate manual em `v2` → deploy de código**.  
`clean-data` e sync continuam **somente** em `*_teste`.

---

## Tempo da janela e ensaio (dry-run) antes do dia real

### Estimativa (ordem de grandeza)

| Fase | Tempo típico | Observação |
|---|---|---|
| Backup + restore em `*_teste` | 15–60 min | Depende do tamanho do dump (~6–7k prestadores + imagens base64 em banners) |
| `migrate resolve` + `migrate deploy` | 1–5 min | |
| clean-data dry-run + **revisão humana** do CSV | **horas a dias** | Fora da “janela de virada”; faça antes |
| `--apply` no teste | 5–30 min | |
| Export teste → import `prestadores_v2` + contagens | 20–60 min | |
| Env Vercel + merge + checklist | 15–30 min | |
| **Janela crítica** (congelar admin → v2 no ar) | **~45–90 min** | Se ensaio já feito; revisão de dados **já** concluída |

A janela que importa para “site congelado” é só do **export final / import v2 / env / merge** — não a revisão do CSV.

### Ensaio completo (obrigatório antes do dia real)

Use um **segundo** banco de teste e o **preview** do PR #9 — **sem** tocar Production.

1. Crie `catalogo_servicos_ensaio_teste` (sufixo `_teste`).
2. Restore do mesmo backup de produção.
3. `migrate resolve` + `migrate deploy`.
4. (Opcional) clean-data dry-run / apply parcial numa amostra.
5. Export limpo → importe em outro banco de ensaio **sem** sufixo, ex. `prestadores_v2_ensaio` (só para treinar o import; **não** é Production).
6. Vercel **Preview** do PR #9: `DATABASE_URL` = `catalogo_servicos_ensaio_teste` (ou o v2_ensaio se quiser simular Production — preferível preview no `*_teste` migrado).
7. Percorra o **checklist pós-virada** no URL de preview.
8. Simule rollback: mude mentalmente “Production URL → banco antigo”; no preview, troque env de volta e redeploy.
9. Cronometre passos 5–7 — esse número é a sua janela real.

Só após o ensaio ok, agende o dia da virada com Production → `prestadores_v2`.

---

## FAQ técnico (pré-merge)

**Build altera banco?** Não — só `prisma generate && next build`.

**Por que produção nova não pode terminar em `_teste`?**  
Para nunca confundir com alvo de scripts destrutivos; a allowlist **exige** sufixo de teste para **escrita** via scripts/sync.

**Preview PR #9?**  
`DATABASE_URL` = mesmo servidor, banco `*_teste` já no passo 3.

**Código antigo quebra no schema novo?** Não — ver seção “Compatibilidade” acima.
