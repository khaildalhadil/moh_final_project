import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { ACTIVITY_STATUSES, ACTIVITY_TYPES, CROP_STATUSES, INVENTORY_CATEGORIES } from "@/lib/constants";
import type { Activity, Crop, InventoryItem, IrrigationSchedule } from "@/lib/types";
import { lastMonths, monthLabel, num } from "@/lib/utils";

// Pure aggregation helpers shared by the dashboard and the reports page.

export function monthlyCosts(activities: Activity[], locale: Locale, months = 6) {
  return lastMonths(months).map((key) => ({
    label: monthLabel(key, locale),
    value: activities
      .filter((a) => a.status !== "cancelled" && a.scheduled_date.startsWith(key))
      .reduce((s, a) => s + num(a.cost), 0),
  }));
}

export function monthlyWater(irrigation: IrrigationSchedule[], locale: Locale, months = 6) {
  return lastMonths(months).map((key) => ({
    label: monthLabel(key, locale),
    value: Math.round(
      irrigation
        .filter((i) => i.status === "completed" && i.scheduled_date.startsWith(key))
        .reduce((s, i) => s + num(i.water_amount), 0),
    ),
  }));
}

export function cropsByStatus(crops: Crop[], t: Dictionary) {
  return CROP_STATUSES.map((status) => ({
    label: t.enums.cropStatus[status],
    value: crops.filter((c) => c.status === status).length,
  }));
}

export function costsByType(activities: Activity[], t: Dictionary) {
  return ACTIVITY_TYPES.map((type) => ({
    label: t.enums.activityType[type],
    value: activities.filter((a) => a.type === type && a.status !== "cancelled").reduce((s, a) => s + num(a.cost), 0),
  }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function tasksByStatus(activities: Activity[], t: Dictionary) {
  return ACTIVITY_STATUSES.map((status) => ({
    label: t.enums.activityStatus[status],
    value: activities.filter((a) => a.status === status).length,
  }));
}

export function inventoryByCategory(items: InventoryItem[], t: Dictionary) {
  return INVENTORY_CATEGORIES.map((category) => ({
    label: t.enums.category[category],
    value: items.filter((i) => i.category === category).reduce((s, i) => s + num(i.quantity) * num(i.unit_cost), 0),
  }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Expected vs actual yield per crop name (kg), for harvested crops. */
export function yieldByCrop(crops: Crop[]) {
  const map = new Map<string, { expected: number; actual: number }>();
  for (const c of crops) {
    if (c.status !== "harvested") continue;
    const factor = c.yield_unit === "ton" ? 1000 : 1;
    const entry = map.get(c.name) ?? { expected: 0, actual: 0 };
    entry.expected += num(c.expected_yield) * factor;
    entry.actual += num(c.actual_yield) * factor;
    map.set(c.name, entry);
  }
  return [...map.entries()].map(([label, v]) => ({ label, expected: Math.round(v.expected), actual: Math.round(v.actual) }));
}
