import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export async function getCurrentLang(): Promise<Lang> {
  const value = (await cookies()).get("lang")?.value;
  return value === "en" || value === "mn" ? value : "mn";
}
