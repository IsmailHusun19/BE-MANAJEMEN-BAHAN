-- AlterTable
ALTER TABLE `monitoring_mesin` ADD COLUMN `idProduksi` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Monitoring_mesin` ADD CONSTRAINT `Monitoring_mesin_idProduksi_fkey` FOREIGN KEY (`idProduksi`) REFERENCES `Monitoring_produksi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
