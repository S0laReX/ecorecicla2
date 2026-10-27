-- US10: one private star rating from each collection participant.
CREATE TABLE IF NOT EXISTS CollectionRating (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 internalUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 reservationId BIGINT UNSIGNED NOT NULL,
 raterUserId BIGINT UNSIGNED NOT NULL,
 ratedUserId BIGINT UNSIGNED NOT NULL,
 score TINYINT UNSIGNED NOT NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_collection_rating_uuid (internalUUID),
 UNIQUE KEY uq_collection_rating_rater (reservationId,raterUserId),
 KEY ix_collection_rating_recipient (ratedUserId,createdAt),
 CONSTRAINT fk_collection_rating_reservation FOREIGN KEY (reservationId) REFERENCES CollectionReservation(id) ON DELETE RESTRICT,
 CONSTRAINT fk_collection_rating_rater FOREIGN KEY (raterUserId) REFERENCES User(id) ON DELETE RESTRICT,
 CONSTRAINT fk_collection_rating_rated FOREIGN KEY (ratedUserId) REFERENCES User(id) ON DELETE RESTRICT,
 CONSTRAINT ck_collection_rating_score CHECK (score BETWEEN 1 AND 5),
 CONSTRAINT ck_collection_rating_different_users CHECK (raterUserId <> ratedUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
