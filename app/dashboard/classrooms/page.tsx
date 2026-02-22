import { getAllTeachers } from "@/lib/data/aggregator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Per-grade color identity ────────────────────────────────────────────────
const GRADE_COLORS: Record<
  number,
  { card: string; bigNum: string; iconBg: string; iconColor: string; pill: string }
> = {
  6:  { card: "border-blue-100 bg-blue-50/40",      bigNum: "text-blue-100",    iconBg: "bg-blue-100",    iconColor: "text-blue-600",    pill: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  7:  { card: "border-violet-100 bg-violet-50/40",  bigNum: "text-violet-100",  iconBg: "bg-violet-100",  iconColor: "text-violet-600",  pill: "bg-violet-100 text-violet-700 hover:bg-violet-200" },
  8:  { card: "border-emerald-100 bg-emerald-50/40",bigNum: "text-emerald-100", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", pill: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  9:  { card: "border-amber-100 bg-amber-50/40",    bigNum: "text-amber-100",   iconBg: "bg-amber-100",   iconColor: "text-amber-600",   pill: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  10: { card: "border-rose-100 bg-rose-50/40",      bigNum: "text-rose-100",    iconBg: "bg-rose-100",    iconColor: "text-rose-600",    pill: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
};
const DEFAULT_COLOR = GRADE_COLORS[6];

export default async function ClassroomsPage() {
  const teachers = await getAllTeachers();

  // Aggregate grades → teacher names
  const gradeMap = new Map<number, { teachers: string[] }>();

  for (const t of teachers) {
    for (const g of t.grades) {
      const entry = gradeMap.get(g) ?? { teachers: [] };
      if (!entry.teachers.includes(t.teacherName)) {
        entry.teachers.push(t.teacherName);
      }
      gradeMap.set(g, entry);
    }
  }

  const grades = [...gradeMap.entries()].sort((a, b) => a[0] - b[0]);
  const totalTeachers = new Set(teachers.map((t) => t.teacherId)).size;

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classrooms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {grades.length} active classes · {totalTeachers} teachers
          </p>
        </div>
        {/* Summary pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {grades.map(([grade]) => {
            const colors = GRADE_COLORS[grade] ?? DEFAULT_COLOR;
            return (
              <span
                key={grade}
                className={cn(
                  "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                  colors.pill,
                  "border-transparent"
                )}
              >
                Class {grade}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Grade Cards Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {grades.map(([grade, data]) => {
          const colors = GRADE_COLORS[grade] ?? DEFAULT_COLOR;
          return (
            <Card
              key={grade}
              className={cn("relative overflow-hidden border", colors.card)}
            >
              {/* Decorative large numeral */}
              <span
                className={cn(
                  "pointer-events-none select-none absolute -bottom-3 right-2",
                  "text-[88px] font-black leading-none",
                  colors.bigNum
                )}
              >
                {grade}
              </span>

              {/* Header */}
              <CardHeader className="pb-2 relative">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      colors.iconBg
                    )}
                  >
                    <GraduationCap className={cn("w-4 h-4", colors.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold leading-tight">
                      Class {grade}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {data.teachers.length} teacher
                      {data.teachers.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Teacher pills */}
              <CardContent className="relative pb-5">
                <div className="flex flex-wrap gap-1.5">
                  {data.teachers.map((name) => {
                    const teacher = teachers.find((t) => t.teacherName === name);
                    return teacher ? (
                      <Link
                        key={name}
                        href={`/dashboard/teachers/${teacher.teacherId}`}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors",
                          colors.pill
                        )}
                      >
                        {name.split(" ")[0]}
                      </Link>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
