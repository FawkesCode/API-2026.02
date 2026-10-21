CREATE TABLE `atividades_conta` (
    `id` CHAR(36) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `descricao` TEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` CHAR(36) NOT NULL,
    INDEX `ix_atividades_conta_usuario_data` (`usuario_id`, `criado_em`),
    PRIMARY KEY (`id`),
    CONSTRAINT `atividades_conta_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
