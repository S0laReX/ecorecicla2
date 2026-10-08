-- US9: apply once through npm run migrate. Existing reservations remain intact.
CREATE TABLE IF NOT EXISTS CollectionPointAward (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 internalUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 reservationId BIGINT UNSIGNED NOT NULL,
 recipientUserId BIGINT UNSIGNED NOT NULL,
 recipientRole VARCHAR(12) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 points INT UNSIGNED NOT NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_point_award_uuid (internalUUID),
 UNIQUE KEY uq_point_award_recipient (reservationId,recipientUserId),
 UNIQUE KEY uq_point_award_role (reservationId,recipientRole),
 KEY ix_point_award_user (recipientUserId,createdAt),
 CONSTRAINT fk_point_award_reservation FOREIGN KEY (reservationId) REFERENCES CollectionReservation(id) ON DELETE RESTRICT,
 CONSTRAINT fk_point_award_user FOREIGN KEY (recipientUserId) REFERENCES User(id) ON DELETE RESTRICT,
 CONSTRAINT ck_point_award_role CHECK (recipientRole IN ('PUBLISHER','COLLECTOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE CollectionReservation
 ADD COLUMN expiresAt DATETIME(3) NULL,
 ADD COLUMN confirmedAt DATETIME(3) NULL,
 ADD KEY ix_reservation_expiry (status,expiresAt,id),
 DROP CHECK ck_collection_reservation_status,
 ADD CONSTRAINT ck_collection_reservation_status CHECK (status IN ('ACEPTADA','CANCELADA','CONFIRMADA','VENCIDA'));
