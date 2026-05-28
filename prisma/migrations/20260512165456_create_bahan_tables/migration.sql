/*
  Warnings:

  - The values [OPERATOR_PRODUKSI,KETUA_REGU,ADMIN,UNIT_HEAD] on the enum `Users_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `line` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monitoring_mesin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monitoring_mesin_gambar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monitoring_produksi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `produk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_idProduksi_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_mesinId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_mesin` DROP FOREIGN KEY `Monitoring_mesin_userId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_mesin_gambar` DROP FOREIGN KEY `Monitoring_mesin_gambar_monitoringMesinId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_produksi` DROP FOREIGN KEY `Monitoring_produksi_lineId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_produksi` DROP FOREIGN KEY `Monitoring_produksi_produkId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_produksi` DROP FOREIGN KEY `Monitoring_produksi_shiftId_fkey`;

-- DropForeignKey
ALTER TABLE `monitoring_produksi` DROP FOREIGN KEY `Monitoring_produksi_userId_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `role` ENUM('OWNER', 'STAFF_GUDANG', 'SUPERVISOR_PRODUKSI', 'LEADER_PRODUKSI') NOT NULL;

-- DropTable
DROP TABLE `line`;

-- DropTable
DROP TABLE `mesin`;

-- DropTable
DROP TABLE `monitoring_mesin`;

-- DropTable
DROP TABLE `monitoring_mesin_gambar`;

-- DropTable
DROP TABLE `monitoring_produksi`;

-- DropTable
DROP TABLE `produk`;

-- DropTable
DROP TABLE `shift`;

-- CreateTable
CREATE TABLE `Bahan` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `stok` DOUBLE NOT NULL,
    `jumlahMinimum` DOUBLE NOT NULL,
    `satuan` ENUM('PCS', 'METER', 'KG', 'ROLL', 'CONE', 'PACK', 'YARD') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Bahan_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransaksiBahanMasuk` (
    `id` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `tanggalMasuk` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `supplier` VARCHAR(191) NULL,
    `catatan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BahanMasuk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaksiId` INTEGER NOT NULL,
    `bahanId` INTEGER NOT NULL,
    `jumlah` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BahanMasuk_transaksiId_bahanId_key`(`transaksiId`, `bahanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransaksiBahanSisa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'DISETUJUI', 'DITOLAK') NOT NULL DEFAULT 'PENDING',
    `catatan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BahanSisa` (
    `id` INTEGER NOT NULL,
    `transaksiId` INTEGER NOT NULL,
    `bahanId` INTEGER NOT NULL,
    `jumlah` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BahanSisa_transaksiId_bahanId_key`(`transaksiId`, `bahanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TransaksiBahanMasuk` ADD CONSTRAINT `TransaksiBahanMasuk_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BahanMasuk` ADD CONSTRAINT `BahanMasuk_transaksiId_fkey` FOREIGN KEY (`transaksiId`) REFERENCES `TransaksiBahanMasuk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BahanMasuk` ADD CONSTRAINT `BahanMasuk_bahanId_fkey` FOREIGN KEY (`bahanId`) REFERENCES `Bahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransaksiBahanSisa` ADD CONSTRAINT `TransaksiBahanSisa_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BahanSisa` ADD CONSTRAINT `BahanSisa_transaksiId_fkey` FOREIGN KEY (`transaksiId`) REFERENCES `TransaksiBahanSisa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BahanSisa` ADD CONSTRAINT `BahanSisa_bahanId_fkey` FOREIGN KEY (`bahanId`) REFERENCES `Bahan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
