"use client";

import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubjectSelectorProps {
  subjects: string[];
}

export function SubjectSelector({ subjects }: SubjectSelectorProps) {
  const [selected, setSelected] = useQueryState("subject", {
    defaultValue: "",
    shallow: false,
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filter by subject:</span>
      <Select
        value={selected || "all"}
        onValueChange={(v) => setSelected(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue placeholder="All subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All subjects</SelectItem>
          {subjects.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
