import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TeacherSummary } from "@/types/activity";
import { BookOpen, HelpCircle, FileText, TrendingUp, TrendingDown } from "lucide-react";

interface TeacherCardProps {
  teacher: TeacherSummary;
}

// Full class strings must be literals so Tailwind includes them during build
const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500",
  "from-rose-400 to-pink-500",
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
];

function getAvatarGradient(name: string): string {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const isAboveAvg = teacher.vsSchoolAvgPercent >= 0;
  const avatarGradient = getAvatarGradient(teacher.teacherName);
  const initials = getInitials(teacher.teacherName);

  return (
    <Link href={`/dashboard/teachers/${teacher.teacherId}`} className="block">
      <Card
        className={cn(
          "hover:shadow-lg hover:shadow-violet-200/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-violet-50/60 to-white border-violet-100/80",
          isAboveAvg
            ? "border-t-[3px] border-t-emerald-400"
            : "border-t-[3px] border-t-red-400"
        )}
      >
        <CardContent className="p-5 space-y-4">
          {/* Header — Avatar + Name + Performance badge */}
          <div className="flex items-start justify-between gap-3">
            {/* Avatar + Name block */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Gradient initials avatar */}
              <div
                className={cn(
                  "w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md",
                  avatarGradient
                )}
              >
                <span className="text-sm font-bold text-white leading-none">
                  {initials}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors truncate">
                  {teacher.teacherName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {teacher.subjects.slice(0, 2).join(" · ")}
                  {teacher.subjects.length > 2 && ` +${teacher.subjects.length - 2}`}
                </p>
              </div>
            </div>

            {/* Performance badge — filled pill */}
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                isAboveAvg
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {isAboveAvg ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isAboveAvg ? "+" : ""}
              {teacher.vsSchoolAvgPercent.toFixed(0)}%
            </span>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-2">
            <StatPill
              icon={<BookOpen className="w-3 h-3" />}
              label="Lessons"
              value={teacher.lessonPlans}
              color="bg-rose-50 text-rose-600"
            />
            <StatPill
              icon={<HelpCircle className="w-3 h-3" />}
              label="Quizzes"
              value={teacher.quizzes}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatPill
              icon={<FileText className="w-3 h-3" />}
              label="Assessments"
              value={teacher.questionPapers}
              color="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Grades */}
          <div className="flex flex-wrap gap-1">
            {teacher.grades.map((g) => (
              <span
                key={g}
                className="text-xs px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100 font-medium"
              >
                Class {g}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={cn("rounded-md px-2 py-2.5 space-y-0.5", color)}>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black leading-none text-slate-800">{value}</p>
    </div>
  );
}
