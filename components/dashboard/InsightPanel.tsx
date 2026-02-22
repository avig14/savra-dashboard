import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { TeacherInsight } from "@/lib/ai/summaryGenerator";

interface InsightPanelProps {
  insight: TeacherInsight;
}

export function InsightPanel({ insight }: InsightPanelProps) {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-violet-50/40 to-indigo-50/60 border-indigo-200/70 shadow-sm shadow-indigo-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          AI Insight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-semibold leading-relaxed text-indigo-950">{insight.summary}</p>

        {insight.strengths.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-1.5">
              Strengths
            </p>
            <ul className="space-y-2">
              {insight.strengths.map((s, i) => (
                <li
                  key={i}
                  className="text-xs flex items-start gap-2.5 bg-white/80 border border-indigo-100 border-l-[3px] border-l-emerald-400 rounded-r-lg px-3 py-2.5 text-slate-700 font-medium"
                >
                  <span className="text-emerald-500 mt-0.5 shrink-0 text-[10px] font-bold">▸</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insight.suggestions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-1.5">
              Suggestions
            </p>
            <ul className="space-y-2">
              {insight.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="text-xs flex items-start gap-2.5 bg-white/80 border border-indigo-100 border-l-[3px] border-l-amber-400 rounded-r-lg px-3 py-2.5 text-slate-700 font-medium"
                >
                  <span className="text-amber-500 mt-0.5 shrink-0 text-[10px] font-bold">▸</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
