-- Persist the administrator decision for each company verification request.
-- Additive migration; existing users, company profiles and sessions remain intact.
CREATE TABLE IF NOT EXISTS CompanyVerificationDecision (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 internalUUID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 companyUserId BIGINT UNSIGNED NOT NULL,
 adminUserId BIGINT UNSIGNED NOT NULL,
 decision VARCHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 reason VARCHAR(300) NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_company_decision_uuid (internalUUID),
 KEY ix_company_decision_company (companyUserId, createdAt),
 KEY ix_company_decision_admin (adminUserId, createdAt),
 CONSTRAINT fk_company_decision_company FOREIGN KEY (companyUserId) REFERENCES `User`(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT fk_company_decision_admin FOREIGN KEY (adminUserId) REFERENCES `User`(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT ck_company_decision_type CHECK (decision IN ('APPROVED','REJECTED')),
 CONSTRAINT ck_company_decision_reason CHECK ((decision = 'APPROVED' AND reason IS NULL) OR (decision = 'REJECTED' AND CHAR_LENGTH(TRIM(reason)) BETWEEN 3 AND 300))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
