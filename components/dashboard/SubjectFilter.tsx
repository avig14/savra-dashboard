"use client";

import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies"];

export function SubjectFilter() {
  const [selected, setSelected] = useQueryState("subject", {
    defaultValue: "all",
    shallow: false,
  });

  return (
    <Select
      value={selected || "all"}
      onValueChange={(v) => setSelected(v === "all" ? "all" : v)}
    >
      <SelectTrigger className="h-9 w-40 rounded-full text-sm font-medium">
        <SelectValue placeholder="All Subjects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Subjects</SelectItem>
        {SUBJECTS.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
