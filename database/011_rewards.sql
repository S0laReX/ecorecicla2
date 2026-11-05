-- Rewards debit the earned-points ledger without changing historical awards.
CREATE TABLE IF NOT EXISTS Reward (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 internalUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 name VARCHAR(120) NOT NULL,
 description VARCHAR(1000) NOT NULL,
 pointsCost INT UNSIGNED NOT NULL,
 stock INT UNSIGNED NOT NULL,
 isActive BOOLEAN NOT NULL DEFAULT TRUE,
 version INT UNSIGNED NOT NULL DEFAULT 1,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_reward_uuid (internalUUID),
 KEY ix_reward_catalog (isActive,createdAt,id),
 CONSTRAINT ck_reward_values CHECK (pointsCost BETWEEN 1 AND 1000000 AND stock <= 1000000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS RewardRedemption (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 internalUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 requestUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 userId BIGINT UNSIGNED NOT NULL,
 rewardId BIGINT UNSIGNED NOT NULL,
 rewardName VARCHAR(120) NOT NULL,
 pointsCost INT UNSIGNED NOT NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 deliveredAt DATETIME(3) NULL,
 deliveredByUserId BIGINT UNSIGNED NULL,
 UNIQUE KEY uq_redemption_uuid (internalUUID),
 UNIQUE KEY uq_redemption_request (userId,requestUUID),
 KEY ix_redemption_user (userId,createdAt,id),
 KEY ix_redemption_delivery (deliveredAt,createdAt,id),
 CONSTRAINT fk_redemption_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT,
 CONSTRAINT fk_redemption_reward FOREIGN KEY (rewardId) REFERENCES Reward(id) ON DELETE RESTRICT,
 CONSTRAINT fk_redemption_admin FOREIGN KEY (deliveredByUserId) REFERENCES User(id) ON DELETE RESTRICT,
 CONSTRAINT ck_redemption_cost CHECK (pointsCost BETWEEN 1 AND 1000000),
 CONSTRAINT ck_redemption_delivery CHECK ((deliveredAt IS NULL AND deliveredByUserId IS NULL) OR (deliveredAt IS NOT NULL AND deliveredByUserId IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
