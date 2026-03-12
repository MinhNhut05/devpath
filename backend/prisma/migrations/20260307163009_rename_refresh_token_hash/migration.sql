-- RenameColumn: token → token_hash in refresh_tokens table
-- Security improvement: store SHA-256 hash of refresh token instead of plaintext JWT

ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";
