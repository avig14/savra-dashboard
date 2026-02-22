"use client";

/**
 * Client Component wrapper for ActivityChart.
 *
 * `dynamic(..., { ssr: false })` is only valid inside a Client Component.
 * Server Component pages import this wrapper instead of using `dynamic` themselves.
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { TrendPoint } from "@/types/charts";

const ActivityChart = dynamic(() => import("./ActivityChart"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  ),
});

interface Props {
  data: TrendPoint[];
  title?: string;
}

export function ActivityChartWrapper({ data, title }: Props) {
  return <ActivityChart data={data} title={title} />;
}
