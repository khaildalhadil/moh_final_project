// Enum values shared by the database CHECK constraints, validation schemas and UI.
export const SOIL_TYPES = ["clay", "sandy", "loamy", "silty", "peaty", "chalky"] as const;
export const IRRIGATION_METHODS = ["drip", "sprinkler", "flood", "pivot", "manual"] as const;
export const FIELD_STATUSES = ["active", "fallow", "preparing"] as const;
export const CROP_STATUSES = ["planned", "planted", "growing", "harvested", "failed"] as const;
export const YIELD_UNITS = ["kg", "ton"] as const;
export const IRRIGATION_STATUSES = ["scheduled", "completed", "skipped", "cancelled"] as const;
export const ACTIVITY_TYPES = [
  "planting",
  "fertilizing",
  "spraying",
  "harvesting",
  "plowing",
  "weeding",
  "pruning",
  "maintenance",
  "other",
] as const;
export const ACTIVITY_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;
export const INVENTORY_CATEGORIES = ["seeds", "fertilizer", "pesticide", "equipment", "fuel", "other"] as const;
export const INVENTORY_UNITS = ["kg", "ton", "liter", "bag", "unit"] as const;
export const CURRENCIES = ["SAR", "AED", "KWD", "QAR", "OMR", "BHD", "EGP", "JOD", "SDG", "USD", "EUR", "INR"] as const;

export type SoilType = (typeof SOIL_TYPES)[number];
export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];
export type FieldStatus = (typeof FIELD_STATUSES)[number];
export type CropStatus = (typeof CROP_STATUSES)[number];
export type YieldUnit = (typeof YIELD_UNITS)[number];
export type IrrigationStatus = (typeof IRRIGATION_STATUSES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];
export type InventoryUnit = (typeof INVENTORY_UNITS)[number];
export type Currency = (typeof CURRENCIES)[number];
