"use client";

import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRADES = [6, 7, 8, 9, 10];

export function GradeFilter() {
  const [selected, setSelected] = useQueryState("grade", {
    defaultValue: "all",
    shallow: false,
  });

  return (
    <Select
      value={selected || "all"}
      onValueChange={(v) => setSelected(v === "all" ? "all" : v)}
    >
      <SelectTrigger className="h-9 w-36 rounded-full bg-violet-500 text-white border-violet-500 text-sm font-medium hover:bg-violet-600 focus:ring-violet-400 [&_svg]:!text-white [&_svg]:!opacity-100">
        <SelectValue placeholder="All Grades" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Grades</SelectItem>
        {GRADES.map((g) => (
          <SelectItem key={g} value={String(g)}>
            Grade {g}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
