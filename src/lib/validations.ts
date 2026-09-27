import { z } from "zod";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES,
  CROP_STATUSES,
  FIELD_STATUSES,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  IRRIGATION_METHODS,
  IRRIGATION_STATUSES,
  PRIORITIES,
  SOIL_TYPES,
  YIELD_UNITS,
} from "./constants";

// ---------- building blocks ----------
const name = z.string().trim().min(1).max(120);
const optText = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);
const optNumber = z.number().finite().nonnegative().max(1e12).nullish().transform((v) => v ?? null);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optDate = isoDate.nullish().transform((v) => v || null);
const optTime = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .nullish()
  .transform((v) => v || null);
const id = z.uuid();

// ---------- per-table schemas ----------
export const farmSchema = z.object({
  name: z.string().trim().min(2).max(120),
  location: optText(200),
  area: optNumber,
  latitude: z.number().min(-90).max(90).nullish().transform((v) => v ?? null),
  longitude: z.number().min(-180).max(180).nullish().transform((v) => v ?? null),
  description: optText(),
});

export const fieldSchema = z.object({
  farm_id: id,
  name,
  area: optNumber,
  soil_type: z.enum(SOIL_TYPES).nullish().transform((v) => v ?? null),
  irrigation_type: z.enum(IRRIGATION_METHODS).nullish().transform((v) => v ?? null),
  status: z.enum(FIELD_STATUSES),
});

export const cropSchema = z
  .object({
    field_id: id,
    name,
    variety: optText(120),
    planting_date: optDate,
    expected_harvest_date: optDate,
    actual_harvest_date: optDate,
    status: z.enum(CROP_STATUSES),
    expected_yield: optNumber,
    actual_yield: optNumber,
    yield_unit: z.enum(YIELD_UNITS),
    notes: optText(),
  })
  .refine(
    (c) => !c.planting_date || !c.expected_harvest_date || c.expected_harvest_date >= c.planting_date,
    { path: ["expected_harvest_date"], message: "harvestBeforePlanting" },
  );

export const irrigationSchema = z.object({
  field_id: id,
  scheduled_date: isoDate,
  start_time: optTime,
  duration_minutes: z.number().int().nonnegative().max(10000).nullish().transform((v) => v ?? null),
  water_amount: optNumber,
  method: z.enum(IRRIGATION_METHODS),
  status: z.enum(IRRIGATION_STATUSES),
  notes: optText(),
});

export const activitySchema = z.object({
  farm_id: id,
  field_id: id.nullish().transform((v) => v ?? null),
  title: z.string().trim().min(1).max(160),
  type: z.enum(ACTIVITY_TYPES),
  scheduled_date: isoDate,
  status: z.enum(ACTIVITY_STATUSES),
  priority: z.enum(PRIORITIES),
  cost: optNumber.transform((v) => v ?? 0),
  assigned_to: optText(120),
  notes: optText(),
});

export const inventorySchema = z.object({
  name,
  category: z.enum(INVENTORY_CATEGORIES),
  quantity: z.number().finite().nonnegative().max(1e12),
  unit: z.enum(INVENTORY_UNITS),
  min_quantity: optNumber,
  unit_cost: optNumber,
  supplier: optText(120),
  notes: optText(),
});

export const schemas = {
  farms: farmSchema,
  fields: fieldSchema,
  crops: cropSchema,
  irrigation_schedules: irrigationSchema,
  activities: activitySchema,
  inventory_items: inventorySchema,
} as const;

export type TableName = keyof typeof schemas;

/** Status columns that can be changed with a single quick action. */
export const statusValues = {
  crops: CROP_STATUSES,
  irrigation_schedules: IRRIGATION_STATUSES,
  activities: ACTIVITY_STATUSES,
} as const;

export type StatusTable = keyof typeof statusValues;

export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: optText(30),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
