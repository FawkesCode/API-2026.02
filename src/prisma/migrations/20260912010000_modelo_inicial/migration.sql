-- DropTable
DROP TABLE `Teste`;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` CHAR(36) NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `cargo` ENUM('TECNICO', 'GESTOR', 'SUPORTE', 'COMERCIAL') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `senha_provisoria` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `equipe_id` CHAR(36) NULL,

    UNIQUE INDEX `uq_usuarios_email`(`email`),
    INDEX `ix_usuarios_equipe`(`equipe_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipes` (
    `id` CHAR(36) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_equipes_nome`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` CHAR(36) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_clientes_nome`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projetos` (
    `id` CHAR(36) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `local_instalacao` VARCHAR(255) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `cliente_id` CHAR(36) NOT NULL,
    `equipe_id` CHAR(36) NOT NULL,
    `gestor_id` CHAR(36) NOT NULL,

    INDEX `ix_projetos_equipe`(`equipe_id`),
    INDEX `ix_projetos_gestor`(`gestor_id`),
    UNIQUE INDEX `uq_projetos_cliente_nome`(`cliente_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tickets` (
    `id` CHAR(36) NOT NULL,
    `titulo` VARCHAR(180) NOT NULL,
    `descricao` TEXT NOT NULL,
    `categoria` ENUM('MANUTENCAO', 'INSTALACAO') NOT NULL,
    `prioridade` ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA',
    `status` ENUM('ABERTO', 'EM_ANDAMENTO', 'ENCERRADO') NOT NULL DEFAULT 'ABERTO',
    `sla_em` DATETIME(3) NOT NULL,
    `encerrado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `projeto_id` CHAR(36) NOT NULL,
    `aberto_por_id` CHAR(36) NOT NULL,
    `responsavel_id` CHAR(36) NULL,

    INDEX `ix_tickets_fila`(`projeto_id`, `status`, `prioridade`, `criado_em`),
    INDEX `ix_tickets_sla`(`status`, `sla_em`),
    INDEX `ix_tickets_aberto_por`(`aberto_por_id`),
    INDEX `ix_tickets_responsavel`(`responsavel_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relatorios` (
    `id` CHAR(36) NOT NULL,
    `trabalho_realizado` TEXT NOT NULL,
    `materiais_utilizados` TEXT NOT NULL,
    `outros_detalhes` TEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,
    `ticket_id` CHAR(36) NOT NULL,
    `autor_id` CHAR(36) NOT NULL,

    INDEX `ix_relatorios_ticket`(`ticket_id`, `criado_em`),
    INDEX `ix_relatorios_autor`(`autor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_ticket` (
    `id` CHAR(36) NOT NULL,
    `evento` VARCHAR(50) NOT NULL,
    `descricao` TEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ticket_id` CHAR(36) NOT NULL,
    `usuario_id` CHAR(36) NULL,

    INDEX `ix_historico_ticket_data`(`ticket_id`, `criado_em`),
    INDEX `ix_historico_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_equipe_id_fkey` FOREIGN KEY (`equipe_id`) REFERENCES `equipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projetos` ADD CONSTRAINT `projetos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projetos` ADD CONSTRAINT `projetos_equipe_id_fkey` FOREIGN KEY (`equipe_id`) REFERENCES `equipes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projetos` ADD CONSTRAINT `projetos_gestor_id_fkey` FOREIGN KEY (`gestor_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_projeto_id_fkey` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_aberto_por_id_fkey` FOREIGN KEY (`aberto_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorios` ADD CONSTRAINT `relatorios_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorios` ADD CONSTRAINT `relatorios_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_ticket` ADD CONSTRAINT `historico_ticket_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_ticket` ADD CONSTRAINT `historico_ticket_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
