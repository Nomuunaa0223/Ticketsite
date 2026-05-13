import { redirect } from "next/navigation";
import { requireExactRole } from "@/lib/auth";

export default async function OrganizerDashboardAliasPage() {
  const user = await requireExactRole("ORGANIZER");
  if (!user.organizerProfile) redirect("/");
  redirect("/dashboard/organizer");
}
