-- DropForeignKey
ALTER TABLE `monitoring_mesin_gambar` DROP FOREIGN KEY `Monitoring_mesin_gambar_monitoringMesinId_fkey`;

-- DropIndex
DROP INDEX `Monitoring_mesin_gambar_monitoringMesinId_fkey` ON `monitoring_mesin_gambar`;

-- AddForeignKey
ALTER TABLE `Monitoring_mesin_gambar` ADD CONSTRAINT `Monitoring_mesin_gambar_monitoringMesinId_fkey` FOREIGN KEY (`monitoringMesinId`) REFERENCES `Monitoring_mesin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
