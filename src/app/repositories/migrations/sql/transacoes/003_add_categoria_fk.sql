PRAGMA foreign_keys = OFF;

ALTER TABLE "transacoes"
  ADD COLUMN "categoriaId" INTEGER NOT NULL REFERENCES "categoria_transacoes" ("id") DEFAULT 1;

PRAGMA foreign_keys = ON;
