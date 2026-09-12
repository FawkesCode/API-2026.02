-- CreateTable
CREATE TABLE `Teste` (
    `id` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Teste_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
