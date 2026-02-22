import { NextResponse } from "next/server";
import { getAllTeachers } from "@/lib/data/aggregator";
import { ok, err } from "@/types/api";

export const revalidate = 60;

export async function GET() {
  try {
    const teachers = await getAllTeachers();
    return NextResponse.json(
      ok(teachers, {
        totalRecords: teachers.reduce((s, t) => s + t.totalActivities, 0),
        duplicatesDetected: 0,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[/api/teachers]", e);
    return NextResponse.json(err("Failed to fetch teachers"), { status: 500 });
  }
}
