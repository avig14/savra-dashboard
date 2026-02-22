"use client";

import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassSelectorProps {
  grades: number[];
}

export function ClassSelector({ grades }: ClassSelectorProps) {
  const [selected, setSelected] = useQueryState("grade", {
    defaultValue: "",
    shallow: false,
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filter by class:</span>
      <Select
        value={selected || "all"}
        onValueChange={(v) => setSelected(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-36 h-9 rounded-full bg-violet-500 text-white border-violet-500 text-sm font-medium hover:bg-violet-600 focus:ring-violet-400 [&_svg]:!text-white [&_svg]:!opacity-100">
          <SelectValue placeholder="All classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All classes</SelectItem>
          {grades.map((g) => (
            <SelectItem key={g} value={String(g)}>
              Class {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
