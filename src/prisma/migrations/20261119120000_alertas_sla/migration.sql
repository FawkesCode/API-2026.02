CREATE TABLE `alertas_sla` (
  `id` CHAR(36) NOT NULL,
  `ticket_id` CHAR(36) NOT NULL,
  `sla_em` DATETIME(3) NOT NULL,
  `reservado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `enviado_em` DATETIME(3) NULL,
  UNIQUE INDEX `uq_alertas_sla_ticket_prazo` (`ticket_id`, `sla_em`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `alertas_sla` ADD CONSTRAINT `alertas_sla_ticket_id_fkey`
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
