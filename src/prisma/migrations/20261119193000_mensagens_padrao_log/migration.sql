CREATE TABLE `mensagens_padrao_log` (
    `id` CHAR(36) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `usuario_id` CHAR(36) NOT NULL,

    INDEX `ix_mensagens_padrao_log_usuario_data`(`usuario_id`, `criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `mensagens_padrao_log` ADD CONSTRAINT `mensagens_padrao_log_usuario_id_fkey`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
