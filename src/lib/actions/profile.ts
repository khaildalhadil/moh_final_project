"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations";
import type { ActionResult } from "./types";

export async function updateProfile(values: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "validation", fieldErrors };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase.from("profiles").upsert({ id: data.user.id, ...parsed.data });
  if (error) {
    console.error("[updateProfile]", error.message);
    return { ok: false, error: "generic" };
  }

  // Keep auth metadata in sync so the name also shows up in the Supabase dashboard.
  await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name, phone: parsed.data.phone } });

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
