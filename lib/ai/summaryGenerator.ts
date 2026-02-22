import type { OverviewStats, TeacherSummary, TeacherDetail } from "@/types/activity";

// ── Exported types ─────────────────────────────────────────────────────────

export interface OverviewInsight {
  headline: string;
  highlights: string[];
}

export interface TeacherInsight {
  summary: string;
  strengths: string[];
  suggestions: string[];
}

// ── Private helpers ────────────────────────────────────────────────────────

function resolvePeriodLabel(period?: string): string {
  if (period === "week") return "this week";
  if (period === "year") return "this year";
  return "this month";
}

/**
 * Builds the inline context phrase for overview sentences.
 * e.g. "" | " in Class 8" | " in Mathematics" | " in Class 8 Mathematics"
 */
function overviewCtx(gradeFilter?: number, subjectFilter?: string): string {
  const parts: string[] = [];
  if (gradeFilter !== undefined) parts.push(`Class ${gradeFilter}`);
  if (subjectFilter) parts.push(subjectFilter);
  return parts.length > 0 ? ` in ${parts.join(" ")}` : "";
}

/**
 * Builds the parenthetical context phrase for teacher sentences.
 * e.g. "" | " (Class 8)" | " (Mathematics)" | " (Class 8, Mathematics)"
 */
