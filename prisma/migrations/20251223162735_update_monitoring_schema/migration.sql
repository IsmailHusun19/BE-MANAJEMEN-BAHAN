/*
  Warnings:

  - Added the required column `name` to the `Monitoring_produksi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `monitoring_produksi` ADD COLUMN `name` VARCHAR(191) NOT NULL;
