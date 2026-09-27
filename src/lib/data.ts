import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  Crop,
  Farm,
  FarmOption,
  Field,
  FieldOption,
  InventoryItem,
  IrrigationSchedule,
  Profile,
} from "@/lib/types";
import { addDaysISO, num } from "@/lib/utils";

// Server-only data loaders. Row Level Security guarantees each query only returns the signed-in user's rows.

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Profile | null;
});

export async function getFarms(): Promise<Farm[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("farms").select("*").order("created_at", { ascending: true });
  return (data ?? []) as Farm[];
}

export async function getFields(): Promise<Field[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fields").select("*").order("created_at", { ascending: true });
  return (data ?? []) as Field[];
}

export async function getFarmOptions(): Promise<FarmOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("farms").select("id, name").order("name");
  return (data ?? []) as FarmOption[];
}

export async function getFieldOptions(): Promise<FieldOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fields").select("id, name, farm_id").order("name");
  return (data ?? []) as FieldOption[];
}

export async function getCrops(): Promise<Crop[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("crops").select("*").order("planting_date", { ascending: false, nullsFirst: false });
  return (data ?? []) as Crop[];
}

export async function getIrrigation(): Promise<IrrigationSchedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("irrigation_schedules")
    .select("*")
    .order("scheduled_date", { ascending: false })
    .order("start_time", { ascending: true, nullsFirst: false });
  return (data ?? []) as IrrigationSchedule[];
}

export async function getActivities(): Promise<Activity[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select("*").order("scheduled_date", { ascending: false });
  return ((data ?? []) as Activity[]).map((a) => ({ ...a, cost: num(a.cost) }));
}

export async function getInventory(): Promise<InventoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("inventory_items").select("*").order("name");
  return (data ?? []) as InventoryItem[];
}

export function isLowStock(item: Pick<InventoryItem, "quantity" | "min_quantity">) {
  return item.min_quantity != null && num(item.quantity) <= num(item.min_quantity);
}

/** Counts for the notification bell. */
export async function getAlerts(today: string) {
  const supabase = await createClient();
  const [irrigation, overdue, inventory, harvest] = await Promise.all([
    supabase
      .from("irrigation_schedules")
      .select("id", { count: "exact", head: true })
      .eq("scheduled_date", today)
      .eq("status", "scheduled"),
    supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .lt("scheduled_date", today)
      .in("status", ["pending", "in_progress"]),
    supabase.from("inventory_items").select("quantity, min_quantity"),
    supabase
      .from("crops")
      .select("id", { count: "exact", head: true })
      .in("status", ["planted", "growing"])
      .gte("expected_harvest_date", today)
      .lte("expected_harvest_date", addDaysISO(today, 14)),
  ]);

  return {
    irrigationToday: irrigation.count ?? 0,
    overdueTasks: overdue.count ?? 0,
    lowStock: (inventory.data ?? []).filter(isLowStock).length,
    harvestSoon: harvest.count ?? 0,
  };
}
