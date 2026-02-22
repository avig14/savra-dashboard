"use client";

/**
 * Client Component wrapper for SubjectBreakdown.
 *
 * `dynamic(..., { ssr: false })` is only valid inside a Client Component.
 * Server Component pages import this wrapper instead of using `dynamic` themselves.
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { SubjectStat } from "@/types/charts";

const SubjectBreakdown = dynamic(() => import("./SubjectBreakdown"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  ),
});

interface Props {
  data: SubjectStat[];
}

export function SubjectBreakdownWrapper({ data }: Props) {
  return <SubjectBreakdown data={data} />;
}
