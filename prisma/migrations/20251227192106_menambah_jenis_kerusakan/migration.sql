/*
  Warnings:

  - Added the required column `jenisKerusakan` to the `Monitoring_mesin` table without a default value. This is not possible if the table is not empty.
  - Made the column `idProduksi` on table `monitoring_mesin` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_idProduksi_fkey`;

-- DropIndex
DROP INDEX `Monitoring_mesin_idProduksi_fkey` ON `monitoring_mesin`;

-- AlterTable
ALTER TABLE `monitoring_mesin` ADD COLUMN `jenisKerusakan` ENUM('MEKANIK', 'ELEKTRIK', 'SENSOR', 'PNEUMATIK', 'HEATER', 'JAMMED', 'MATERIAL', 'LAINNYA') NOT NULL,
    ADD COLUMN `kerusakan_lainnya` VARCHAR(191) NULL,
    MODIFY `idProduksi` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Monitoring_mesin` ADD CONSTRAINT `Monitoring_mesin_idProduksi_fkey` FOREIGN KEY (`idProduksi`) REFERENCES `Monitoring_produksi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
