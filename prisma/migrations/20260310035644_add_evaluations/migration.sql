/*
  Warnings:

  - You are about to drop the column `closeShot` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `coachComment` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `layup` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `offense1v1` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `periodLabel` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `teamwork` on the `Evaluation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Evaluation_playerId_idx";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "closeShot",
DROP COLUMN "coachComment",
DROP COLUMN "layup",
DROP COLUMN "offense1v1",
DROP COLUMN "periodLabel",
DROP COLUMN "teamwork",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "decisionMaking" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "evaluatorUserId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "shooting" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Evaluation_playerId_date_idx" ON "Evaluation"("playerId", "date");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorUserId_idx" ON "Evaluation"("evaluatorUserId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorUserId_fkey" FOREIGN KEY ("evaluatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
