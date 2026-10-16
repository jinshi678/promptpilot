-- CreateTable
CREATE TABLE "PromptSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anonUserId" TEXT NOT NULL,
    "originalInput" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "optimizationLevel" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "revisionNotes" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptVersion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PromptSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PromptSession_anonUserId_createdAt_idx" ON "PromptSession"("anonUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PromptVersion_sessionId_versionNumber_idx" ON "PromptVersion"("sessionId", "versionNumber");
