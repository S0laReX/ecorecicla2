-- Optional profile details; existing identities and company verification are preserved.
CREATE TABLE IF NOT EXISTS AccountProfile (
 userId BIGINT UNSIGNED NOT NULL PRIMARY KEY,
 contact VARCHAR(120) NOT NULL DEFAULT '',
 address VARCHAR(300) NOT NULL DEFAULT '',
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT fk_account_profile_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
