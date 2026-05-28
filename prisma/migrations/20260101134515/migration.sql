/*
  Warnings:

  - You are about to alter the column `idProduksi` on the `monitoring_mesin` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `monitoring_produksi` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `monitoring_produksi` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[qrCode]` on the table `Monitoring_produksi` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qrCode` to the `Monitoring_produksi` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_idProduksi_fkey`;

-- DropIndex
DROP INDEX `Monitoring_mesin_idProduksi_fkey` ON `monitoring_mesin`;

-- AlterTable
ALTER TABLE `monitoring_mesin` MODIFY `idProduksi` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `monitoring_produksi` DROP PRIMARY KEY,
    ADD COLUMN `qrCode` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Monitoring_produksi_qrCode_key` ON `Monitoring_produksi`(`qrCode`);

-- AddForeignKey
ALTER TABLE `Monitoring_mesin` ADD CONSTRAINT `Monitoring_mesin_idProduksi_fkey` FOREIGN KEY (`idProduksi`) REFERENCES `Monitoring_produksi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
