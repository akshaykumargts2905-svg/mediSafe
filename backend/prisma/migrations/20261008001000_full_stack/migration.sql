BEGIN;

-- Convert severity in place; unknown legacy labels fail safely instead of losing data.
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR');

-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'PATIENT';

-- AlterTable
ALTER TABLE "OCRResult" ADD COLUMN     "candidates" JSONB,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "inputMethod" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "reviewVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dosageForm" TEXT,
ADD COLUMN     "strength" TEXT;

-- AlterTable
ALTER TABLE "DrugDrugInteraction" ADD COLUMN     "descriptionHi" TEXT,
ADD COLUMN     "recommendationHi" TEXT,
ADD COLUMN     "risk" TEXT,
ADD COLUMN     "riskHi" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ALTER COLUMN "severity" TYPE "InteractionSeverity" USING (CASE UPPER("severity") WHEN 'MAJOR' THEN 'HIGH' WHEN 'SEVERE' THEN 'HIGH' WHEN 'MEDIUM' THEN 'MODERATE' WHEN 'MINOR' THEN 'LOW' ELSE UPPER("severity") END)::"InteractionSeverity";

-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "nameHi" TEXT;

-- AlterTable
ALTER TABLE "DrugFoodInteraction" ADD COLUMN     "descriptionHi" TEXT,
ADD COLUMN     "recommendationHi" TEXT,
ADD COLUMN     "risk" TEXT,
ADD COLUMN     "riskHi" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ALTER COLUMN "severity" TYPE "InteractionSeverity" USING (CASE UPPER("severity") WHEN 'MAJOR' THEN 'HIGH' WHEN 'SEVERE' THEN 'HIGH' WHEN 'MEDIUM' THEN 'MODERATE' WHEN 'MINOR' THEN 'LOW' ELSE UPPER("severity") END)::"InteractionSeverity";

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "messageHi" TEXT,
ADD COLUMN     "recommendation" TEXT,
ADD COLUMN     "recommendationHi" TEXT,
ADD COLUMN     "risk" TEXT,
ADD COLUMN     "riskHi" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ALTER COLUMN "severity" TYPE "InteractionSeverity" USING (CASE UPPER("severity") WHEN 'MAJOR' THEN 'HIGH' WHEN 'SEVERE' THEN 'HIGH' WHEN 'MEDIUM' THEN 'MODERATE' WHEN 'MINOR' THEN 'LOW' ELSE UPPER("severity") END)::"InteractionSeverity";

-- AlterTable
ALTER TABLE "DoctorRecommendation" ADD COLUMN     "alternativeHi" TEXT,
ADD COLUMN     "reasonHi" TEXT;

-- CreateTable
CREATE TABLE "CareAccess" (
    "patientId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareAccess_pkey" PRIMARY KEY ("patientId","doctorId")
);

-- CreateTable
CREATE TABLE "PrescriptionImage" (
    "prescriptionId" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,

    CONSTRAINT "PrescriptionImage_pkey" PRIMARY KEY ("prescriptionId")
);

-- CreateTable
CREATE TABLE "AlternativeMedicine" (
    "id" SERIAL NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "alternativeMedicineId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonHi" TEXT,
    "sourceUrl" TEXT NOT NULL,

    CONSTRAINT "AlternativeMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareAccess_doctorId_idx" ON "CareAccess"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativeMedicine_medicineId_alternativeMedicineId_key" ON "AlternativeMedicine"("medicineId", "alternativeMedicineId");

-- AddForeignKey
ALTER TABLE "CareAccess" ADD CONSTRAINT "CareAccess_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAccess" ADD CONSTRAINT "CareAccess_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionImage" ADD CONSTRAINT "PrescriptionImage_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeMedicine" ADD CONSTRAINT "AlternativeMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeMedicine" ADD CONSTRAINT "AlternativeMedicine_alternativeMedicineId_fkey" FOREIGN KEY ("alternativeMedicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CareAccess" ADD CONSTRAINT "CareAccess_distinct_users" CHECK ("patientId" <> "doctorId");
ALTER TABLE "AlternativeMedicine" ADD CONSTRAINT "AlternativeMedicine_distinct_medicines" CHECK ("medicineId" <> "alternativeMedicineId");
COMMIT;
