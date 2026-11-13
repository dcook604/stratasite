-- CreateTable
CREATE TABLE "resident_info" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submission_id" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_townhouse" BOOLEAN NOT NULL,
    "street_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "resident_info_submission_id_key" ON "resident_info"("submission_id");
