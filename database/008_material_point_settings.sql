-- US12: absent rows use the defaults; existing awards are immutable.
CREATE TABLE IF NOT EXISTS MaterialPointSetting (
 materialType VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 publisherPoints INT UNSIGNED NOT NULL,
 collectorPoints INT UNSIGNED NOT NULL,
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT ck_material_point_type CHECK (materialType IN ('plastico','papel','vidrio','metal','organico')),
 CONSTRAINT ck_material_point_values CHECK (publisherPoints <= 1000000 AND collectorPoints <= 1000000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
