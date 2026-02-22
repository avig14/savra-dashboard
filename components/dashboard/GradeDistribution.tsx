"use client";

import {
  BarChart,
  Bar,
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

const chartConfig: ChartConfig = {
  lessonPlans: { label: "Lessons", color: "#e70044" },
  quizzes: { label: "Quizzes", color: "#009767" },
  questionPapers: { label: "Assessments", color: "#f05100" },
};

interface GradeData {
  grade: number;
  lessonPlans: number;
  quizzes: number;
  questionPapers: number;
}

interface GradeDistributionProps {
  data: GradeData[];
}

export default function GradeDistribution({ data }: GradeDistributionProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Class-wise Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
          No class data available
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    name: `Class ${d.grade}`,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        {/* Exact label required by PRD */}
        <CardTitle className="text-sm font-semibold">
          Class-wise Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              className="stroke-muted"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Bar dataKey="lessonPlans" fill="#e70044" radius={[0, 3, 3, 0]} />
            <Bar dataKey="quizzes" fill="#009767" radius={[0, 3, 3, 0]} />
            <Bar
              dataKey="questionPapers"
              fill="#f05100"
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
