-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `criado_por_id` CHAR(36) NULL,
    MODIFY `cargo` ENUM('TECNICO', 'GESTOR', 'SUPORTE', 'SUPORTE_INTERNO', 'COMERCIAL') NOT NULL;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_criado_por_id_fkey` FOREIGN KEY (`criado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
