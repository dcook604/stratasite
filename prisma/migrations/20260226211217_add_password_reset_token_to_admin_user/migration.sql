-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN "password_reset_expiry" DATETIME;
ALTER TABLE "admin_users" ADD COLUMN "password_reset_token" TEXT;
