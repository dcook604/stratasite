-- CreateTable
CREATE TABLE "incident_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incident_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL',
    "body" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "emailed_to_reporter" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incident_notes_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incident_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incident_id" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incident_status_history_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_incident_reports" (
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
    "police_case_number" TEXT,
    "bylaw_violation" BOOLEAN NOT NULL DEFAULT false,
    "common_property_damage" BOOLEAN NOT NULL DEFAULT false,
    "has_evidence" BOOLEAN NOT NULL DEFAULT false,
    "evidence_files" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "resolved_at" DATETIME,
    "resolution" TEXT,
    "notify_reporter" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_incident_reports" ("bylaw_violation", "common_property_damage", "created_at", "email_sent", "evidence_files", "has_evidence", "id", "incident_date", "incident_description", "incident_id", "incident_location", "incident_time", "incident_title", "is_active", "police_attended", "police_case_number", "reporter_email", "reporter_name", "reporter_phone", "unit_number", "updated_at") SELECT "bylaw_violation", "common_property_damage", "created_at", "email_sent", "evidence_files", "has_evidence", "id", "incident_date", "incident_description", "incident_id", "incident_location", "incident_time", "incident_title", "is_active", "police_attended", "police_case_number", "reporter_email", "reporter_name", "reporter_phone", "unit_number", "updated_at" FROM "incident_reports";
DROP TABLE "incident_reports";
ALTER TABLE "new_incident_reports" RENAME TO "incident_reports";
CREATE UNIQUE INDEX "incident_reports_incident_id_key" ON "incident_reports"("incident_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
