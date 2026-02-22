import { NextResponse } from "next/server";
import { getOverviewStats } from "@/lib/data/aggregator";
import { ok, err } from "@/types/api";

// Next.js 15: GET routes are NOT cached by default — must opt-in
export const revalidate = 60;

export async function GET() {
  try {
    const data = await getOverviewStats();
    return NextResponse.json(
      ok(data, {
        totalRecords: data.totalLessons + data.totalAssessments + data.totalQuizzes,
        duplicatesDetected: data.duplicatesDetected,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[/api/overview]", e);
    return NextResponse.json(err("Failed to fetch overview"), { status: 500 });
  }
}
