import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ComparisonBarProps {
  teacherName: string;
  teacherTotal: number;
  schoolAvg: number;
  vsPercent: number;
}

export function ComparisonBar({
  teacherName,
  teacherTotal,
  schoolAvg,
  vsPercent,
}: ComparisonBarProps) {
  const isAbove = vsPercent >= 0;
  const maxVal = Math.max(teacherTotal, schoolAvg, 1);
  const teacherWidth = (teacherTotal / maxVal) * 100;
  const avgWidth = (schoolAvg / maxVal) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          vs School Average
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teacher bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">{teacherName}</span>
            <span className="font-bold tabular-nums">{teacherTotal} activities</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${teacherWidth}%` }}
            />
          </div>
        </div>

        {/* School avg bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">School average</span>
            <span className="tabular-nums text-muted-foreground">
              {schoolAvg.toFixed(1)} activities
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-muted-foreground/50 transition-all duration-500"
              style={{ width: `${avgWidth}%` }}
            />
          </div>
        </div>

        {/* Delta */}
        <div
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium",
            isAbove
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          )}
        >
          {isAbove ? "↑" : "↓"} {Math.abs(vsPercent).toFixed(0)}%{" "}
          {isAbove ? "above" : "below"} school average
        </div>
      </CardContent>
    </Card>
  );
}
