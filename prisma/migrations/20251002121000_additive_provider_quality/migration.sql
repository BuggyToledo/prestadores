-- Colunas aditivas de qualidade de dados (sem DROP / sem alterar colunas existentes de forma destrutiva)

-- Enums como VARCHAR compatíveis com Prisma (MySQL)
-- kind
ALTER TABLE `providers` ADD COLUMN `kind` VARCHAR(32) NOT NULL DEFAULT 'prestador';
-- trustTier
ALTER TABLE `providers` ADD COLUMN `trustTier` VARCHAR(32) NOT NULL DEFAULT 'cadastrado';
-- displayName
ALTER TABLE `providers` ADD COLUMN `displayName` VARCHAR(191) NULL;
-- flags
ALTER TABLE `providers` ADD COLUMN `serves24h` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `providers` ADD COLUMN `issuesNfe` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `providers` ADD COLUMN `acceptsInvoicingTerms` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `providers` ADD COLUMN `needsReview` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `providers` ADD COLUMN `reviewNotes` TEXT NULL;

CREATE INDEX `providers_kind_idx` ON `providers`(`kind`);
CREATE INDEX `providers_trustTier_idx` ON `providers`(`trustTier`);
CREATE INDEX `providers_needsReview_idx` ON `providers`(`needsReview`);
