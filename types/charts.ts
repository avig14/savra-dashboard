// One point in the weekly activity trend chart
export interface TrendPoint {
  date: string; // "Mon 11", "Tue 12", etc.
  dateISO: string; // "2026-02-11"
  lessonPlans: number;
  quizzes: number;
  questionPapers: number;
  total: number;
}

// Subject distribution for pie chart
export interface SubjectStat {
  subject: string;
  count: number;
  pct: number; // 0–100
}
