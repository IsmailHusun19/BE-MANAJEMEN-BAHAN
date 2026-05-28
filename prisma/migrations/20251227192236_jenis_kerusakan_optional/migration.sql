-- AlterTable
ALTER TABLE `monitoring_mesin` MODIFY `jenisKerusakan` ENUM('MEKANIK', 'ELEKTRIK', 'SENSOR', 'PNEUMATIK', 'HEATER', 'JAMMED', 'MATERIAL', 'LAINNYA') NULL;
