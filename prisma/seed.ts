/**
 * Seed script: Parse Excel dataset → insert into PostgreSQL → detect near-duplicates → flag
 *
 * Run: npx prisma db seed
 * (ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts)
 */

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient({ log: ["error"] });

// ─── Excel parsing ──────────────────────────────────────────────────────────

interface RawRow {
  teacherId: string;
  teacherName: string;
  grade: number;
  subject: string;
  activityType: string;
  createdAt: Date;
}

function parseExcel(): RawRow[] {
  const filePath = path.join(process.cwd(), "data", "Savra_Teacher_Data_Set.xlsx");

  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found at: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Read all rows as arrays (index 0 = header row)
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  console.log(`📊 Sheet: "${sheetName}" — ${rows.length} rows (including header)`);
  console.log("📋 Header row:", rows[0]);

  const records: RawRow[] = [];

  // Try to auto-detect column indices from header
  const header = (rows[0] as string[]).map((h: string) =>
    String(h).trim().toLowerCase()
  );

  // Column index detection — flexible to handle varying header names
  const findCol = (...names: string[]): number => {
    for (const name of names) {
      const idx = header.findIndex((h) => h.includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colTeacherId = findCol("teacher id", "teacher_id", "teacherid", "id");
  const colTeacherName = findCol("teacher name", "teacher_name", "teachername", "name");
  const colGrade = findCol("grade", "class");
  const colSubject = findCol("subject");
  const colActivityType = findCol("activity type", "activity_type", "activitytype", "type");
  const colDate = findCol("created at", "created_at", "date", "timestamp");

  console.log("🗂️  Detected columns:", {
    teacherId: colTeacherId,
    teacherName: colTeacherName,
    grade: colGrade,
    subject: colSubject,
    activityType: colActivityType,
    date: colDate,
  });

  // If auto-detect fails, fall back to known fixed positions
  // (Based on PRD dataset structure analysis)
  const useFixed =
    colTeacherId === -1 || colTeacherName === -1 || colGrade === -1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as string[];
    if (!row || row.every((cell) => cell === "" || cell === null)) continue;

    let teacherId: string;
    let teacherName: string;
    let grade: number;
    let subject: string;
    let activityType: string;
    let dateRaw: unknown;

    if (useFixed) {
      // Fallback: assume common column order
      // Adjust indices based on actual file structure
      teacherId = String(row[1] ?? "").trim();
      teacherName = String(row[2] ?? "").trim();
      dateRaw = row[3];
      grade = parseInt(String(row[4] ?? "0").replace(/[^0-9]/g, ""), 10);
      subject = String(row[5] ?? "").trim();
      activityType = String(row[6] ?? "").trim();
    } else {
      teacherId = String(row[colTeacherId] ?? "").trim();
      teacherName = String(row[colTeacherName] ?? "").trim();
      grade = parseInt(
        String(row[colGrade] ?? "0").replace(/[^0-9]/g, ""),
        10
      );
      subject = String(row[colSubject] ?? "").trim();
      activityType = String(row[colActivityType] ?? "").trim();
      dateRaw = row[colDate];
    }

    // Skip rows with missing critical fields
    if (!teacherId || !teacherName || !subject || !activityType || !grade) {
      console.warn(`⚠️  Row ${i + 1} skipped (missing fields):`, row);
      continue;
    }

    // Parse date — Excel stores dates as serial numbers or strings
    let createdAt: Date;
    if (typeof dateRaw === "number") {
      // Excel serial date
      createdAt = XLSX.SSF.parse_date_code(dateRaw)
        ? new Date(XLSX.SSF.format("yyyy-mm-dd hh:mm:ss", dateRaw))
        : new Date();
    } else if (dateRaw instanceof Date) {
      createdAt = dateRaw;
    } else {
      // String date parsing
      const dateStr = String(dateRaw ?? "").trim();
      const parsed = new Date(dateStr);
      createdAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    records.push({ teacherId, teacherName, grade, subject, activityType, createdAt });
  }

  console.log(`✅ Parsed ${records.length} valid records`);
  return records;
}

// ─── Near-duplicate detection ───────────────────────────────────────────────

interface DupGroup {
  primaryId: number;
  duplicateId: number;
  reason: string;
  timeDeltaMins: number;
}

function findNearDuplicates(
  inserted: Array<RawRow & { id: number }>
): DupGroup[] {
  const groups = new Map<string, Array<RawRow & { id: number }>>();

  for (const rec of inserted) {
    const day = rec.createdAt.toISOString().split("T")[0];
    const key = `${rec.teacherId}|${rec.grade}|${rec.subject}|${rec.activityType}|${day}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(rec);
    groups.set(key, bucket);
  }

  const dupGroups: DupGroup[] = [];

  for (const group of groups.values()) {
    if (group.length > 1) {
      const sorted = group.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      const primary = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const dup = sorted[i];
        const timeDeltaMins = Math.round(
          (dup.createdAt.getTime() - primary.createdAt.getTime()) / 60_000
        );
        dupGroups.push({
          primaryId: primary.id,
          duplicateId: dup.id,
          reason: "same_day_same_type",
          timeDeltaMins,
        });
      }
    }
  }

  return dupGroups;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (idempotent re-seed)
  await prisma.duplicateFlag.deleteMany();
  await prisma.insightCache.deleteMany();
  await prisma.teacherActivity.deleteMany();
  console.log("🗑️  Cleared existing data\n");

  // Parse Excel
  const records = parseExcel();

  // Insert activities (Layer 1: @@unique prevents exact duplicates)
  const insertResults = await prisma.$transaction(
    records.map((r) =>
      prisma.teacherActivity.upsert({
        where: {
          unique_activity: {
            teacherId: r.teacherId,
            grade: r.grade,
            subject: r.subject,
            activityType: r.activityType,
            createdAt: r.createdAt,
          },
        },
        create: r,
        update: {}, // No-op on conflict
      })
    )
  );

  console.log(`\n✅ Inserted ${insertResults.length} activities`);

  // Fetch all with IDs for near-dup detection
  const allInserted = await prisma.teacherActivity.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Layer 2: Detect near-duplicates
  const dupGroups = findNearDuplicates(
    allInserted.map((r) => ({
      id: r.id,
      teacherId: r.teacherId,
      teacherName: r.teacherName,
      grade: r.grade,
      subject: r.subject,
      activityType: r.activityType,
      createdAt: r.createdAt,
    }))
  );

  if (dupGroups.length > 0) {
    await prisma.duplicateFlag.createMany({ data: dupGroups });
    console.log(`\n⚠️  Detected and flagged ${dupGroups.length} near-duplicate groups:`);
    for (const d of dupGroups) {
      console.log(
        `   • Record #${d.duplicateId} is ${d.timeDeltaMins} min after #${d.primaryId} (${d.reason})`
      );
    }
  } else {
    console.log("\n✅ No near-duplicates detected");
  }

  // Print summary
  console.log("\n📊 Seed Summary:");
  console.log(`   Total activities: ${allInserted.length}`);
  console.log(`   Near-duplicate flags: ${dupGroups.length}`);

  const teacherMap = new Map<string, { name: string; count: number }>();
  for (const a of allInserted) {
    const entry = teacherMap.get(a.teacherId) ?? { name: a.teacherName, count: 0 };
    entry.count++;
    teacherMap.set(a.teacherId, entry);
  }
  for (const [id, entry] of teacherMap) {
    console.log(`   ${id}: ${entry.name} — ${entry.count} activities`);
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
