-- AlterTable
ALTER TABLE "marketplace_replies" ADD COLUMN "author_phone" TEXT;
ALTER TABLE "marketplace_replies" ADD COLUMN "images" TEXT;
ALTER TABLE "marketplace_replies" ADD COLUMN "recaptcha_token" TEXT;

-- CreateTable
CREATE TABLE "EventRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventDescription" TEXT,
    "requestedDateTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
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
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "author_phone" TEXT,
    "is_sold" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT,
    "recaptcha_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_marketplace_posts" ("author_email", "author_name", "category", "created_at", "description", "id", "is_active", "price", "title", "type", "updated_at") SELECT "author_email", "author_name", "category", "created_at", "description", "id", "is_active", "price", "title", "type", "updated_at" FROM "marketplace_posts";
DROP TABLE "marketplace_posts";
ALTER TABLE "new_marketplace_posts" RENAME TO "marketplace_posts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
