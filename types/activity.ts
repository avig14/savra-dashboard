// Raw database row
export interface TeacherActivity {
  id: number;
  teacherId: string;
  teacherName: string;
  grade: number;
  subject: string;
  activityType: string; // "Lesson Plan" | "Quiz" | "Question Paper"
  createdAt: Date;
}

// Near-duplicate group (same teacher/grade/subject/type on same calendar day)
export interface DuplicateGroup {
  groupKey: string; // "T001|8|Mathematics|Lesson Plan|2026-02-18"
  teacherName: string;
  grade: number;
  subject: string;
  activityType: string;
  date: string; // YYYY-MM-DD
  records: Array<{ id: number; createdAt: Date }>;
  reason: "same_day_same_type";
  timeDeltaMinutes: number;
}

// Aggregated summary per teacher (for overview grid)
export interface TeacherSummary {
  teacherId: string;
  teacherName: string;
  subjects: string[];
  grades: number[];
  lessonPlans: number;
  quizzes: number;
  questionPapers: number;
  totalActivities: number;
  vsSchoolAvgPercent: number; // positive = above avg
}

// Full per-teacher detail (for detail page)
export interface TeacherDetail extends TeacherSummary {
  recentActivities: Array<{
    id: number;
    activityType: string;
    subject: string;
    grade: number;
    createdAt: string; // ISO string for JSON serialization
  }>;
  gradeBreakdown: Array<{
    grade: number;
    lessonPlans: number;
    quizzes: number;
    questionPapers: number;
  }>;
  subjectBreakdown: Array<{
    subject: string;
    count: number;
    pct: number;
  }>;
}

// Overview aggregation
export interface OverviewStats {
  activeTeachers: number;
  totalLessons: number;
  totalAssessments: number;
  totalQuizzes: number;
  duplicatesDetected: number;
  topPerformer: { name: string; total: number } | null;
  schoolAvg: number;
}
