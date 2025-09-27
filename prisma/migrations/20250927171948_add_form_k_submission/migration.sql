-- CreateTable
CREATE TABLE "form_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "form_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_config" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "form_email_recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "form_config_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "form_email_recipients_form_config_id_fkey" FOREIGN KEY ("form_config_id") REFERENCES "form_configurations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "form_k_submissions" (
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
    "landlord_signature" TEXT,
    "tenant1_signature" TEXT,
    "tenant2_signature" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "form_configurations_form_name_key" ON "form_configurations"("form_name");
