-- Speeds up per-user, per-product aggregation queries
-- (used by /api/bottles/inventory GROUP BY productId under WHERE userId).
-- This is a non-destructive additive index: no rows are modified.

-- CreateIndex
CREATE INDEX "Bottle_userId_productId_idx" ON "Bottle"("userId", "productId");
