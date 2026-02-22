"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Clock } from "lucide-react";

interface DuplicateGroup {
  groupKey: string;
  teacherName: string;
  grade: number;
  subject: string;
  activityType: string;
  date: string;
  recordCount: number;
  timeDeltaMinutes: number;
  explanation: string;
}

interface DataQualityBannerProps {
  duplicateGroups: DuplicateGroup[];
}

type BannerView = "full" | "collapsed";

export function DataQualityBanner({ duplicateGroups }: DataQualityBannerProps) {
  const [expanded, setExpanded] = useState(false);
  // Always open in full view on every page load — no persistence
  const [viewState, setViewState] = useState<BannerView>("full");

  const handleCollapse = () => setViewState("collapsed");
  const handleExpand = () => setViewState("full");

  if (!duplicateGroups || duplicateGroups.length === 0) return null;

  const displayType = (raw: string) => {
    const map: Record<string, string> = {
      "Lesson Plan": "Lesson",
      Quiz: "Quiz",
      "Question Paper": "Assessment",
    };
    return map[raw] ?? raw;
  };

  // ── Collapsed chip ─────────────────────────────────────────────────────────
  if (viewState === "collapsed") {
    return (
      <div className="flex items-center justify-between gap-3 border-l-4 border-l-amber-400 bg-amber-50/80 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold">
            {duplicateGroups.length} data quality{" "}
            {duplicateGroups.length === 1 ? "entry" : "entries"} flagged — review recommended
          </span>
        </div>
        <button
          onClick={handleExpand}
          className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-900 transition-colors shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show
        </button>
      </div>
    );
  }

  // ── Full banner ────────────────────────────────────────────────────────────
  return (
    <div className="relative flex gap-3.5 border-l-4 border-l-amber-500 bg-amber-100/60 rounded-lg px-4 py-3.5 text-amber-900">
      {/* ── Collapse button ─────────────────────────────────────── */}
      <button
        onClick={handleCollapse}
        className="absolute top-2.5 right-3 text-amber-500 hover:text-amber-800 transition-colors text-lg leading-none"
        aria-label="Collapse"
      >
        ×
      </button>

      {/* ── Icon badge ─────────────────────────────────────────── */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center mt-0.5">
        <AlertTriangle className="w-4 h-4 text-amber-700" />
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-[15px] font-bold leading-snug">
          Data Quality Notice —{" "}
          {duplicateGroups.length} potential duplicate{" "}
          {duplicateGroups.length === 1 ? "entry" : "entries"} detected
        </p>

        <p className="text-xs mt-1 mb-2 text-amber-800/80">
          These entries share the same teacher, class, subject, and activity
          type on the same calendar day (timestamps{" "}
          {Math.min(...duplicateGroups.map((d) => d.timeDeltaMinutes))}–
          {Math.max(...duplicateGroups.map((d) => d.timeDeltaMinutes))} min
          apart). All records are preserved — admin review recommended.
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold underline underline-offset-2 hover:no-underline text-amber-700"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {duplicateGroups.map((group) => (
              <div
                key={group.groupKey}
                className="rounded-md bg-white/60 px-3 py-2 text-xs space-y-0.5"
              >
                <div className="font-semibold">
                  {group.teacherName} — {displayType(group.activityType)} ·{" "}
                  {group.subject} · Class {group.grade}
                </div>
                <div className="text-amber-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(group.date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  — {group.recordCount} entries,{" "}
                  {group.timeDeltaMinutes < 60
                    ? `${group.timeDeltaMinutes} min apart`
                    : `${Math.round(group.timeDeltaMinutes / 60)}h apart`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
