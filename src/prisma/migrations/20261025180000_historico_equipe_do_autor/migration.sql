-- AlterTable
ALTER TABLE `historico_ticket` ADD COLUMN `equipe_id` CHAR(36) NULL,
    ADD COLUMN `inicio_equipe_id` CHAR(36) NULL;

-- Backfill: logs antigos não guardavam a equipe; a melhor informação
-- disponível é a equipe atual do autor.
UPDATE `historico_ticket` h
JOIN `usuarios` u ON u.`id` = h.`usuario_id`
SET h.`equipe_id` = u.`equipe_id`;

-- Backfill: marca um único início por (ticket, equipe) antes de criar o índice
-- único, para que inícios duplicados antigos não impeçam a migration.
UPDATE `historico_ticket` h
JOIN (
    SELECT MIN(`id`) AS `id`
    FROM `historico_ticket`
    WHERE `evento` = 'ATIVIDADE_INICIADA' AND `equipe_id` IS NOT NULL
    GROUP BY `ticket_id`, `equipe_id`
) primeiro ON primeiro.`id` = h.`id`
SET h.`inicio_equipe_id` = h.`equipe_id`;

-- CreateIndex
CREATE INDEX `ix_historico_equipe` ON `historico_ticket`(`equipe_id`);

-- CreateIndex
CREATE INDEX `ix_historico_inicio_equipe` ON `historico_ticket`(`inicio_equipe_id`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_historico_inicio_equipe` ON `historico_ticket`(`ticket_id`, `inicio_equipe_id`);

-- AddForeignKey
ALTER TABLE `historico_ticket` ADD CONSTRAINT `historico_ticket_equipe_id_fkey` FOREIGN KEY (`equipe_id`) REFERENCES `equipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_ticket` ADD CONSTRAINT `historico_ticket_inicio_equipe_id_fkey` FOREIGN KEY (`inicio_equipe_id`) REFERENCES `equipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
