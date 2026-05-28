/*
  Warnings:

  - You are about to drop the column `lineId` on the `monitoring_mesin` table. All the data in the column will be lost.
  - You are about to drop the column `produkId` on the `monitoring_mesin` table. All the data in the column will be lost.
  - You are about to drop the column `shiftId` on the `monitoring_mesin` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_lineId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_produkId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_shiftId_fkey`;

-- DropIndex
DROP INDEX `Monitoring_mesin_lineId_fkey` ON `monitoring_mesin`;

-- DropIndex
DROP INDEX `Monitoring_mesin_produkId_fkey` ON `monitoring_mesin`;

-- DropIndex
DROP INDEX `Monitoring_mesin_shiftId_fkey` ON `monitoring_mesin`;

-- AlterTable
ALTER TABLE `monitoring_mesin` DROP COLUMN `lineId`,
    DROP COLUMN `produkId`,
    DROP COLUMN `shiftId`;
