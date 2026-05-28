/*
  Warnings:

  - The primary key for the `monitoring_produksi` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_idProduksi_fkey`;

-- DropIndex
DROP INDEX `Monitoring_mesin_idProduksi_fkey` ON `monitoring_mesin`;

-- AlterTable
ALTER TABLE `monitoring_mesin` MODIFY `idProduksi` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `monitoring_produksi` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Monitoring_mesin` ADD CONSTRAINT `Monitoring_mesin_idProduksi_fkey` FOREIGN KEY (`idProduksi`) REFERENCES `Monitoring_produksi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
