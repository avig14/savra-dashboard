import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import type { TeacherSummary, TeacherDetail } from "@/types/activity";

const MODEL = "claude-sonnet-4-6";
const CACHE_TTL_HOURS = 24;

// ─── Static fallbacks (shown when API key is missing) ──────────────────────

const TEACHER_FALLBACK = {
  summary:
    "This teacher has been actively contributing to student learning this week across their assigned classes and subjects.",
  strengths: ["Consistent activity creation across lesson plans, quizzes, and assessments."],
  suggestions: ["Consider diversifying activity types to engage different learning styles."],
};

const OVERVIEW_FALLBACK = {
  headline:
    "Neha Kapoor leads the school with 10 total activities, excelling across Classes 9 and 10.",
  highlights: [
    "All 5 teachers are active across Classes 6–10.",
    "Anita Sharma, Pooja Mehta, and Rahul Verma each created 9 activities.",
    "Lesson plans (18) are the most common activity type; quizzes and assessments are tied at 13 each.",
  ],
};

// ─── Prompt builders ───────────────────────────────────────────────────────

function buildOverviewPrompt(teachers: TeacherSummary[]): string {
  const avg =
    teachers.length > 0
      ? teachers.reduce((s, t) => s + t.totalActivities, 0) / teachers.length
      : 0;
  const rows = teachers
    .map(
      (t) =>
        `${t.teacherName} (${t.subjects.join("/")}, Classes ${t.grades.join(", ")}): ` +
        `${t.lessonPlans} Lessons, ${t.quizzes} Quizzes, ${t.questionPapers} Assessments = ${t.totalActivities} total`
    )
    .join("\n");

  return `You are an AI analytics assistant for Savra, an EdTech platform used by school principals in India.

Generate a concise "AI Pulse Summary" for the admin dashboard covering the week of Feb 11–18, 2026.
Style: mention specific teacher names and class numbers. Example: "Neha Kapoor led Class 9–10 with 10 activities this week."

SCHOOL ACTIVITY DATA (5 teachers, ${teachers.reduce((s, t) => s + t.totalActivities, 0)} total activities):
${rows}
School average: ${avg.toFixed(1)} activities/teacher

Respond ONLY with valid JSON (no markdown, no explanation):
{"headline":"one key comparative insight mentioning 1–2 teacher names and class numbers","highlights":["insight 1 (data-backed)","insight 2 (data-backed)"]}`;
}

function buildTeacherPrompt(detail: TeacherDetail, schoolAvg: number): string {
  return `You are an educational analytics assistant for Savra, helping school principals understand teacher performance.

Analyze this teacher's activity for the week of Feb 11–18, 2026 and write insights for the school principal.

TEACHER: ${detail.teacherName}
SUBJECTS: ${detail.subjects.join(", ")}
CLASSES: Class ${detail.grades.join(", Class ")}
Lessons: ${detail.lessonPlans} | Quizzes: ${detail.quizzes} | Assessments: ${detail.questionPapers}
Total: ${detail.totalActivities} vs school avg ${schoolAvg.toFixed(1)} (${detail.vsSchoolAvgPercent >= 0 ? "+" : ""}${detail.vsSchoolAvgPercent.toFixed(0)}%)

Respond ONLY with valid JSON (no markdown, no explanation):
{"summary":"2-sentence narrative for principal mentioning specific subjects and classes","strengths":["specific strength 1","specific strength 2"],"suggestions":["actionable suggestion 1"]}`;
}

// ─── Cache helpers ─────────────────────────────────────────────────────────

async function getCached(key: string): Promise<unknown | null> {
  try {
    const row = await prisma.insightCache.findUnique({ where: { cacheKey: key } });
    if (!row) return null;
    if (row.expiresAt < new Date()) {
      await prisma.insightCache.delete({ where: { cacheKey: key } });
      return null;
    }
    return JSON.parse(row.content);
  } catch {
    return null;
  }
}

async function setCached(key: string, value: unknown): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000);
  try {
    await prisma.insightCache.upsert({
      where: { cacheKey: key },
      create: { cacheKey: key, content: JSON.stringify(value), expiresAt },
      update: { content: JSON.stringify(value), expiresAt },
    });
  } catch {
    // Cache write failure is non-fatal
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getOverviewInsight(teachers: TeacherSummary[]) {
  const cacheKey = "overview_insight";
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return OVERVIEW_FALLBACK;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: buildOverviewPrompt(teachers) }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    await setCached(cacheKey, parsed);
    return parsed;
  } catch {
    return OVERVIEW_FALLBACK;
  }
}

export async function getTeacherInsight(
  detail: TeacherDetail,
  schoolAvg: number
) {
  const cacheKey = `teacher_insight_${detail.teacherId}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return TEACHER_FALLBACK;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        { role: "user", content: buildTeacherPrompt(detail, schoolAvg) },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    await setCached(cacheKey, parsed);
    return parsed;
  } catch {
    return TEACHER_FALLBACK;
  }
}
