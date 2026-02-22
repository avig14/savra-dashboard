import { NextRequest, NextResponse } from "next/server";
import { getWeeklyTrend } from "@/lib/data/aggregator";
import { ok, err } from "@/types/api";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.nextUrl.searchParams.get("teacherId") ?? undefined;
    const gradeParam = request.nextUrl.searchParams.get("grade");
    const gradeFilter = gradeParam ? parseInt(gradeParam, 10) : undefined;

    const data = await getWeeklyTrend(teacherId, gradeFilter);

    return NextResponse.json(
      ok(data, {
        totalRecords: data.reduce((s, p) => s + p.total, 0),
        duplicatesDetected: 0,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[/api/trends]", e);
    return NextResponse.json(err("Failed to fetch trends"), { status: 500 });
  }
}
