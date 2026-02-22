import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Belt-and-suspenders auth check (middleware handles it too)
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <Sidebar user={session.user} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
