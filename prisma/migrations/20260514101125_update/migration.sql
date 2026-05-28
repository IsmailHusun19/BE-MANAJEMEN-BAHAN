/*
  Warnings:

  - You are about to drop the column `jumlah` on the `bahansisa` table. All the data in the column will be lost.
  - Added the required column `jumlahDipakai` to the `BahanSisa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bahansisa` DROP COLUMN `jumlah`,
    ADD COLUMN `jumlahDipakai` DOUBLE NOT NULL,
    ADD COLUMN `jumlahSisa` DOUBLE NOT NULL DEFAULT 0;
