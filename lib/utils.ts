import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with K suffix (e.g. 1234 → "1.2K")
export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// Format a date as "Feb 11, 2026" or "Mon, Feb 11"
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format relative % with sign: "+12%" or "-5%"
export function formatDelta(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

// Map activity type to display label
export const ACTIVITY_LABELS: Record<string, string> = {
  "Lesson Plan": "Lesson",
  Quiz: "Quiz",
  "Question Paper": "Assessment",
};

export function displayType(raw: string): string {
  return ACTIVITY_LABELS[raw] ?? raw;
}

