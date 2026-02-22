import { NextRequest, NextResponse } from "next/server";
import { getTeacherDetail } from "@/lib/data/aggregator";
import { ok, err } from "@/types/api";

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gradeParam = request.nextUrl.searchParams.get("grade");
    const gradeFilter = gradeParam ? parseInt(gradeParam, 10) : undefined;

    const detail = await getTeacherDetail(id, gradeFilter);

    if (!detail) {
      return NextResponse.json(err("Teacher not found"), { status: 404 });
    }

    return NextResponse.json(
      ok(detail, {
        totalRecords: detail.totalActivities,
        duplicatesDetected: 0,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[/api/teachers/[id]]", e);
    return NextResponse.json(err("Failed to fetch teacher detail"), {
      status: 500,
    });
  }
}
