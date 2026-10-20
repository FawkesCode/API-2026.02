-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `criadoPorId` VARCHAR(191) NULL,
    MODIFY `cargo` ENUM('TECNICO', 'GESTOR', 'SUPORTE', 'SUPORTE_INTERNO', 'COMERCIAL') NOT NULL;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
