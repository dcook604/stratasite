-- CreateTable
CREATE TABLE "storage_lockers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locker_number" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "dimensions" TEXT NOT NULL,
    "monthly_rent" REAL NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "storage_locker_applications" (
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
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "storage_locker_applications_locker_id_fkey" FOREIGN KEY ("locker_id") REFERENCES "storage_lockers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "storage_lockers_locker_number_key" ON "storage_lockers"("locker_number");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locker_applications_application_id_key" ON "storage_locker_applications"("application_id");
