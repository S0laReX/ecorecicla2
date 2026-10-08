-- US8: reservations are append-only; cancelled bookings remain available for audit.
CREATE TABLE IF NOT EXISTS CollectionReservation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  internalUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  publicationId BIGINT UNSIGNED NOT NULL,
  companyUserId BIGINT UNSIGNED NOT NULL,
  scheduledAt DATETIME(3) NOT NULL,
  status VARCHAR(12) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'ACEPTADA',
  activePublicationId BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN status = 'ACEPTADA' THEN publicationId ELSE NULL END
  ) STORED,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_collection_reservation_uuid (internalUUID),
  UNIQUE KEY uq_collection_active_publication (activePublicationId),
  KEY ix_collection_company_agenda (companyUserId, status, scheduledAt, id),
  KEY ix_collection_publication_history (publicationId, createdAt, id),
  CONSTRAINT fk_collection_publication FOREIGN KEY (publicationId)
    REFERENCES Publication (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_collection_company FOREIGN KEY (companyUserId)
    REFERENCES User (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_collection_reservation_status CHECK (status IN ('ACEPTADA','CANCELADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
