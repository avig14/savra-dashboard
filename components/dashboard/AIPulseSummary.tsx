import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { OverviewInsight } from "@/lib/ai/summaryGenerator";

interface AIPulseSummaryProps {
  insight: OverviewInsight;
}

export function AIPulseSummary({ insight }: AIPulseSummaryProps) {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-violet-50/40 to-indigo-50/60 border-indigo-200/70 shadow-sm shadow-indigo-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          AI Pulse Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-semibold leading-relaxed text-indigo-950">
          {insight.headline}
        </p>
        {insight.highlights.length > 0 && (
          <ul className="space-y-2">
            {insight.highlights.map((h, i) => (
              <li
                key={i}
                className="text-xs flex items-start gap-2.5 bg-white/80 border border-indigo-100 border-l-[3px] border-l-indigo-400 rounded-r-lg px-3 py-2.5 text-slate-700 font-medium"
              >
                <span className="text-indigo-400 mt-0.5 shrink-0 text-[10px] font-bold">▸</span>
                {h}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
