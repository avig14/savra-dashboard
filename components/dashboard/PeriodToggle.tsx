"use client";

import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

export function PeriodToggle() {
  const [selected, setSelected] = useQueryState("period", {
    defaultValue: "month",
    shallow: false,
  });

  const active = selected || "month";

  return (
    <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 gap-0.5">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => setSelected(p.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            active === p.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
