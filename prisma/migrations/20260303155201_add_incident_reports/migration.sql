-- CreateTable
CREATE TABLE "incident_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incident_id" TEXT NOT NULL,
    "reporter_name" TEXT NOT NULL,
    "reporter_email" TEXT NOT NULL,
    "reporter_phone" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "incident_date" TEXT NOT NULL,
    "incident_time" TEXT NOT NULL,
    "incident_location" TEXT NOT NULL,
    "incident_title" TEXT NOT NULL,
    "incident_description" TEXT NOT NULL,
    "police_attended" BOOLEAN NOT NULL DEFAULT false,
    "common_property_damage" BOOLEAN NOT NULL DEFAULT false,
    "has_evidence" BOOLEAN NOT NULL DEFAULT false,
    "evidence_files" TEXT,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "incident_reports_incident_id_key" ON "incident_reports"("incident_id");
