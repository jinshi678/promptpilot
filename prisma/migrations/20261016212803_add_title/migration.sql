/*
  Warnings:

  - Added the required column `title` to the `PromptSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PromptSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anonUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalInput" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "optimizationLevel" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PromptSession" ("anonUserId", "createdAt", "id", "isMock", "optimizationLevel", "originalInput", "outputFormat", "taskType", "updatedAt") SELECT "anonUserId", "createdAt", "id", "isMock", "optimizationLevel", "originalInput", "outputFormat", "taskType", "updatedAt" FROM "PromptSession";
DROP TABLE "PromptSession";
ALTER TABLE "new_PromptSession" RENAME TO "PromptSession";
CREATE INDEX "PromptSession_anonUserId_createdAt_idx" ON "PromptSession"("anonUserId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
