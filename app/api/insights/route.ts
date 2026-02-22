import { NextRequest, NextResponse } from "next/server";
import { getAllTeachers, getTeacherDetail } from "@/lib/data/aggregator";
import { getOverviewInsight, getTeacherInsight } from "@/lib/ai/insights";
import { ok, err } from "@/types/api";

// Longer revalidate for AI — responses are cached in DB for 24h
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.nextUrl.searchParams.get("teacherId");

    if (teacherId) {
      // Mode 2: Per-teacher insight
      const [teachers, detail] = await Promise.all([
        getAllTeachers(),
        getTeacherDetail(teacherId),
      ]);

      if (!detail) {
        return NextResponse.json(err("Teacher not found"), { status: 404 });
      }

      const schoolAvg =
        teachers.reduce((s, t) => s + t.totalActivities, 0) / teachers.length;

      const insight = await getTeacherInsight(detail, schoolAvg);
      return NextResponse.json(ok(insight));
    } else {
      // Mode 1: Overview cross-teacher insight
      const teachers = await getAllTeachers();
      const insight = await getOverviewInsight(teachers);
      return NextResponse.json(ok(insight));
    }
  } catch (e) {
    console.error("[/api/insights]", e);
    return NextResponse.json(err("Failed to generate insights"), { status: 500 });
  }
}
