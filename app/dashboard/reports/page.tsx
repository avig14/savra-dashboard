import { getOverviewStats } from "@/lib/data/aggregator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ShieldCheck, Trophy, Star, FileSpreadsheet } from "lucide-react";

export default async function ReportsPage() {
  const overview = await getOverviewStats();
  const totalActivities =
    overview.totalLessons + overview.totalQuizzes + overview.totalAssessments;

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Summary reports · Week of Feb 11–18, 2026
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ── Card 1: Weekly Activity Summary (blue) ──────────── */}
        <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Weekly Activity Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Stat rows */}
            {[
              { label: "Active Teachers", value: overview.activeTeachers, dot: "bg-blue-500" },
              { label: "Lessons Created", value: overview.totalLessons,    dot: "bg-rose-500" },
              { label: "Quizzes Conducted", value: overview.totalQuizzes,  dot: "bg-emerald-500" },
              { label: "Assessments Made", value: overview.totalAssessments, dot: "bg-orange-500" },
            ].map(({ label, value, dot }) => (
              <div
                key={label}
                className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/70"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{value}</span>
              </div>
            ))}

            {/* Total row */}
            <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-blue-100/60 mt-1">
              <span className="text-sm font-semibold text-blue-800">Total Activities</span>
              <span className="text-lg font-black text-blue-700 tabular-nums">
                {totalActivities}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: Data Quality (amber) ─────────────────────── */}
        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Data Quality Report
                </CardTitle>
              </div>
              {overview.duplicatesDetected > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-400 text-amber-600 bg-amber-50"
                >
                  {overview.duplicatesDetected} flags
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {overview.duplicatesDetected > 0
                ? `${overview.duplicatesDetected} near-duplicate group${overview.duplicatesDetected !== 1 ? "s" : ""} detected. All records are preserved — admin review recommended.`
                : "No data quality issues detected. All records appear clean."}
            </p>
            {/* Excel download — replaces JSON link */}
            <a
              href="/api/reports/export"
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Excel Report
            </a>
          </CardContent>
        </Card>

        {/* ── Card 3: Top Performer (emerald) ──────────────────── */}
        {overview.topPerformer && (
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Top Performer This Week
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-xl font-black tracking-tight text-emerald-900">
                {overview.topPerformer.name}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100">
                <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">
                  {overview.topPerformer.total} activities this week
                </span>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
