-- US11: keep a durable audit of administrative account suspension/reactivation.
CREATE TABLE IF NOT EXISTS AccountStatusAudit (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 internalUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 targetUserId BIGINT UNSIGNED NOT NULL,
 actorAdminId BIGINT UNSIGNED NOT NULL,
 previousStatus VARCHAR(12) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 newStatus VARCHAR(12) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_account_status_audit_uuid (internalUUID),
 KEY ix_account_status_audit_target (targetUserId,createdAt),
 KEY ix_account_status_audit_actor (actorAdminId,createdAt),
 CONSTRAINT fk_account_status_audit_target FOREIGN KEY (targetUserId) REFERENCES User(id) ON DELETE RESTRICT,
 CONSTRAINT fk_account_status_audit_actor FOREIGN KEY (actorAdminId) REFERENCES User(id) ON DELETE RESTRICT,
 CONSTRAINT ck_account_status_audit_previous CHECK (previousStatus IN ('ACTIVE','SUSPENDED')),
 CONSTRAINT ck_account_status_audit_new CHECK (newStatus IN ('ACTIVE','SUSPENDED')),
 CONSTRAINT ck_account_status_audit_transition CHECK (previousStatus <> newStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
