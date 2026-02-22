"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "@/types/charts";

const chartConfig: ChartConfig = {
  lessonPlans: {
    label: "Lessons",
    color: "#e70044",
  },
  quizzes: {
    label: "Quizzes",
    color: "#009767",
  },
  questionPapers: {
    label: "Assessments",
    color: "#f05100",
  },
};

interface ActivityChartProps {
  data: TrendPoint[];
  title?: string;
}

export default function ActivityChart({
  data,
  title = "Weekly Activity Trend",
}: ActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-slate-50/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          No activity data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradLesson" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e70044" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#e70044" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradQuiz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#009767" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#009767" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradAssess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f05100" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f05100" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />

            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Area
              type="monotone"
              dataKey="lessonPlans"
              stroke="#e70044"
              strokeWidth={2}
              fill="url(#gradLesson)"
            />
            <Area
              type="monotone"
              dataKey="quizzes"
              stroke="#009767"
              strokeWidth={2}
              fill="url(#gradQuiz)"
            />
            <Area
              type="monotone"
              dataKey="questionPapers"
              stroke="#f05100"
              strokeWidth={2}
              fill="url(#gradAssess)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
