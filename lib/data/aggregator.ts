import { prisma } from "@/lib/db";
import type {
  OverviewStats,
  TeacherDetail,
  TeacherSummary,
} from "@/types/activity";
import type { TrendPoint } from "@/types/charts";

// ─── Period helper ────────────────────────────────────────────────────────

/**
 * Returns the start Date for a given period string.
 * "week"  → Monday of the current calendar week
 * "month" → 1st of the current month
 * "year"  → January 1st of the current year
 */
function getPeriodStart(period: string): Date {
  const now = new Date();
  if (period === "week") {
    const day = now.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
    const diff = now.getDate() - (day === 0 ? 6 : day - 1); // back to Monday
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1); // "year"
}

// ─── Overview ────────────────────────────────────────────────────────────

export async function getOverviewStats(
  gradeFilter?: number,
  subjectFilter?: string,
  period?: string
): Promise<OverviewStats> {
  const where: Record<string, unknown> = {};
  if (gradeFilter) where.grade = gradeFilter;
  if (subjectFilter) where.subject = subjectFilter;
  if (period) where.createdAt = { gte: getPeriodStart(period) };

  const [activities, dupCount] = await Promise.all([
    prisma.teacherActivity.findMany({ where }),
    prisma.duplicateFlag.count(),
  ]);

  const teacherMap = new Map<string, { name: string; total: number }>();
  let lessons = 0;
  let quizzes = 0;
  let assessments = 0;

  for (const a of activities) {
    if (!teacherMap.has(a.teacherId)) {
      teacherMap.set(a.teacherId, { name: a.teacherName, total: 0 });
    }
    teacherMap.get(a.teacherId)!.total++;

    if (a.activityType === "Lesson Plan") lessons++;
    else if (a.activityType === "Quiz") quizzes++;
    else if (a.activityType === "Question Paper") assessments++;
  }

  const teachers = [...teacherMap.values()];
  const totalActivities = activities.length;
  const schoolAvg = teachers.length ? totalActivities / teachers.length : 0;

  const topPerformer = teachers.reduce(
    (best, t) => (!best || t.total > best.total ? t : best),
    null as { name: string; total: number } | null
  );

  return {
    activeTeachers: teacherMap.size,
    totalLessons: lessons,
    totalAssessments: assessments,
    totalQuizzes: quizzes,
    duplicatesDetected: dupCount,
    topPerformer: topPerformer
      ? { name: topPerformer.name, total: topPerformer.total }
      : null,
    schoolAvg,
  };
}

// ─── All teachers summary ─────────────────────────────────────────────────

export async function getAllTeachers(
  gradeFilter?: number,
  subjectFilter?: string,
  period?: string
): Promise<TeacherSummary[]> {
  const where: Record<string, unknown> = {};
  if (gradeFilter) where.grade = gradeFilter;
  if (subjectFilter) where.subject = subjectFilter;
  if (period) where.createdAt = { gte: getPeriodStart(period) };

  const activities = await prisma.teacherActivity.findMany({
    where,
    orderBy: { teacherName: "asc" },
  });

  const map = new Map<
    string,
    {
      name: string;
      subjects: Set<string>;
      grades: Set<number>;
      lessons: number;
      quizzes: number;
      papers: number;
    }
  >();

  for (const a of activities) {
    if (!map.has(a.teacherId)) {
      map.set(a.teacherId, {
        name: a.teacherName,
        subjects: new Set(),
        grades: new Set(),
        lessons: 0,
        quizzes: 0,
        papers: 0,
      });
    }
    const entry = map.get(a.teacherId)!;
    entry.subjects.add(a.subject);
    entry.grades.add(a.grade);
    if (a.activityType === "Lesson Plan") entry.lessons++;
    else if (a.activityType === "Quiz") entry.quizzes++;
    else if (a.activityType === "Question Paper") entry.papers++;
  }

  const summaries: TeacherSummary[] = [...map.entries()].map(([id, e]) => ({
    teacherId: id,
    teacherName: e.name,
    subjects: [...e.subjects].sort(),
    grades: [...e.grades].sort((a, b) => a - b),
    lessonPlans: e.lessons,
    quizzes: e.quizzes,
    questionPapers: e.papers,
    totalActivities: e.lessons + e.quizzes + e.papers,
    vsSchoolAvgPercent: 0, // filled below
  }));

  const schoolAvg =
    summaries.length
      ? summaries.reduce((s, t) => s + t.totalActivities, 0) / summaries.length
      : 0;

  for (const s of summaries) {
    s.vsSchoolAvgPercent = schoolAvg
      ? ((s.totalActivities - schoolAvg) / schoolAvg) * 100
      : 0;
  }

  return summaries;
}

// ─── Single teacher detail ────────────────────────────────────────────────

