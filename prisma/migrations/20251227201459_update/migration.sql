/*
  Warnings:

  - You are about to drop the column `konfrmasi` on the `monitoring_mesin` table. All the data in the column will be lost.
  - Made the column `status` on table `monitoring_mesin` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `monitoring_mesin` DROP COLUMN `konfrmasi`,
    MODIFY `status` ENUM('NORMAL', 'SEDANG', 'PARAH') NOT NULL;
