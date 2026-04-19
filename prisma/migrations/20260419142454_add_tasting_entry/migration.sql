-- Additive: creates a new table with a FK to Bottle. No existing data touched.

-- CreateTable
CREATE TABLE "TastingEntry" (
    "id" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "tastedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nose" TEXT,
    "palate" TEXT,
    "finish" TEXT,
    "rating" INTEGER,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TastingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TastingEntry_bottleId_tastedAt_idx" ON "TastingEntry"("bottleId", "tastedAt");

-- AddForeignKey
ALTER TABLE "TastingEntry" ADD CONSTRAINT "TastingEntry_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "Bottle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
