-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "functionType" TEXT,
    "aliasNames" TEXT NOT NULL DEFAULT '[]',
    "shortCode" TEXT,
    "description" TEXT,
    "sizeMin" INTEGER NOT NULL DEFAULT 6,
    "sizeMax" INTEGER NOT NULL DEFAULT 40,
    "sizeStep" INTEGER NOT NULL DEFAULT 2,
    "commonSizes" TEXT NOT NULL DEFAULT '[10,12,14,16,18,20]',
    "priceFormula" TEXT,
    "hasExtra" BOOLEAN NOT NULL DEFAULT false,
    "extraPart" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT '普通',
    "contactPerson" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "firstOrderDate" DATETIME,
    "lastOrderDate" DATETIME,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '活跃',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerPackaging" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "outerBox" TEXT,
    "innerBag" TEXT,
    "piecesPerBox" INTEGER NOT NULL DEFAULT 20,
    "labelRequirement" TEXT,
    "packingRequirement" TEXT,
    "hasScrews" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "CustomerPackaging_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerPackaging_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerPrice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "sizeInch" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "CustomerPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "customerType" TEXT NOT NULL DEFAULT '老客户',
    "orderDate" DATETIME NOT NULL,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT '新订单',
    "totalPieces" INTEGER NOT NULL DEFAULT 0,
    "totalPairs" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "feishuUrl" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "actualProductId" INTEGER,
    "labelProductId" INTEGER,
    "piecesPerBox" INTEGER NOT NULL DEFAULT 20,
    "outerBox" TEXT,
    "innerBag" TEXT,
    "labelRequirement" TEXT,
    "packingRequirement" TEXT,
    "notes" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderSizeDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderItemId" INTEGER NOT NULL,
    "sizeInch" INTEGER NOT NULL,
    "pieces" INTEGER NOT NULL,
    "pairs" INTEGER NOT NULL,
    CONSTRAINT "OrderSizeDetail_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "shipDate" DATETIME NOT NULL,
    "piecesShipped" INTEGER NOT NULL,
    "shipType" TEXT NOT NULL,
    "deliveryNoteNo" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemType" TEXT NOT NULL,
    "productId" INTEGER,
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
    CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inventoryId" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "beforeQty" INTEGER NOT NULL,
    "afterQty" INTEGER NOT NULL,
    "relatedOrderNo" TEXT,
    "operator" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLog_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrumInventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "sizeInch" INTEGER NOT NULL,
    "currentBarrels" INTEGER NOT NULL DEFAULT 0,
    "capacityPerBarrel" INTEGER NOT NULL DEFAULT 0,
    "totalPieces" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '充足',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DrumInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabelInventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "safeStock" INTEGER NOT NULL DEFAULT 0,
    "onOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '充足',
    "lastOrderDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actionType" TEXT NOT NULL,
    "actionDetail" TEXT,
    "operator" TEXT NOT NULL,
    "relatedOrderNo" TEXT,
    "result" TEXT NOT NULL DEFAULT '成功',
    "errorMsg" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Product_modelName_key" ON "Product"("modelName");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPackaging_customerId_productId_key" ON "CustomerPackaging"("customerId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPrice_customerId_productId_sizeInch_key" ON "CustomerPrice"("customerId", "productId", "sizeInch");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "DrumInventory_productId_sizeInch_key" ON "DrumInventory"("productId", "sizeInch");

-- CreateIndex
CREATE UNIQUE INDEX "LabelInventory_brand_key" ON "LabelInventory"("brand");
