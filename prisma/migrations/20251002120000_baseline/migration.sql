-- Baseline do schema existente (User, Category, Subcategory, Provider, Banner).
-- Em bancos JÁ populados: NÃO execute este SQL — use:
--   npx prisma migrate resolve --applied 20251002120000_baseline
-- Em bancos vazios novos, o Prisma aplicará o histórico a partir daqui.
-- Este arquivo é intencionalmente vazio (sem CREATE/DROP) para não recriar tabelas.
SELECT 1;
