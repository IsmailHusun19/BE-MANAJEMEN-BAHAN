-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_idProduksi_fkey`;

-- DropIndex
DROP INDEX `Monitoring_mesin_idProduksi_fkey` ON `monitoring_mesin`;

-- AddForeignKey
ALTER TABLE `Monitoring_mesin` ADD CONSTRAINT `Monitoring_mesin_idProduksi_fkey` FOREIGN KEY (`idProduksi`) REFERENCES `Monitoring_produksi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
