-- AlterTable
ALTER TABLE `monitoring_mesin` ADD COLUMN `konfrmasi` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `status` ENUM('NORMAL', 'SEDANG', 'PARAH') NULL;

-- AlterTable
ALTER TABLE `monitoring_produksi` ADD COLUMN `konfrmasi` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `target` INTEGER NULL;
