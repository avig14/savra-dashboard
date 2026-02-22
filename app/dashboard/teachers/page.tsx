import { getAllTeachers } from "@/lib/data/aggregator";
import { TeacherCard } from "@/components/dashboard/TeacherCard";

export default async function TeachersPage() {
  const teachers = await getAllTeachers();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
          <span className="bg-violet-100 text-violet-700 rounded-full px-3 py-1 text-sm font-semibold">
            {teachers.length} active
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Week of Feb 11–18, 2026
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {teachers.map((teacher) => (
          <TeacherCard key={teacher.teacherId} teacher={teacher} />
        ))}
      </div>
    </div>
  );
}
