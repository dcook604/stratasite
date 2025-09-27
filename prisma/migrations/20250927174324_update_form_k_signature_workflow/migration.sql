/*
  Warnings:

  - You are about to drop the column `landlord_signature` on the `form_k_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `tenant1_signature` on the `form_k_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `tenant2_signature` on the `form_k_submissions` table. All the data in the column will be lost.
  - Added the required column `landlord_signature_date` to the `form_k_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `landlord_signature_name` to the `form_k_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_signing_method` to the `form_k_submissions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_form_k_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strata_plan" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "strata_lot_number" TEXT NOT NULL,
    "locker_number" TEXT,
    "parking_stall_numbers" TEXT,
    "tenant1_name" TEXT NOT NULL,
    "tenant1_home_phone" TEXT,
    "tenant1_office_phone" TEXT,
    "tenant1_cell_phone" TEXT,
    "tenant1_email" TEXT,
    "tenant2_name" TEXT,
    "tenant2_home_phone" TEXT,
    "tenant2_office_phone" TEXT,
    "tenant2_cell_phone" TEXT,
    "tenant2_email" TEXT,
    "tenancy_commencing_day" TEXT NOT NULL,
    "tenancy_commencing_date" TEXT NOT NULL,
    "tenancy_commencing_year" TEXT NOT NULL,
    "landlord_name" TEXT NOT NULL,
    "landlord_address" TEXT NOT NULL,
    "landlord_signature_name" TEXT NOT NULL,
    "landlord_signature_date" TEXT NOT NULL,
    "tenant_signing_method" TEXT NOT NULL,
    "tenant1_signature_name" TEXT,
    "tenant1_signature_date" TEXT,
    "tenant2_signature_name" TEXT,
    "tenant2_signature_date" TEXT,
    "landlord_signature_completed" BOOLEAN NOT NULL DEFAULT false,
    "tenant1_signature_completed" BOOLEAN NOT NULL DEFAULT false,
    "tenant2_signature_completed" BOOLEAN NOT NULL DEFAULT false,
    "requires_tenant_signatures" BOOLEAN NOT NULL DEFAULT false,
    "tenant1_signature_token" TEXT,
    "tenant2_signature_token" TEXT,
    "tenant1_token_expiry" DATETIME,
    "tenant2_token_expiry" DATETIME,
    "owner_mailing_address" TEXT NOT NULL,
    "owner_home_phone" TEXT,
    "owner_work_phone" TEXT,
    "owner_fax" TEXT,
    "owner_cellular" TEXT,
    "owner_email" TEXT,
    "submission_date" TEXT NOT NULL,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_form_k_submissions" ("address", "created_at", "email_sent", "id", "is_submitted", "landlord_address", "landlord_name", "locker_number", "owner_cellular", "owner_email", "owner_fax", "owner_home_phone", "owner_mailing_address", "owner_work_phone", "parking_stall_numbers", "strata_lot_number", "strata_plan", "submission_date", "tenancy_commencing_date", "tenancy_commencing_day", "tenancy_commencing_year", "tenant1_cell_phone", "tenant1_email", "tenant1_home_phone", "tenant1_name", "tenant1_office_phone", "tenant2_cell_phone", "tenant2_email", "tenant2_home_phone", "tenant2_name", "tenant2_office_phone", "unit_number", "updated_at") SELECT "address", "created_at", "email_sent", "id", "is_submitted", "landlord_address", "landlord_name", "locker_number", "owner_cellular", "owner_email", "owner_fax", "owner_home_phone", "owner_mailing_address", "owner_work_phone", "parking_stall_numbers", "strata_lot_number", "strata_plan", "submission_date", "tenancy_commencing_date", "tenancy_commencing_day", "tenancy_commencing_year", "tenant1_cell_phone", "tenant1_email", "tenant1_home_phone", "tenant1_name", "tenant1_office_phone", "tenant2_cell_phone", "tenant2_email", "tenant2_home_phone", "tenant2_name", "tenant2_office_phone", "unit_number", "updated_at" FROM "form_k_submissions";
DROP TABLE "form_k_submissions";
ALTER TABLE "new_form_k_submissions" RENAME TO "form_k_submissions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
