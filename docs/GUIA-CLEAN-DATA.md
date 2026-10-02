# Guia leigo — limpeza de dados (Fase 1B) no seu computador

Este guia explica, passo a passo, como gerar o relatório de revisão e
(depois da sua aprovação) aplicar as mudanças **somente no banco de TESTE**.

> **Importante:** o sistema **só aceita** bancos cujo **nome** termina em
> `_teste` ou `_test` (ex.: `catalogo_servicos_teste`).  
> Nunca use o banco de produção.

---

## O que você vai precisar

1. Este projeto baixado no computador (via GitHub Desktop ou `git clone`).
2. Node.js instalado (versão 20 ou superior) — https://nodejs.org
3. Um MySQL de **teste** restaurado de um backup, com nome terminando em `_teste` ou `_test`.
4. Um editor de planilhas (Excel, Google Sheets ou LibreOffice).

---

## Parte A — Preparar o projeto (uma vez)

1. Abra a pasta do projeto no terminal (Prompt de Comando / Terminal).
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`) e preencha:
   - `DATABASE_URL` apontando para o banco de **teste**  
     Exemplo: `mysql://usuario:senha@localhost:3306/catalogo_servicos_teste`
   - `JWT_SECRET` com pelo menos 32 caracteres aleatórios
   - `USE_REAL_PRISMA=true`
4. Aplique as migrations (cria colunas novas sem apagar dados):
   ```bash
   # Se o banco já existia antes destas migrations:
   npx prisma migrate resolve --applied 20251002120000_baseline
   npx prisma migrate deploy

   # Alternativa rápida em teste (se preferir):
   npx prisma db push
   ```

---

## Parte B — Gerar o relatório (dry-run — não altera o banco)

### Opção 1: a partir do CSV de amostra (sem banco)

1. Coloque/atualize o arquivo `data/amostra-providers.csv` (este arquivo **não** vai para o Git).
2. Rode:
   ```bash
   npm run clean-data -- --from-csv data/amostra-providers.csv
   ```
3. O relatório aparece em `reports/clean-data-review.csv`.

### Opção 2: a partir do banco de teste

1. Confira se o nome do banco termina em `_teste` ou `_test`.
2. Rode:
   ```bash
   npm run clean-data -- --from-db
   ```
3. Se o nome do banco estiver errado, o script **aborta** com mensagem clara
   (e **não** mostra a senha da conexão).

---

## Parte C — Revisar no Excel / planilha

1. Abra `reports/clean-data-review.csv`.
2. Colunas:
   - `id` — registro
   - `campo` — o que mudaria
   - `valor_antigo` / `valor_novo`
   - `motivo` / `confianca` / `acao_sugerida`
   - `aprovado` — **deixe em branco** ou escreva **`SIM`** só nas linhas que você autoriza
3. Salve o arquivo (mantenha CSV).

---

## Parte D — Aplicar só o que você aprovou

> Só faça isso depois de revisar. Isso **escreve** no banco de teste.

```bash
npm run clean-data -- --apply --from-review reports/clean-data-review.csv
```

O script:
- Confere de novo se o banco é de teste (`*_teste` / `*_test`)
- Aplica **somente** linhas com `aprovado=SIM`
- Ignora duplicados marcados só para mesclagem manual (`flag_duplicate`)

---

## Parte E — Trocar a senha do admin (depois do deploy)

1. Entre em `/admin/login` com a senha atual.
2. No menu lateral, abra **Alterar Senha**.
3. Informe senha atual + nova senha (mínimo 12 caracteres; não pode ser `admin123`).
4. Ao salvar, as outras sessões abertas deixam de funcionar.

---

## Problemas comuns

| Situação | O que fazer |
|---|---|
| “nome do banco deve terminar em _teste” | Renomeie o banco de teste ou aponte o `.env` para o banco certo |
| “host de produção na denylist” | Você apontou para o MySQL de produção — troque para o de teste |
| `npm` não encontrado | Instale o Node.js e reabra o terminal |
| Erro de migration | No banco antigo, rode o `migrate resolve --applied` do baseline (Parte A) |

---

## Segurança

- Nunca compartilhe o arquivo `.env`.
- Os logs mascaram senha e host.
- Não existe `--apply` sem `--from-review`.
- Dry-run é o padrão.
