/*
  Warnings:

  - You are about to alter the column `status` on the `tickets` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `projetos` ADD COLUMN `descricao` TEXT NULL;

-- AlterTable
ALTER TABLE `tickets` MODIFY `status` ENUM('NAO_INICIADO', 'EM_ANDAMENTO', 'SOLICITACAO_ENCERRAMENTO', 'ENCERRADO', 'EM_REVISAO') NOT NULL DEFAULT 'NAO_INICIADO';

-- CreateTable
CREATE TABLE `ticket_equipes` (
    `id` CHAR(36) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ticket_id` CHAR(36) NOT NULL,
    `equipe_id` CHAR(36) NOT NULL,

    INDEX `ix_ticket_equipes_equipe`(`equipe_id`),
    UNIQUE INDEX `uq_ticket_equipes_ticket_equipe`(`ticket_id`, `equipe_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ticket_equipes` ADD CONSTRAINT `ticket_equipes_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_equipes` ADD CONSTRAINT `ticket_equipes_equipe_id_fkey` FOREIGN KEY (`equipe_id`) REFERENCES `equipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
