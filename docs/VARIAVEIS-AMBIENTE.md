# Variáveis de ambiente — Vercel e local

Referência para **Production**, **Preview** (PR #9) e desenvolvimento local.  
Ordem de configuração na virada: `docs/RUNBOOK-VIRADA.md` (passo 7).

---

## Tabela resumida

| Variável | Production | Preview (PR #9) | Local (.env) | Obrigatória runtime |
|---|---|---|---|---|
| `JWT_SECRET` | Sim (≥32 chars) | Sim (≥32; pode ser chave só de preview) | Sim | **Sim** — app falha sem ela |
| `DATABASE_URL` | Banco **novo** sem `_teste` (ex. `prestadores_v2`) | Banco `*_teste` **já migrado** | `*_teste` para scripts | Sim se `USE_REAL_PRISMA=true` |
| `USE_REAL_PRISMA` | `true` | `true` | `true` | Recomendado `true` em prod/preview |
| `NEXT_PUBLIC_APP_URL` | URL pública do site | URL do preview Vercel (opcional mas útil) | `http://localhost:3000` | Não bloqueia boot |
| `PRODUCTION_DATABASE_HOSTS` | Opcional (denylist) | Opcional | Opcional | Não |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | **Não** (seed local) | **Não** | Só para `npm run db:seed` | Não na Vercel |
| `NODE_ENV` | Automático (`production`) | Automático | `development` | Automático Vercel |

---

## Production (após virada)

1. Defina **`JWT_SECRET`** (mantenha estável entre deploys).
2. **`USE_REAL_PRISMA`** = `true`.
3. **`DATABASE_URL`** → banco novo (ex.: `prestadores_v2`).  
   **Antes do merge do #9**, já aponte para v2 migrado/importado.
4. **`NEXT_PUBLIC_APP_URL`** → domínio final (ex.: `https://sindicone.com.br`).

Não use nome de banco terminando em `_teste` / `_test` em Production — isso é reservado a teste e scripts de escrita.

---

## Preview — deploy do PR #9

Objetivo: testar código novo contra schema e dados reais **sem** tocar produção.

1. **`JWT_SECRET`** — qualquer string ≥32 (pode ser diferente da Production).
2. **`USE_REAL_PRISMA`** = `true`.
3. **`DATABASE_URL`** — apontar para o banco local de teste no servidor MySQL, **nome terminando em `_teste`**, com:
   - restore do backup de produção
   - `migrate resolve --applied 20251002120000_baseline`
   - `migrate deploy`
   - (opcional) clean-data já aplicado

4. Redeploy do preview após alterar env.

O preview **não** deve usar o banco de produção **antigo** nem `prestadores_v2` até você decidir promover a virada — use o `*_teste` preparado.

---

## Local (scripts e dev)

Copie `.env.example`. Para `clean-data --from-db` / `--apply`:

- `DATABASE_URL` → **obrigatoriamente** `*_teste` ou `*_test`
- Scripts **recusam** bancos como `prestadores_v2`, `catalogo_servicos`, etc.

`npm run db:seed` exige `ADMIN_EMAIL` e `ADMIN_PASSWORD` (≥12 chars, não `admin123`).

---

## O que o build **não** lê

O comando `npm run build` (`prisma generate && next build`) **não** executa migrations.  
Migrar schema é manual (`migrate deploy` no `*_teste` ou import do dump já migrado).
