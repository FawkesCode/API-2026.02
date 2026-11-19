-- AlterTable: começa como NULL para conseguir preencher os clientes já existentes.
ALTER TABLE `clientes` ADD COLUMN `cnpj` CHAR(14) NULL,
    ADD COLUMN `localizacao` VARCHAR(255) NULL;

-- Backfill: clientes antigos não tinham CNPJ nem localização. Recebem um
-- CNPJ provisório único (derivado do id, com letras, então nunca colide com
-- um CNPJ real de 14 dígitos) e devem ser corrigidos pela edição de cliente.
UPDATE `clientes`
SET `cnpj` = LEFT(REPLACE(`id`, '-', ''), 14),
    `localizacao` = 'Não informada'
WHERE `cnpj` IS NULL;

-- AlterTable
ALTER TABLE `clientes` MODIFY `cnpj` CHAR(14) NOT NULL,
    MODIFY `localizacao` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `uq_clientes_cnpj` ON `clientes`(`cnpj`);
