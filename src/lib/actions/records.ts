"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { schemas, statusValues, type StatusTable, type TableName } from "@/lib/validations";
import { geocode } from "@/lib/weather";
import { getLocale } from "@/lib/i18n/server";
import type { ActionResult } from "./types";

function isTable(value: unknown): value is TableName {
  return typeof value === "string" && Object.hasOwn(schemas, value);
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

/**
 * Create (no id) or update (with id) a row in one of the whitelisted tables.
 * Input is validated with zod; ownership is enforced by Row Level Security.
 */
export async function saveRecord(table: TableName, values: unknown, id?: string): Promise<ActionResult> {
  if (!isTable(table)) return { ok: false, error: "generic" };

  const parsed = schemas[table].safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "validation", fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const data: Record<string, unknown> = { ...parsed.data };

  // Farms: fill missing coordinates from the location name (best effort).
  if (table === "farms" && data.latitude == null && data.longitude == null && typeof data.location === "string") {
    const point = await geocode(data.location, await getLocale());
    if (point) {
      data.latitude = point.latitude;
      data.longitude = point.longitude;
    }
  }

  const { error } = id
    ? await supabase.from(table).update(data).eq("id", id)
    : await supabase.from(table).insert({ ...data, user_id: user.id });

  if (error) {
    console.error(`[saveRecord:${table}]`, error.message);
    return { ok: false, error: "generic" };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteRecord(table: TableName, id: string): Promise<ActionResult> {
  if (!isTable(table) || typeof id !== "string") return { ok: false, error: "generic" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error(`[deleteRecord:${table}]`, error.message);
    return { ok: false, error: "generic" };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Quick status change (e.g. "mark irrigation as completed"). */
export async function setStatus(table: StatusTable, id: string, status: string): Promise<ActionResult> {
  const allowed = statusValues[table] as readonly string[] | undefined;
  if (!allowed || !allowed.includes(status)) return { ok: false, error: "validation" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const patch: Record<string, unknown> = { status };
  if (table === "crops" && status === "harvested") {
    patch.actual_harvest_date = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) {
    console.error(`[setStatus:${table}]`, error.message);
    return { ok: false, error: "generic" };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