export async function getTeacherDetail(
  teacherId: string,
  gradeFilter?: number,
  subjectFilter?: string,
  period?: string
): Promise<TeacherDetail | null> {
  const allActivities = await prisma.teacherActivity.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
  });

  if (!allActivities.length) return null;

  const periodStart = period ? getPeriodStart(period) : null;

  // Full filter (grade + subject + period) → metrics, recentActivities
  const filtered = allActivities.filter(
    (a) =>
      (!gradeFilter || a.grade === gradeFilter) &&
      (!subjectFilter || a.subject === subjectFilter) &&
      (!periodStart || a.createdAt >= periodStart)
  );

  // Grade breakdown source: subject + period only (NOT grade)
  // Keeps the breakdown chart meaningful when a class is selected
  const gradeBreakdownSource = allActivities.filter(
    (a) =>
      (!subjectFilter || a.subject === subjectFilter) &&
      (!periodStart || a.createdAt >= periodStart)
  );

  // Subject breakdown source: grade + period only (NOT subject)
  // Keeps the breakdown chart meaningful when a subject is selected
  const subjectBreakdownSource = allActivities.filter(
    (a) =>
      (!gradeFilter || a.grade === gradeFilter) &&
      (!periodStart || a.createdAt >= periodStart)
  );

  // ── CRITICAL FIX: grades and subjects always from allActivities ──
  // This ensures ClassSelector always shows all available classes, regardless
  // of which class is currently selected. Without this, selecting Class 7
  // would make Class 8 disappear from the dropdown.
  const allGrades = new Set<number>();
  const allSubjects = new Set<string>();
  for (const a of allActivities) {
    allGrades.add(a.grade);
    allSubjects.add(a.subject);
  }

  // Metric counts are from filtered (grade-scoped when class is selected)
  let lessons = 0;
  let quizzes = 0;
  let papers = 0;
  for (const a of filtered) {
    if (a.activityType === "Lesson Plan") lessons++;
    else if (a.activityType === "Quiz") quizzes++;
    else if (a.activityType === "Question Paper") papers++;
  }

  // Grade breakdown (subject+period filtered — always shows all classes)
  const gradeMap = new Map<
    number,
    { lessons: number; quizzes: number; papers: number }
  >();
  for (const a of gradeBreakdownSource) {
    if (!gradeMap.has(a.grade)) {
      gradeMap.set(a.grade, { lessons: 0, quizzes: 0, papers: 0 });
    }
    const g = gradeMap.get(a.grade)!;
    if (a.activityType === "Lesson Plan") g.lessons++;
    else if (a.activityType === "Quiz") g.quizzes++;
    else if (a.activityType === "Question Paper") g.papers++;
  }

  const gradeBreakdown = [...gradeMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([grade, counts]) => ({
      grade,
      lessonPlans: counts.lessons,
      quizzes: counts.quizzes,
      questionPapers: counts.papers,
    }));

  // Subject breakdown (grade+period filtered — always shows all subjects)
  const subjectMap = new Map<string, number>();
  for (const a of subjectBreakdownSource) {
    subjectMap.set(a.subject, (subjectMap.get(a.subject) ?? 0) + 1);
  }
  const total = subjectBreakdownSource.length;
  const subjectBreakdown = [...subjectMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([subject, count]) => ({
      subject,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    }));

  // School average uses full unfiltered dataset (not grade/period scoped)
  const allTeachers = await getAllTeachers();
  const schoolAvg =
    allTeachers.length
      ? allTeachers.reduce((s, t) => s + t.totalActivities, 0) / allTeachers.length
      : 0;
  const totalActivities = lessons + quizzes + papers;

  return {
    teacherId,
    teacherName: allActivities[0].teacherName,
    subjects: [...allSubjects].sort(),        // always full subject list
    grades: [...allGrades].sort((a, b) => a - b), // always full grade list
    lessonPlans: lessons,
    quizzes,
    questionPapers: papers,
    totalActivities,
    vsSchoolAvgPercent: schoolAvg
      ? ((totalActivities - schoolAvg) / schoolAvg) * 100
      : 0,
    recentActivities: filtered.slice(0, 10).map((a) => ({
      id: a.id,
      activityType: a.activityType,
      subject: a.subject,
      grade: a.grade,
      createdAt: a.createdAt.toISOString(),
    })),
    gradeBreakdown,
    subjectBreakdown,
  };
}

// ─── Weekly trend ─────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getWeeklyTrend(
  teacherId?: string,
  gradeFilter?: number,
  subjectFilter?: string,
  period?: string
): Promise<TrendPoint[]> {
  const where: Record<string, unknown> = {};
  if (teacherId) where.teacherId = teacherId;
  if (gradeFilter) where.grade = gradeFilter;
  if (subjectFilter) where.subject = subjectFilter;
  if (period) where.createdAt = { gte: getPeriodStart(period) };

  const activities = await prisma.teacherActivity.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  // Group by calendar day
  const dayMap = new Map<
    string,
    { lessons: number; quizzes: number; papers: number; date: Date }
  >();

  for (const a of activities) {
    const dateISO = a.createdAt.toISOString().split("T")[0];
    if (!dayMap.has(dateISO)) {
      dayMap.set(dateISO, {
        lessons: 0,
        quizzes: 0,
        papers: 0,
        date: a.createdAt,
      });
    }
    const d = dayMap.get(dateISO)!;
    if (a.activityType === "Lesson Plan") d.lessons++;
    else if (a.activityType === "Quiz") d.quizzes++;
    else if (a.activityType === "Question Paper") d.papers++;
  }

  return [...dayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateISO, counts]) => {
      const d = new Date(dateISO + "T12:00:00Z");
      const dayNum = dateISO.split("-")[2];
      return {
        date: `${DAY_LABELS[d.getUTCDay()]} ${dayNum}`,
        dateISO,
        lessonPlans: counts.lessons,
        quizzes: counts.quizzes,
        questionPapers: counts.papers,
        total: counts.lessons + counts.quizzes + counts.papers,
      };
    });
}

// ─── Duplicate flags ──────────────────────────────────────────────────────

export async function getDuplicateFlags() {
  return prisma.duplicateFlag.findMany({
    orderBy: { createdAt: "asc" },
  });
}
