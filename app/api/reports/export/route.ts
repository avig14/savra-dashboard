import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { getAllTeachers, getOverviewStats } from "@/lib/data/aggregator";
import { prisma } from "@/lib/db";
import { detectNearDuplicates } from "@/lib/data/deduplicator";

// Always fresh — report must reflect current DB state
export const revalidate = 0;

export async function GET() {
  try {
    const [teachers, overview, activities] = await Promise.all([
      getAllTeachers(),
      getOverviewStats(),
      prisma.teacherActivity.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    const duplicates = detectNearDuplicates(activities);
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Summary ────────────────────────────────────────────────────
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Savra School Activity Report"],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Value"],
      ["Active Teachers", overview.activeTeachers],
      ["Lessons Created", overview.totalLessons],
      ["Quizzes Conducted", overview.totalQuizzes],
      ["Assessments Made", overview.totalAssessments],
      [
        "Total Activities",
        overview.totalLessons + overview.totalQuizzes + overview.totalAssessments,
      ],
      ["Data Quality Flags", overview.duplicatesDetected],
      ...(overview.topPerformer
        ? [["Top Performer", overview.topPerformer.name], ["Top Performer Activities", overview.topPerformer.total]]
        : []),
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // ── Sheet 2: Teacher Breakdown ──────────────────────────────────────────
    const teacherSheet = XLSX.utils.aoa_to_sheet([
      ["Teacher Name", "Classes", "Subjects", "Lessons", "Quizzes", "Assessments", "Total Activities"],
      ...teachers.map((t) => [
        t.teacherName,
        t.grades.map((g) => `Class ${g}`).join(", "),
        t.subjects.join(", "),
        t.lessonPlans,
        t.quizzes,
        t.questionPapers,
        t.totalActivities,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, teacherSheet, "Teachers");

    // ── Sheet 3: Data Quality (only when issues exist) ──────────────────────
    if (duplicates.length > 0) {
      const qualitySheet = XLSX.utils.aoa_to_sheet([
        ["Teacher", "Class", "Subject", "Activity Type", "Date", "Record Count", "Time Delta (min)"],
        ...duplicates.map((g) => [
          g.teacherName,
          `Class ${g.grade}`,
          g.subject,
          g.activityType,
          g.date,
          g.records.length,
          g.timeDeltaMinutes,
        ]),
      ]);
      XLSX.utils.book_append_sheet(wb, qualitySheet, "Data Quality");
    }

    const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="savra-report.xlsx"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
