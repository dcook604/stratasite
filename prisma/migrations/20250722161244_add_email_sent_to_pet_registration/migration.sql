-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pet_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "suite_number" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "occupancy_type" TEXT NOT NULL,
    "pet_name" TEXT NOT NULL,
    "pet_age" TEXT NOT NULL,
    "pet_height" TEXT NOT NULL,
    "pet_color" TEXT NOT NULL,
    "pet_type" TEXT NOT NULL,
    "pet_breed" TEXT NOT NULL,
    "pet_weight" TEXT NOT NULL,
    "distinguishing_marks" TEXT,
    "license_number" TEXT,
    "photos" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_pet_registrations" ("created_at", "distinguishing_marks", "email", "id", "is_active", "license_number", "notes", "occupancy_type", "owner_name", "pet_age", "pet_breed", "pet_color", "pet_height", "pet_name", "pet_type", "pet_weight", "phone_number", "photos", "registration_id", "status", "suite_number", "updated_at") SELECT "created_at", "distinguishing_marks", "email", "id", "is_active", "license_number", "notes", "occupancy_type", "owner_name", "pet_age", "pet_breed", "pet_color", "pet_height", "pet_name", "pet_type", "pet_weight", "phone_number", "photos", "registration_id", "status", "suite_number", "updated_at" FROM "pet_registrations";
DROP TABLE "pet_registrations";
ALTER TABLE "new_pet_registrations" RENAME TO "pet_registrations";
CREATE UNIQUE INDEX "pet_registrations_registration_id_key" ON "pet_registrations"("registration_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
