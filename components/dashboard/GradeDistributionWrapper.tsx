"use client";

/**
 * Client Component wrapper for GradeDistribution.
 *
 * `dynamic(..., { ssr: false })` is only valid inside a Client Component.
 * Server Component pages import this wrapper instead of using `dynamic` themselves.
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const GradeDistribution = dynamic(() => import("./GradeDistribution"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="h-[260px] w-full" />
      </CardContent>
    </Card>
  ),
});

interface GradeData {
  grade: number;
  lessonPlans: number;
  quizzes: number;
  questionPapers: number;
}

interface Props {
  data: GradeData[];
}

export function GradeDistributionWrapper({ data }: Props) {
  return <GradeDistribution data={data} />;
}
