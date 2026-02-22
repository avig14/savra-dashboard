import type { DuplicateGroup } from "@/types/activity";

interface RawActivity {
  id: number;
  teacherId: string;
  teacherName: string;
  grade: number;
  subject: string;
  activityType: string;
  createdAt: Date;
}

/**
 * Layer 2 deduplication: detect semantic near-duplicates.
 * A near-duplicate is defined as: same teacher + grade + subject + activityType
 * on the SAME calendar day (regardless of time).
 *
 * These are NOT silently deleted — they are flagged for admin visibility.
 * The PRD dataset contains 4 such groups (18 min to 4.5h apart).
 */
export function detectNearDuplicates(records: RawActivity[]): DuplicateGroup[] {
  const grouped = new Map<string, RawActivity[]>();

  for (const record of records) {
    const day = record.createdAt.toISOString().split("T")[0];
    const key = `${record.teacherId}|${record.grade}|${record.subject}|${record.activityType}|${day}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(record);
    grouped.set(key, bucket);
  }

  const duplicates: DuplicateGroup[] = [];

  for (const [key, group] of grouped) {
    if (group.length > 1) {
      const sorted = group.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      const firstMs = sorted[0].createdAt.getTime();
      const lastMs = sorted[sorted.length - 1].createdAt.getTime();
      const timeDeltaMinutes = Math.round((lastMs - firstMs) / 60_000);

      const [teacherId, gradeStr, subject, activityType, date] = key.split("|");
      void teacherId; // used in key only; teacherName comes from record

      duplicates.push({
        groupKey: key,
        teacherName: sorted[0].teacherName,
        grade: Number(gradeStr),
        subject,
        activityType,
        date,
        records: sorted.map((r) => ({ id: r.id, createdAt: r.createdAt })),
        reason: "same_day_same_type",
        timeDeltaMinutes,
      });
    }
  }

  return duplicates;
}
