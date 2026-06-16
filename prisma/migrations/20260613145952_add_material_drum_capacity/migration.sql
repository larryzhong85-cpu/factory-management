-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "unit" TEXT NOT NULL DEFAULT '件',
    "spec" TEXT,
    "brand" TEXT,
    "price" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DrumCapacityRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sizeInch" INTEGER NOT NULL,
    "capacityPerBarrel" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemType" TEXT NOT NULL,
    "productId" INTEGER,
    "materialId" INTEGER,
    "itemName" TEXT NOT NULL,
    "sizeInch" INTEGER,
    "brand" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '件',
    "safeStock" INTEGER NOT NULL DEFAULT 0,
    "warnThreshold" INTEGER,
    "status" TEXT NOT NULL DEFAULT '充足',
    "lastInDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inventory_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inventory" ("brand", "createdAt", "id", "itemName", "itemType", "lastInDate", "notes", "productId", "quantity", "safeStock", "sizeInch", "status", "unit", "updatedAt", "warnThreshold") SELECT "brand", "createdAt", "id", "itemName", "itemType", "lastInDate", "notes", "productId", "quantity", "safeStock", "sizeInch", "status", "unit", "updatedAt", "warnThreshold" FROM "Inventory";
DROP TABLE "Inventory";
ALTER TABLE "new_Inventory" RENAME TO "Inventory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Material_materialCode_key" ON "Material"("materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "DrumCapacityRule_sizeInch_key" ON "DrumCapacityRule"("sizeInch");
