import type {
  ActivityStatus,
  ActivityType,
  CropStatus,
  FieldStatus,
  InventoryCategory,
  InventoryUnit,
  IrrigationMethod,
  IrrigationStatus,
  Priority,
  SoilType,
  YieldUnit,
} from "./constants";

type Timestamps = { id: string; user_id: string; created_at: string; updated_at: string };

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  currency: string;
  created_at: string;
};

export type Farm = Timestamps & {
  name: string;
  location: string | null;
  area: number | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
};

export type Field = Timestamps & {
  farm_id: string;
  name: string;
  area: number | null;
  soil_type: SoilType | null;
  irrigation_type: IrrigationMethod | null;
  status: FieldStatus;
};

export type Crop = Timestamps & {
  field_id: string;
  name: string;
  variety: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  actual_harvest_date: string | null;
  status: CropStatus;
  expected_yield: number | null;
  actual_yield: number | null;
  yield_unit: YieldUnit;
  notes: string | null;
};

export type IrrigationSchedule = Timestamps & {
  field_id: string;
  scheduled_date: string;
  start_time: string | null;
  duration_minutes: number | null;
  water_amount: number | null;
  method: IrrigationMethod;
  status: IrrigationStatus;
  notes: string | null;
};

export type Activity = Timestamps & {
  farm_id: string;
  field_id: string | null;
  title: string;
  type: ActivityType;
  scheduled_date: string;
  status: ActivityStatus;
  priority: Priority;
  cost: number;
  assigned_to: string | null;
  notes: string | null;
};

export type InventoryItem = Timestamps & {
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: InventoryUnit;
  min_quantity: number | null;
  unit_cost: number | null;
  supplier: string | null;
  notes: string | null;
};

/** Minimal shapes used to populate <select> options and resolve names in tables. */
export type FarmOption = { id: string; name: string };
export type FieldOption = { id: string; name: string; farm_id: string };
