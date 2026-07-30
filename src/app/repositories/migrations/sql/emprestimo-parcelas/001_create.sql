PRAGMA foreign_keys = OFF;
CREATE TABLE IF NOT EXISTS "emprestimo_parcelas" ("id" INTEGER NOT NULL,"emprestimoId" INTEGER NOT NULL REFERENCES "emprestimos" ("id"),"numero" INTEGER NOT NULL,"valor" REAL NULL DEFAULT NULL,"dataVencimento" DATETIME NOT NULL,"pago" INTEGER NULL DEFAULT 0,"dataPagamento" DATETIME NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));
PRAGMA foreign_keys = ON;
