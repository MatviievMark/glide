
-- First add the new column as nullable
ALTER TABLE "User" ADD COLUMN "canvasUrl" TEXT;

-- Copy data from schoolName to canvasUrl
UPDATE "User" SET "canvasUrl" = 'https://' || "schoolName" || '.instructure.com';

-- Make canvasUrl NOT NULL
ALTER TABLE "User" ALTER COLUMN "canvasUrl" SET NOT NULL;

-- Drop the old column
ALTER TABLE "User" DROP COLUMN "schoolName";
