CREATE TABLE IF NOT EXISTS "parametros" (
  "id" INTEGER NOT NULL,
  "chave" TEXT NOT NULL,
  "valor" TEXT NULL,
  "createdDate" DATETIME NOT NULL,
  "updatedDate" DATETIME NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);
