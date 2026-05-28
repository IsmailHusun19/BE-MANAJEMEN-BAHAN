/*
  Warnings:

  - The primary key for the `bahan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `bahansisa` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `transaksibahanmasuk` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `bahanmasuk` DROP FOREIGN KEY `BahanMasuk_bahanId_fkey`;

-- DropForeignKey
ALTER TABLE `bahanmasuk` DROP FOREIGN KEY `BahanMasuk_transaksiId_fkey`;

-- DropForeignKey
ALTER TABLE `bahansisa` DROP FOREIGN KEY `BahanSisa_bahanId_fkey`;

-- DropIndex
DROP INDEX `BahanMasuk_bahanId_fkey` ON `bahanmasuk`;

-- DropIndex
DROP INDEX `BahanSisa_bahanId_fkey` ON `bahansisa`;

-- AlterTable
ALTER TABLE `bahan` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `bahanmasuk` MODIFY `transaksiId` VARCHAR(191) NOT NULL,
    MODIFY `bahanId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `bahansisa` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `bahanId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `transaksibahanmasuk` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `BahanMasuk` ADD CONSTRAINT `BahanMasuk_transaksiId_fkey` FOREIGN KEY (`transaksiId`) REFERENCES `TransaksiBahanMasuk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BahanMasuk` ADD CONSTRAINT `BahanMasuk_bahanId_fkey` FOREIGN KEY (`bahanId`) REFERENCES `Bahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BahanSisa` ADD CONSTRAINT `BahanSisa_bahanId_fkey` FOREIGN KEY (`bahanId`) REFERENCES `Bahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
