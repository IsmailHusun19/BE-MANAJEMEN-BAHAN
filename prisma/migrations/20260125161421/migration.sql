/*
  Warnings:

  - The values [MEKANIK,ELEKTRIK,SENSOR,PNEUMATIK,HEATER,JAMMED,MATERIAL] on the enum `Monitoring_mesin_jenisKerusakan` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `monitoring_mesin` MODIFY `jenisKerusakan` ENUM('PREVENTIVE_MAINTENANCE', 'REPAIR', 'SETTING', 'TRIAL_PRODUK', 'GMP_SAFETY', 'IMPROVEMENT', 'PROJECT', 'LAINNYA') NULL;
