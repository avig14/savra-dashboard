import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTeacherDetail, getAllTeachers, getWeeklyTrend } from "@/lib/data/aggregator";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { ClassSelector } from "@/components/dashboard/ClassSelector";
import { SubjectSelector } from "@/components/dashboard/SubjectSelector";
import { PeriodToggle } from "@/components/dashboard/PeriodToggle";
import { ComparisonBar } from "@/components/dashboard/ComparisonBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { generateTeacherSummary } from "@/lib/ai/summaryGenerator";
import { ActivityChartWrapper } from "@/components/dashboard/ActivityChartWrapper";
import { GradeDistributionWrapper } from "@/components/dashboard/GradeDistributionWrapper";
import { SubjectBreakdownWrapper } from "@/components/dashboard/SubjectBreakdownWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, HelpCircle, FileText } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ grade?: string; subject?: string; period?: string }>;
}

export default async function TeacherDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { grade: gradeParam, subject: subjectParam, period = "month" } = await searchParams;
  const gradeFilter   = gradeParam   ? parseInt(gradeParam, 10) : undefined;
  const subjectFilter = subjectParam || undefined;

  const [detail, allTeachers, trends] = await Promise.all([
    getTeacherDetail(id, gradeFilter, subjectFilter, period),
    getAllTeachers(),
    getWeeklyTrend(id, gradeFilter, subjectFilter, period),
  ]);

  if (!detail) notFound();

  const schoolAvg =
    allTeachers.length > 0
      ? allTeachers.reduce((s, t) => s + t.totalActivities, 0) / allTeachers.length
      : 0;

  // Server-side insight — synchronous, filter-aware, zero latency
  const teacherInsight = generateTeacherSummary(
    detail,
    schoolAvg,
    gradeFilter,
    subjectFilter,
    period
  );

  return (
    <div className="space-y-6">
      {/* Back button + Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="-ml-2 shrink-0">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {detail.teacherName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {detail.subjects.join(" · ")} ·{" "}
              {detail.grades.map((g) => `Class ${g}`).join(", ")}
            </p>
          </div>
        </div>

        {/* Class · Subject · Period filters */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Suspense fallback={<Skeleton className="h-8 w-36" />}>
            <ClassSelector grades={detail.grades} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-8 w-44" />}>
            <SubjectSelector subjects={detail.subjects} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-9 w-64" />}>
            <PeriodToggle />
          </Suspense>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricsCard
          title="Lessons Created"
          value={detail.lessonPlans}
          icon={BookOpen}
          iconColor="text-rose-600"
          iconBg="bg-rose-100"
          className="bg-gradient-to-br from-rose-50 to-rose-50/60 border-rose-100"
        />
        <MetricsCard
          title="Quizzes Conducted"
          value={detail.quizzes}
          icon={HelpCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          className="bg-gradient-to-br from-emerald-50 to-emerald-50/60 border-emerald-100"
        />
        <MetricsCard
          title="Assessments Assigned"
          value={detail.questionPapers}
          icon={FileText}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          className="bg-gradient-to-br from-orange-50 to-orange-50/60 border-orange-100"
        />
      </div>

      {/* Weekly Activity Chart — Client wrapper handles ssr:false */}
      <ActivityChartWrapper
        data={trends}
        title={`${detail.teacherName}'s Activity Trend`}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class-wise Breakdown — PRD exact label */}
        <GradeDistributionWrapper data={detail.gradeBreakdown} />

        {/* Subject Distribution Pie */}
        <SubjectBreakdownWrapper data={detail.subjectBreakdown} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* School comparison */}
        <ComparisonBar
          teacherName={detail.teacherName}
          teacherTotal={detail.totalActivities}
          schoolAvg={schoolAvg}
          vsPercent={detail.vsSchoolAvgPercent}
        />

        {/* AI Insight Panel */}
        <InsightPanel insight={teacherInsight} />
      </div>

      {/* Recent Activity Table */}
      <RecentActivity
        activities={detail.recentActivities}
        teacherName={detail.teacherName}
      />
    </div>
  );
}
