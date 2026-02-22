-- CreateTable
CREATE TABLE "teacher_activities" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_flags" (
    "id" SERIAL NOT NULL,
    "primaryId" INTEGER NOT NULL,
    "duplicateId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "timeDeltaMins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_cache" (
    "id" SERIAL NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_activities_teacherId_idx" ON "teacher_activities"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_activities_activityType_idx" ON "teacher_activities"("activityType");

-- CreateIndex
CREATE INDEX "teacher_activities_createdAt_idx" ON "teacher_activities"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_activities_teacherId_grade_subject_activityType_cre_key" ON "teacher_activities"("teacherId", "grade", "subject", "activityType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "insight_cache_cacheKey_key" ON "insight_cache"("cacheKey");