function teacherCtx(gradeFilter?: number, subjectFilter?: string): string {
  const parts: string[] = [];
  if (gradeFilter !== undefined) parts.push(`Class ${gradeFilter}`);
  if (subjectFilter) parts.push(subjectFilter);
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

/**
 * Oxford-comma list of names.
 * 1 → "Neha"  |  2 → "A and B"  |  3+ → "A, B, and C"
 */
function formatNameList(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── generateOverviewSummary ────────────────────────────────────────────────

export function generateOverviewSummary(
  overview: OverviewStats,
  teachers: TeacherSummary[],
  gradeFilter?: number,
  subjectFilter?: string,
  period?: string
): OverviewInsight {
  const pl  = resolvePeriodLabel(period);
  const ctx = overviewCtx(gradeFilter, subjectFilter);
  const total =
    overview.totalLessons + overview.totalAssessments + overview.totalQuizzes;

  // ── Edge case: no activities in this filter ────────────────────────────
  if (total === 0) {
    return {
      headline: `No activities recorded${ctx} ${pl}.`,
      highlights: [
        "No lesson plans, quizzes, or assessments were submitted for the selected filters.",
        "Try widening your filter selection to see activity data.",
      ],
    };
  }

  // ── Headline: top performer(s) with full tie handling ──────────────────
  // overview.topPerformer uses reduce(>) so only captures the first maximum.
  // Re-derive from teachers[] to correctly name all tied leaders.
  const topTotal = overview.topPerformer?.total ?? 0;
  const topTeachers = teachers.filter((t) => t.totalActivities === topTotal);

  let headline: string;
  const actWord = topTotal === 1 ? "activity" : "activities";

  if (topTeachers.length === 1) {
    headline = `${topTeachers[0].teacherName} leads${ctx} ${pl} with ${topTotal} ${actWord}.`;
  } else if (topTeachers.length <= 3) {
    const names = formatNameList(topTeachers.map((t) => t.teacherName));
    headline = `${names} lead${ctx} ${pl} with ${topTotal} ${actWord} each.`;
  } else {
    headline = `${topTeachers.length} teachers are tied${ctx} ${pl} with ${topTotal} ${actWord} each.`;
  }

  // ── Highlights ─────────────────────────────────────────────────────────
  const highlights: string[] = [];

  // H1: Active teacher count
  const ac = overview.activeTeachers;
  highlights.push(
    `${ac} ${ac === 1 ? "teacher is" : "teachers are"} active${ctx} ${pl}.`
  );

  // H2: Activity type breakdown — tie-safe, never omits a tied type
  const typeCounts = [
    { label: "lesson plans",  count: overview.totalLessons },
    { label: "quizzes",       count: overview.totalQuizzes },
    { label: "assessments",   count: overview.totalAssessments },
  ]
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  if (typeCounts.length > 0) {
    const maxCount  = typeCounts[0].count;
    const topTypes  = typeCounts.filter((x) => x.count === maxCount);
    const otherTypes = typeCounts.filter((x) => x.count < maxCount);

    if (topTypes.length === 1 && otherTypes.length > 0) {
      // Single leader, runners listed
      const runnerStr = otherTypes
        .map((x) => `${x.label} (${x.count})`)
        .join(" and ");
      highlights.push(
        `${capitalize(topTypes[0].label)} (${maxCount}) are the most common activity${ctx}; ${runnerStr} follow.`
      );
    } else if (topTypes.length >= 2 && otherTypes.length > 0) {
      // Tied leaders + other types below
      const tiedStr   = topTypes.map((x) => x.label).join(" and ");
      const remainStr = otherTypes
        .map((x) => `${x.label} (${x.count})`)
        .join(" and ");
      highlights.push(
        `${capitalize(tiedStr)} are tied at ${maxCount} each${ctx}; ${remainStr} also recorded.`
      );
    } else if (topTypes.length >= 2) {
      // All present types are tied — no runners
      const tiedStr = topTypes.map((x) => x.label).join(" and ");
      highlights.push(
        `${capitalize(tiedStr)} are tied at ${maxCount} each${ctx}.`
      );
    } else {
      // Only one activity type exists at all
      highlights.push(
        `All ${maxCount} ${maxCount === 1 ? "activity" : "activities"} are ${topTypes[0].label}${ctx}.`
      );
    }
  }

  // H3: School average (suppress when only 1 teacher visible — avg = their own count)
  if (teachers.length > 1) {
    highlights.push(
      `School average is ${overview.schoolAvg.toFixed(1)} activities per teacher ${pl}.`
    );
  }

  // H4: Below-average teachers (> 10% below) — conditional
  const belowAvg = teachers.filter((t) => t.vsSchoolAvgPercent < -10);
  if (belowAvg.length > 0) {
    const names = formatNameList(belowAvg.map((t) => t.teacherName));
    highlights.push(
      `${names} ${belowAvg.length === 1 ? "is" : "are"} below the school average ${pl}.`
    );
  }

  return { headline, highlights };
}

// ── generateTeacherSummary ─────────────────────────────────────────────────

export function generateTeacherSummary(
  detail: TeacherDetail,
  schoolAvg: number,
  gradeFilter?: number,
  subjectFilter?: string,
  period?: string
): TeacherInsight {
  const pl  = resolvePeriodLabel(period);
  const ctx = teacherCtx(gradeFilter, subjectFilter);

  // ── Edge case: no activities in this filter ────────────────────────────
  if (detail.totalActivities === 0) {
    return {
      summary: `${detail.teacherName} has no recorded activities${ctx} ${pl}. No data is available for the selected filters.`,
      strengths: [],
      suggestions: [
        `Encourage ${detail.teacherName} to log at least one activity${ctx} ${pl}.`,
      ],
    };
  }

  // ── Summary sentence ───────────────────────────────────────────────────
  const vsPercent  = detail.vsSchoolAvgPercent;
  const absPercent = Math.abs(Math.round(vsPercent));

  const comparisonPhrase =
    vsPercent > 0
      ? `${absPercent}% above the school average`
      : vsPercent < 0
      ? `${absPercent}% below the school average`
      : "at the school average";

  // Use full grades/subjects (always unfiltered from detail)
  const subjectList = detail.subjects.join(" and ");
  const gradeList   = detail.grades.map((g) => `Class ${g}`).join(", ");
  const actWord     = detail.totalActivities === 1 ? "activity" : "activities";

  const summary =
    `${detail.teacherName} recorded ${detail.totalActivities} ${actWord}${ctx} ${pl} ` +
    `across ${subjectList} in ${gradeList}, placing them ${comparisonPhrase}.`;

  // ── Strengths (data-derived only, no speculation) ──────────────────────
  const strengths: string[] = [];

  if (vsPercent > 0) {
    strengths.push(
      `Activity level (${detail.totalActivities}) is ${absPercent}% above the school average — ` +
      `one of the stronger performers ${pl}.`
    );
  }

  if (detail.totalActivities > 0) {
    const lessonPct = (detail.lessonPlans / detail.totalActivities) * 100;
    if (lessonPct > 40) {
      const lpWord   = detail.lessonPlans === 1 ? "plan" : "plans";
      const lpVerb   = detail.lessonPlans === 1 ? "makes up" : "make up";
      strengths.push(
        `Strong focus on lesson preparation: ${detail.lessonPlans} lesson ${lpWord} ` +
        `${lpVerb} ${Math.round(lessonPct)}% of total activities.`
      );
    }
  }

  if (detail.grades.length >= 3) {
    strengths.push(
      `Covers ${detail.grades.length} classes (${gradeList}), ` +
      `demonstrating broad cross-class engagement.`
    );
  } else if (detail.grades.length === 2) {
    strengths.push(
      `Active across ${detail.grades.map((g) => `Class ${g}`).join(" and ")}.`
    );
  }

  if (
    detail.lessonPlans > 0 &&
    detail.quizzes > 0 &&
    detail.questionPapers > 0
  ) {
    strengths.push(
      `Balanced activity mix: lesson plans, quizzes, and assessments all present ${pl}.`
    );
  }

  // ── Suggestions (gap-driven, fallback guarantee) ───────────────────────
  const suggestions: string[] = [];

  if (vsPercent < -5) {
    suggestions.push(
      `Activity count (${detail.totalActivities}) is ${absPercent}% below the school average. ` +
      `Consider increasing lesson plan or quiz frequency.`
    );
  }

  if (detail.quizzes === 0) {
    suggestions.push(
      `No quizzes recorded${ctx} ${pl}. ` +
      `Adding regular quizzes can help monitor student understanding.`
    );
  }

  if (detail.questionPapers === 0) {
    suggestions.push(
      `No assessments (question papers) recorded${ctx} ${pl}. ` +
      `Formal assessments help track student progress over time.`
    );
  }

  // Grade imbalance check (only meaningful when multiple classes appear)
  if (detail.gradeBreakdown.length >= 2) {
    const gradeTotals = detail.gradeBreakdown.map((g) => ({
      grade: g.grade,
      total: g.lessonPlans + g.quizzes + g.questionPapers,
    }));
    const maxT       = Math.max(...gradeTotals.map((g) => g.total));
    const emptyGrades = gradeTotals.filter((g) => g.total === 0);

    if (emptyGrades.length > 0) {
      const emptyStr = emptyGrades.map((g) => `Class ${g.grade}`).join(", ");
      const verb     = emptyGrades.length === 1 ? "has" : "have";
      suggestions.push(
        `${emptyStr} ${verb} no activities recorded. ` +
        `Consider balancing coverage across all assigned classes.`
      );
    } else {
      const minT = Math.min(...gradeTotals.map((g) => g.total));
      if (maxT > 0 && maxT >= minT * 3) {
        const dominantGrade = gradeTotals.find((g) => g.total === maxT)!;
        suggestions.push(
          `Activity distribution is uneven: Class ${dominantGrade.grade} accounts for ` +
          `significantly more activities. Consider balancing coverage across all classes.`
        );
      }
    }
  }

  // Fallback: always guarantee at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push(
      `Great overall engagement — maintain this pace ${pl} to keep students on track.`
    );
  }

  return { summary, strengths, suggestions };
}
