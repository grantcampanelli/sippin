-- CreateEnum
CREATE TYPE "BrandType" AS ENUM ('WINE', 'SPIRIT', 'BEER');

-- CreateEnum
CREATE TYPE "StashType" AS ENUM ('WINE_CELLAR', 'LIQUOR_CABINET', 'BAR', 'REFRIGERATOR', 'FRIDGE', 'GENERAL_STORAGE', 'DISPLAY_CABINET');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BrandType" NOT NULL,
    "country" TEXT,
    "website" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "barcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WineProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vintage" TEXT,
    "varietal" TEXT,
    "region" TEXT,
    "appellation" TEXT,
    "style" TEXT,
    "sweetness" TEXT,
    "abv" DOUBLE PRECISION,
    "producer" TEXT,
    "vineyard" TEXT,

    CONSTRAINT "WineProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpiritProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ageStatement" TEXT,
    "distillery" TEXT,
    "caskType" TEXT,
    "mashBill" TEXT,
    "proof" DOUBLE PRECISION,
    "abv" DOUBLE PRECISION,
    "region" TEXT,
    "style" TEXT,
    "finish" TEXT,
    "batchNumber" TEXT,
    "releaseYear" INTEGER,
    "barrelNumber" TEXT,

    CONSTRAINT "SpiritProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bottle" (
    "id" TEXT NOT NULL,
    "size" DOUBLE PRECISION,
    "sizeUnit" TEXT DEFAULT 'ml',
    "servingSize" DOUBLE PRECISION,
    "purchasePrice" DOUBLE PRECISION,
    "purchaseCurrency" TEXT DEFAULT 'USD',
    "purchaseDate" TIMESTAMP(3),
    "purchaseLocation" TEXT,
    "openDate" TIMESTAMP(3),
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "finishDate" TIMESTAMP(3),
    "amountRemaining" DOUBLE PRECISION,
    "notes" TEXT,
    "rating" INTEGER,
    "imageUrl" TEXT,
    "barcode" TEXT,
    "giftFrom" TEXT,
    "giftOccasion" TEXT,
    "giftDate" TIMESTAMP(3),
    "estimatedValue" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bottle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stash" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" "StashType" NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER,
    "capacity" INTEGER,
    "temp" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "description" TEXT,
    "stashId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfItem" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "bottleId" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShelfItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Brand_type_idx" ON "Brand"("type");

-- CreateIndex
CREATE INDEX "Brand_name_idx" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WineProduct_productId_key" ON "WineProduct"("productId");

-- CreateIndex
CREATE INDEX "WineProduct_vintage_idx" ON "WineProduct"("vintage");

-- CreateIndex
CREATE INDEX "WineProduct_varietal_idx" ON "WineProduct"("varietal");

-- CreateIndex
CREATE INDEX "WineProduct_region_idx" ON "WineProduct"("region");

-- CreateIndex
CREATE INDEX "WineProduct_style_idx" ON "WineProduct"("style");

-- CreateIndex
CREATE UNIQUE INDEX "SpiritProduct_productId_key" ON "SpiritProduct"("productId");

-- CreateIndex
CREATE INDEX "SpiritProduct_distillery_idx" ON "SpiritProduct"("distillery");

-- CreateIndex
CREATE INDEX "SpiritProduct_region_idx" ON "SpiritProduct"("region");

-- CreateIndex
CREATE INDEX "SpiritProduct_style_idx" ON "SpiritProduct"("style");

-- CreateIndex
CREATE INDEX "SpiritProduct_ageStatement_idx" ON "SpiritProduct"("ageStatement");

-- CreateIndex
CREATE INDEX "Bottle_userId_idx" ON "Bottle"("userId");

-- CreateIndex
CREATE INDEX "Bottle_userId_finished_idx" ON "Bottle"("userId", "finished");

-- CreateIndex
CREATE INDEX "Bottle_productId_idx" ON "Bottle"("productId");

-- CreateIndex
CREATE INDEX "Bottle_finished_idx" ON "Bottle"("finished");

-- CreateIndex
CREATE INDEX "Bottle_purchaseDate_idx" ON "Bottle"("purchaseDate");

-- CreateIndex
CREATE INDEX "Stash_userId_idx" ON "Stash"("userId");

-- CreateIndex
CREATE INDEX "Stash_userId_type_idx" ON "Stash"("userId", "type");

-- CreateIndex
CREATE INDEX "Stash_userId_archived_idx" ON "Stash"("userId", "archived");

-- CreateIndex
CREATE INDEX "Shelf_stashId_idx" ON "Shelf"("stashId");

-- CreateIndex
CREATE INDEX "Shelf_stashId_order_idx" ON "Shelf"("stashId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfItem_bottleId_key" ON "ShelfItem"("bottleId");

-- CreateIndex
CREATE INDEX "ShelfItem_shelfId_idx" ON "ShelfItem"("shelfId");

-- CreateIndex
CREATE INDEX "ShelfItem_shelfId_order_idx" ON "ShelfItem"("shelfId", "order");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WineProduct" ADD CONSTRAINT "WineProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpiritProduct" ADD CONSTRAINT "SpiritProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bottle" ADD CONSTRAINT "Bottle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bottle" ADD CONSTRAINT "Bottle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stash" ADD CONSTRAINT "Stash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelf" ADD CONSTRAINT "Shelf_stashId_fkey" FOREIGN KEY ("stashId") REFERENCES "Stash"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfItem" ADD CONSTRAINT "ShelfItem_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "Bottle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfItem" ADD CONSTRAINT "ShelfItem_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
