import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { displayType } from "@/lib/utils";

interface ActivityRow {
  id: number;
  activityType: string;
  subject: string;
  grade: number;
  createdAt: string;
}

interface RecentActivityProps {
  activities: ActivityRow[];
  showTeacher?: boolean;
  teacherName?: string;
}

const TYPE_COLORS: Record<string, string> = {
  "Lesson Plan": "bg-rose-100 text-rose-700 border-rose-200",
  Quiz: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Question Paper": "bg-orange-100 text-orange-700 border-orange-200",
};

export function RecentActivity({
  activities,
  showTeacher,
  teacherName,
}: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Recent Activity
          {teacherName && (
            <span className="font-normal text-muted-foreground ml-1">
              — {teacherName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="text-[11px] uppercase tracking-wider">
              <TableHead className="pl-5">Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="pr-5 text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8 text-sm"
                >
                  No recent activity
                </TableCell>
              </TableRow>
            ) : (
              activities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="pl-5 py-2.5">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        TYPE_COLORS[a.activityType] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {displayType(a.activityType)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-sm">{a.subject}</TableCell>
                  <TableCell className="py-2.5 text-sm text-muted-foreground">
                    Class {a.grade}
                  </TableCell>
                  <TableCell className="pr-5 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                    {new Date(a.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
