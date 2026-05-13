import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (user.role === "ORGANIZER") {
    redirect("/organizer/dashboard");
  }

  redirect("/profile");
}
