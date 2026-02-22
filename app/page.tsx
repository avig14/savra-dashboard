import { redirect } from "next/navigation";

// Root → redirect to dashboard (auth middleware handles /dashboard protection)
export default function Home() {
  redirect("/dashboard");
}
