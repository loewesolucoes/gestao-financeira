CREATE TABLE IF NOT EXISTS "metas" (
  "id" INTEGER NOT NULL,
  "data" DATETIME NOT NULL,
  "descricao" TEXT NULL DEFAULT NULL,
  "comentario" TEXT NULL,
  "tipo" INTEGER NULL,
  "done" INTEGER NULL,
  "createdDate" DATETIME NOT NULL,
  "updatedDate" DATETIME NULL DEFAULT NULL,
  PRIMARY KEY ("id")
);
