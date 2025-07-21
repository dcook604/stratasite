/*
  Warnings:

  - You are about to drop the column `recaptcha_token` on the `marketplace_posts` table. All the data in the column will be lost.
  - You are about to drop the column `recaptcha_token` on the `marketplace_replies` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "scooter_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration_id" TEXT NOT NULL,
    "registration_date" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "number_of_scooters" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "owner_names" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "key_number" TEXT,
    "deposit_paid" BOOLEAN NOT NULL DEFAULT false,
    "deposit_amount" REAL NOT NULL DEFAULT 50.0,
    "notes" TEXT,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ac_inquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inquiry_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "owner_unit" TEXT NOT NULL,
    "owner_phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_multi_zone" BOOLEAN NOT NULL DEFAULT false,
    "best_contact_method" TEXT NOT NULL,
    "installation_timing" TEXT NOT NULL,
    "notes" TEXT,
    "consent_given" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "storage_rentals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rental_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "best_contact_method" TEXT NOT NULL,
    "interested_in_info" BOOLEAN NOT NULL,
    "consent_given" BOOLEAN NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contact_id" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "strata_lot_number" TEXT NOT NULL,
    "registered_owner_names" TEXT NOT NULL,
    "owner_email" TEXT,
    "phone_home" TEXT,
    "phone_business" TEXT,
    "phone_other" TEXT,
    "phone_other_specify" TEXT,
    "non_resident_address" TEXT,
    "non_resident_phone" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_address" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_email" TEXT,
    "allow_management_access" TEXT NOT NULL,
    "concierge_key_provided" TEXT NOT NULL,
    "date_provided_to_concierge" TEXT,
    "security_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pet_registrations" (
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
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_marketplace_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" REAL,
    "author_id" TEXT NOT NULL DEFAULT 'legacy-user',
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "author_phone" TEXT,
    "is_sold" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT,
    "turnstile_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_marketplace_posts" ("author_email", "author_name", "author_phone", "category", "created_at", "description", "id", "images", "is_active", "is_sold", "price", "title", "type", "updated_at") SELECT "author_email", "author_name", "author_phone", "category", "created_at", "description", "id", "images", "is_active", "is_sold", "price", "title", "type", "updated_at" FROM "marketplace_posts";
DROP TABLE "marketplace_posts";
ALTER TABLE "new_marketplace_posts" RENAME TO "marketplace_posts";
CREATE TABLE "new_marketplace_replies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL DEFAULT 'legacy-user',
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "author_phone" TEXT,
    "post_id" TEXT NOT NULL,
    "images" TEXT,
    "turnstile_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_replies_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "marketplace_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_marketplace_replies" ("author_email", "author_name", "author_phone", "content", "created_at", "id", "images", "post_id") SELECT "author_email", "author_name", "author_phone", "content", "created_at", "id", "images", "post_id" FROM "marketplace_replies";
DROP TABLE "marketplace_replies";
ALTER TABLE "new_marketplace_replies" RENAME TO "marketplace_replies";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "scooter_registrations_registration_id_key" ON "scooter_registrations"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "ac_inquiries_inquiry_id_key" ON "ac_inquiries"("inquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_rentals_rental_id_key" ON "storage_rentals"("rental_id");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_contacts_contact_id_key" ON "emergency_contacts"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "pet_registrations_registration_id_key" ON "pet_registrations"("registration_id");
