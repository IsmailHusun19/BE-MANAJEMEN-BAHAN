/*
  Warnings:

  - The primary key for the `bahansisa` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `bahansisa` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `transaksibahansisa` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `bahansisa` DROP FOREIGN KEY `BahanSisa_transaksiId_fkey`;

-- AlterTable
ALTER TABLE `bahansisa` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `transaksiId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `transaksibahansisa` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `BahanSisa` ADD CONSTRAINT `BahanSisa_transaksiId_fkey` FOREIGN KEY (`transaksiId`) REFERENCES `TransaksiBahanSisa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
