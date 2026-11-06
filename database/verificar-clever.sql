-- Reemplaza NOMBRE_DE_TU_BASE por el nombre asignado por Clever Cloud.
-- Este archivo solo consulta datos; no modifica la base.
USE `NOMBRE_DE_TU_BASE`;

SELECT DATABASE() AS base_seleccionada, VERSION() AS version_mysql;
SHOW TABLES;
SELECT `code`, `name` FROM `Role` ORDER BY `code`;
SELECT COUNT(*) AS usuarios FROM `User`;
SELECT COUNT(*) AS publicaciones FROM `Publication`;
SELECT COUNT(*) AS reservas FROM `CollectionReservation`;
SELECT COUNT(*) AS avisos FROM `Notice`;
SHOW COLUMNS FROM `CollectionReservation` WHERE Field IN ('expiresAt', 'confirmedAt');
