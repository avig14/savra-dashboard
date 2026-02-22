import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { detectNearDuplicates } from "@/lib/data/deduplicator";
import { ok, err } from "@/types/api";

// No caching — always fresh for data quality report
export const revalidate = 0;

export async function GET() {
  try {
    const [activities, flags] = await Promise.all([
      prisma.teacherActivity.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.duplicateFlag.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    // Re-run near-dup detection for the full report with metadata
    const duplicateGroups = detectNearDuplicates(activities);

    return NextResponse.json(
      ok(
        {
          summary: {
            totalActivities: activities.length,
            duplicateGroupsDetected: duplicateGroups.length,
            flaggedRecords: flags.length,
            strategy: "3-layer: DB unique constraint + same-day detection + UI banner",
          },
          duplicateGroups: duplicateGroups.map((g) => ({
            groupKey: g.groupKey,
            teacherName: g.teacherName,
            grade: g.grade,
            subject: g.subject,
            activityType: g.activityType,
            date: g.date,
            recordCount: g.records.length,
            timeDeltaMinutes: g.timeDeltaMinutes,
            reason: g.reason,
            explanation: `${g.teacherName} created ${g.records.length} ${g.activityType} entries for Class ${g.grade} ${g.subject} on ${g.date} — ${g.timeDeltaMinutes} min apart. All records are kept; admin review recommended.`,
          })),
          rawFlags: flags,
        },
        {
          totalRecords: activities.length,
          duplicatesDetected: duplicateGroups.length,
          lastUpdated: new Date().toISOString(),
        }
      )
    );
  } catch (e) {
    console.error("[/api/data-quality]", e);
    return NextResponse.json(err("Failed to fetch data quality report"), {
      status: 500,
    });
  }
}
