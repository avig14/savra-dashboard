import { Suspense } from "react";
import { getOverviewStats, getAllTeachers, getWeeklyTrend } from "@/lib/data/aggregator";
import { prisma } from "@/lib/db";
import { detectNearDuplicates } from "@/lib/data/deduplicator";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { GradeFilter } from "@/components/dashboard/GradeFilter";
import { SubjectFilter } from "@/components/dashboard/SubjectFilter";
import { PeriodToggle } from "@/components/dashboard/PeriodToggle";
import { DataQualityBanner } from "@/components/dashboard/DataQualityBanner";
import { AIPulseSummary } from "@/components/dashboard/AIPulseSummary";
import { generateOverviewSummary } from "@/lib/ai/summaryGenerator";
import { ActivityChartWrapper } from "@/components/dashboard/ActivityChartWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  Send,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    grade?: string;
    subject?: string;
    period?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { grade, subject, period = "month" } = await searchParams;

  // Parse filters — "all" or empty = no filter applied
  const gradeFilter =
    grade && grade !== "all" ? parseInt(grade, 10) : undefined;
  const subjectFilter =
    subject && subject !== "all" ? subject : undefined;

  // Parallel fetch — all data scoped by active filters
  const [overview, teachers, trends, allActivities] = await Promise.all([
    getOverviewStats(gradeFilter, subjectFilter, period),
    getAllTeachers(gradeFilter, subjectFilter, period),
    getWeeklyTrend(undefined, gradeFilter, subjectFilter, period),
    // Unfiltered — duplicate detection always shows all 4 groups
    prisma.teacherActivity.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  // Near-duplicate groups for the Data Quality Banner
  const duplicateGroups = detectNearDuplicates(allActivities).map((g) => ({
    groupKey: g.groupKey,
    teacherName: g.teacherName,
    grade: g.grade,
    subject: g.subject,
    activityType: g.activityType,
    date: g.date,
    recordCount: g.records.length,
    timeDeltaMinutes: g.timeDeltaMinutes,
    explanation: `${g.teacherName} created ${g.records.length} ${g.activityType} entries for Class ${g.grade} ${g.subject} on ${g.date} — ${g.timeDeltaMinutes} min apart.`,
  }));

  // Server-side summary — synchronous, filter-aware, zero latency
  const overviewInsight = generateOverviewSummary(
    overview,
    teachers,
    gradeFilter,
    subjectFilter,
    period
  );

  // Period label for metric card subtitle
  const periodLabel =
    period === "week"
      ? "This week"
      : period === "month"
      ? "This month"
      : "This year";

  return (
    <div className="space-y-6">
      {/* ── Page Header — matches PRD: title left, Grade + Subject filters right ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Admin Companion
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            See What&apos;s Happening Across Your School
          </p>
        </div>

        {/* Grade + Subject dropdowns (PRD top-right position) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Suspense fallback={<Skeleton className="h-9 w-36 rounded-full" />}>
            <GradeFilter />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-9 w-40 rounded-full" />}>
            <SubjectFilter />
          </Suspense>
        </div>
      </div>

      {/* Data Quality Banner — Hidden Twist */}
      {duplicateGroups.length > 0 && (
        <DataQualityBanner duplicateGroups={duplicateGroups} />
      )}

      {/* ── Insights section header — "Insights" left, period toggle right ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Insights</h2>
        <Suspense fallback={<Skeleton className="h-9 w-64 rounded-lg" />}>
          <PeriodToggle />
        </Suspense>
      </div>

      {/* 5 Metric Cards — PRD exact labels */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricsCard
          title="Active Teachers"
          value={overview.activeTeachers}
          icon={Users}
          iconColor="text-rose-600"
          iconBg="bg-rose-200"
          className="bg-gradient-to-br from-rose-50 to-rose-50/60 border-rose-200"
          subtitle={periodLabel}
        />
        <MetricsCard
          title="Lessons Created"
          value={overview.totalLessons}
          icon={BookOpen}
          iconColor="text-green-700"
          iconBg="bg-green-200"
          className="bg-gradient-to-br from-green-50 to-green-50/60 border-green-200"
          subtitle={periodLabel}
        />
        <MetricsCard
          title="Assessments Made"
          value={overview.totalAssessments}
          icon={FileText}
          iconColor="text-orange-600"
          iconBg="bg-orange-200"
          className="bg-gradient-to-br from-orange-50 to-orange-50/60 border-orange-200"
          subtitle={periodLabel}
        />
        <MetricsCard
          title="Quizzes Conducted"
          value={overview.totalQuizzes}
          icon={HelpCircle}
          iconColor="text-yellow-700"
          iconBg="bg-yellow-200"
          className="bg-gradient-to-br from-yellow-50 to-yellow-50/60 border-yellow-200"
          subtitle={periodLabel}
        />
        <MetricsCard
          title="Submission Rate"
          value="—"
          icon={Send}
          iconColor="text-pink-500"
          iconBg="bg-pink-200"
          className="bg-gradient-to-br from-pink-50 to-pink-50/60 border-pink-200"
          subtitle="No submission data"
        />
      </div>

      {/* Weekly Activity Chart — Client wrapper handles ssr:false */}
      <ActivityChartWrapper data={trends} title="Weekly Activity" />

      {/* AI Pulse Summary — PRD Bonus */}
      <AIPulseSummary insight={overviewInsight} />
    </div>
  );
}
