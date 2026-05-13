-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_storage_locker_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "locker_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent_given" BOOLEAN NOT NULL,
    "on_waiting_list" BOOLEAN NOT NULL DEFAULT false,
    "prepay_year" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "storage_locker_applications_locker_id_fkey" FOREIGN KEY ("locker_id") REFERENCES "storage_lockers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_storage_locker_applications" ("address", "admin_notes", "application_id", "consent_given", "created_at", "email", "email_sent", "first_name", "id", "is_active", "last_name", "locker_id", "on_waiting_list", "status", "telephone", "unit_number", "updated_at") SELECT "address", "admin_notes", "application_id", "consent_given", "created_at", "email", "email_sent", "first_name", "id", "is_active", "last_name", "locker_id", "on_waiting_list", "status", "telephone", "unit_number", "updated_at" FROM "storage_locker_applications";
DROP TABLE "storage_locker_applications";
ALTER TABLE "new_storage_locker_applications" RENAME TO "storage_locker_applications";
CREATE UNIQUE INDEX "storage_locker_applications_application_id_key" ON "storage_locker_applications"("application_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
