-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COACH', 'PARENT', 'DIRECTOR');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('TRAINING', 'GAME');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "fullName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGuardian" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relation" TEXT,
    "canView" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PlayerGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "type" "SessionType" NOT NULL,
    "opponent" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "periodLabel" TEXT,
    "dribbling" INTEGER NOT NULL,
    "layup" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "closeShot" INTEGER NOT NULL,
    "offense1v1" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "teamwork" INTEGER NOT NULL,
    "attitude" INTEGER NOT NULL,
    "coachComment" TEXT,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanWeekly" (
    "id" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "objectiveTech" TEXT,
    "objectiveGame" TEXT,
    "focusDefense" TEXT,
    "homeSupportTip" TEXT,
    "notes" TEXT,

    CONSTRAINT "PlanWeekly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSession" (
    "id" TEXT NOT NULL,
    "planWeeklyId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "blocksJson" JSONB NOT NULL,
    "keyCorrections" TEXT,

    CONSTRAINT "PlanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGuardian_playerId_userId_key" ON "PlayerGuardian"("playerId", "userId");

-- CreateIndex
CREATE INDEX "Attendance_playerId_idx" ON "Attendance"("playerId");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_idx" ON "Attendance"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_playerId_key" ON "Attendance"("sessionId", "playerId");

-- CreateIndex
CREATE INDEX "Evaluation_playerId_idx" ON "Evaluation"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanWeekly_weekStartDate_key" ON "PlanWeekly"("weekStartDate");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSession" ADD CONSTRAINT "PlanSession_planWeeklyId_fkey" FOREIGN KEY ("planWeeklyId") REFERENCES "PlanWeekly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
