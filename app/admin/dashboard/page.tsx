import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function AdminDashboardAliasPage() {
  await requireRole("ADMIN");
  redirect("/dashboard/admin");
}
