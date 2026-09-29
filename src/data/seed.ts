import type { Activity, Crop, Farm, Field, InventoryItem, IrrigationSchedule } from "@/lib/types";
import { uuid } from "@/lib/uid";

/**
 * Seed data — a realistic sample farm used instead of a database.
 * Dates are relative to "today" so the demo always looks current.
 * Text is generated in the user's language (Arabic or English).
 */

export type Tables = {
  farms: Farm[];
  fields: Field[];
  crops: Crop[];
  irrigation_schedules: IrrigationSchedule[];
  activities: Activity[];
  inventory_items: InventoryItem[];
};

export function emptyTables(): Tables {
  return { farms: [], fields: [], crops: [], irrigation_schedules: [], activities: [], inventory_items: [] };
}

/** yyyy-mm-dd for today + n days */
function day(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function buildSeed(userId: string, locale: "ar" | "en"): Tables {
  const ar = locale === "ar";
  const L = (arabic: string, english: string) => (ar ? arabic : english);
  const now = new Date().toISOString();
  const base = () => ({ id: uuid(), user_id: userId, created_at: now, updated_at: now });

  // ---- farms ----
  const farmA: Farm = {
    ...base(),
    name: L("مزرعة الواحة الخضراء", "Green Oasis Farm"),
    location: L("الخرج، الرياض", "Al-Kharj, Riyadh"),
    area: 42.5,
    latitude: 24.155,
    longitude: 47.334,
    description: L("مزرعة حبوب وخضروات تعتمد على الري بالتنقيط والمحوري.", "Cereal and vegetable farm using drip and center-pivot irrigation."),
  };
  const farmB: Farm = {
    ...base(),
    name: L("بستان النخيل", "Palm Grove Orchard"),
    location: L("الأحساء", "Al-Ahsa"),
    area: 18,
    latitude: 25.383,
    longitude: 49.586,
    description: L("بستان نخيل وأشجار فاكهة.", "Date palms and fruit trees."),
  };

  // ---- fields ----
  const field = (farm: Farm, name: string, area: number, soil: Field["soil_type"], irrigation: Field["irrigation_type"], status: Field["status"]): Field => ({
    ...base(),
    farm_id: farm.id,
    name,
    area,
    soil_type: soil,
    irrigation_type: irrigation,
    status,
  });
  const north = field(farmA, L("الحقل الشمالي (أ)", "North Field (A)"), 15, "loamy", "pivot", "active");
  const east = field(farmA, L("الحقل الشرقي (ب)", "East Field (B)"), 12, "sandy", "drip", "active");
  const greenhouse = field(farmA, L("البيت المحمي 1", "Greenhouse 1"), 2.5, "loamy", "drip", "active");
  const south = field(farmA, L("الحقل الجنوبي (ج)", "South Field (C)"), 10, "clay", "flood", "fallow");
  const palms = field(farmB, L("قطاع النخيل", "Palm Section"), 11, "sandy", "drip", "active");
  const citrus = field(farmB, L("قطاع الحمضيات", "Citrus Section"), 7, "loamy", "sprinkler", "preparing");

  // ---- crops ----
  const crop = (f: Field, c: Partial<Crop> & Pick<Crop, "name" | "status">): Crop => ({
    ...base(),
    field_id: f.id,
    variety: null,
    planting_date: null,
    expected_harvest_date: null,
    actual_harvest_date: null,
    expected_yield: null,
    actual_yield: null,
    yield_unit: "kg",
    notes: null,
    ...c,
  });
  const crops: Crop[] = [
    crop(north, { name: L("قمح", "Wheat"), variety: L("يكورا روجو", "Yecora Rojo"), planting_date: day(-95), expected_harvest_date: day(12), status: "growing", expected_yield: 60000 }),
    crop(east, { name: L("طماطم", "Tomato"), variety: L("هجين 448", "Hybrid 448"), planting_date: day(-40), expected_harvest_date: day(35), status: "growing", expected_yield: 36000 }),
    crop(greenhouse, { name: L("خيار", "Cucumber"), variety: L("بيت ألفا", "Beit Alpha"), planting_date: day(-20), expected_harvest_date: day(25), status: "planted", expected_yield: 9000 }),
    crop(palms, { name: L("تمر خلاص", "Khalas Dates"), variety: L("خلاص", "Khalas"), planting_date: day(-200), expected_harvest_date: day(-10), actual_harvest_date: day(-8), status: "harvested", expected_yield: 22000, actual_yield: 24500 }),
    crop(east, { name: L("بصل", "Onion"), variety: L("أحمر", "Red"), planting_date: day(-160), expected_harvest_date: day(-45), actual_harvest_date: day(-44), status: "harvested", expected_yield: 30000, actual_yield: 27800 }),
    crop(citrus, { name: L("ليمون", "Lemon"), variety: L("بلدي", "Local"), planting_date: day(20), expected_harvest_date: day(200), status: "planned", expected_yield: 8000 }),
  ];

  // ---- irrigation: every 5 days for the past 5 months + next 10 days ----
  const irrigation: IrrigationSchedule[] = [];
  const plan = [
    { field: north, method: "pivot", water: 180, duration: 120, time: "05:30" },
    { field: east, method: "drip", water: 45, duration: 90, time: "06:00" },
    { field: greenhouse, method: "drip", water: 8, duration: 30, time: "07:00" },
    { field: palms, method: "drip", water: 60, duration: 100, time: "17:30" },
  ] as const;
  for (let offset = -150; offset <= 10; offset += 5) {
    plan.forEach((p, i) => {
      const n = offset + i;
      irrigation.push({
        ...base(),
        field_id: p.field.id,
        scheduled_date: day(n),
        start_time: p.time,
        duration_minutes: p.duration,
        water_amount: Math.round(p.water * (0.85 + ((offset + 150 + i * 7) % 30) / 100)),
        method: p.method,
        status: n < 0 ? (n % 7 === 0 ? "skipped" : "completed") : "scheduled",
        notes: null,
      });
    });
  }
  irrigation.push({
    ...base(),
    field_id: north.id,
    scheduled_date: day(0),
    start_time: "16:00",
    duration_minutes: 60,
    water_amount: 90,
    method: "pivot",
    status: "scheduled",
    notes: L("ري تكميلي بسبب ارتفاع الحرارة", "Extra irrigation due to heat"),
  });

  // ---- activities ----
  const worker1 = L("أحمد", "Ahmed");
  const worker2 = L("سالم", "Salem");
  const act = (farm: Farm, f: Field | null, a: Pick<Activity, "title" | "type" | "scheduled_date" | "status" | "priority" | "cost"> & { assigned_to?: string }): Activity => ({
    ...base(),
    farm_id: farm.id,
    field_id: f?.id ?? null,
    assigned_to: null,
    notes: null,
    ...a,
  });
  const activities: Activity[] = [
    act(farmA, north, { title: L("حراثة الحقل الشمالي", "Plow the north field"), type: "plowing", scheduled_date: day(-110), status: "completed", priority: "high", cost: 3200, assigned_to: worker1 }),
    act(farmA, north, { title: L("زراعة القمح", "Sow wheat"), type: "planting", scheduled_date: day(-95), status: "completed", priority: "high", cost: 5400, assigned_to: worker1 }),
    act(farmA, north, { title: L("تسميد نيتروجيني (يوريا)", "Nitrogen fertilizing (urea)"), type: "fertilizing", scheduled_date: day(-60), status: "completed", priority: "medium", cost: 2100, assigned_to: worker2 }),
    act(farmA, east, { title: L("شتل الطماطم", "Transplant tomatoes"), type: "planting", scheduled_date: day(-40), status: "completed", priority: "high", cost: 4300, assigned_to: worker2 }),
    act(farmA, east, { title: L("رش وقائي ضد الذبابة البيضاء", "Preventive spray for whitefly"), type: "spraying", scheduled_date: day(-15), status: "completed", priority: "medium", cost: 950, assigned_to: worker2 }),
    act(farmA, greenhouse, { title: L("صيانة شبكة التنقيط", "Drip network maintenance"), type: "maintenance", scheduled_date: day(-3), status: "pending", priority: "high", cost: 700, assigned_to: worker1 }),
    act(farmA, east, { title: L("إزالة الأعشاب الضارة", "Weed removal"), type: "weeding", scheduled_date: day(1), status: "in_progress", priority: "medium", cost: 600, assigned_to: worker2 }),
    act(farmA, north, { title: L("تسميد بوتاسي قبل الحصاد", "Potassium fertilizing before harvest"), type: "fertilizing", scheduled_date: day(3), status: "pending", priority: "medium", cost: 1800, assigned_to: worker1 }),
    act(farmA, north, { title: L("حصاد القمح", "Harvest wheat"), type: "harvesting", scheduled_date: day(12), status: "pending", priority: "high", cost: 6500, assigned_to: worker1 }),
    act(farmB, palms, { title: L("تقليم النخيل", "Palm pruning"), type: "pruning", scheduled_date: day(-130), status: "completed", priority: "low", cost: 2600, assigned_to: worker2 }),
    act(farmB, palms, { title: L("جني التمور", "Date harvest"), type: "harvesting", scheduled_date: day(-8), status: "completed", priority: "high", cost: 7200, assigned_to: worker2 }),
    act(farmB, citrus, { title: L("تجهيز قطاع الحمضيات", "Prepare citrus section"), type: "plowing", scheduled_date: day(7), status: "pending", priority: "low", cost: 1500 }),
  ];

  // ---- inventory ----
  const item = (i: Pick<InventoryItem, "name" | "category" | "quantity" | "unit" | "min_quantity" | "unit_cost"> & { supplier?: string }): InventoryItem => ({
    ...base(),
    supplier: null,
    notes: null,
    ...i,
  });
  const inventory: InventoryItem[] = [
    item({ name: L("بذور قمح", "Wheat seeds"), category: "seeds", quantity: 350, unit: "kg", min_quantity: 200, unit_cost: 4.5, supplier: L("المؤسسة العامة للحبوب", "Grain Supply Co.") }),
    item({ name: L("سماد يوريا 46%", "Urea fertilizer 46%"), category: "fertilizer", quantity: 12, unit: "bag", min_quantity: 20, unit_cost: 95, supplier: L("سابك للمغذيات", "AgriNutrients") }),
    item({ name: L("سماد NPK 20-20-20", "NPK fertilizer 20-20-20"), category: "fertilizer", quantity: 40, unit: "bag", min_quantity: 15, unit_cost: 140 }),
    item({ name: L("مبيد حشري (إيميداكلوبريد)", "Insecticide (Imidacloprid)"), category: "pesticide", quantity: 6, unit: "liter", min_quantity: 10, unit_cost: 85 }),
    item({ name: L("ديزل للمضخات", "Diesel for pumps"), category: "fuel", quantity: 900, unit: "liter", min_quantity: 500, unit_cost: 1.15 }),
    item({ name: L("خراطيم تنقيط", "Drip hoses"), category: "equipment", quantity: 25, unit: "unit", min_quantity: 10, unit_cost: 60 }),
  ];

  return {
    farms: [farmA, farmB],
    fields: [north, east, greenhouse, south, palms, citrus],
    crops,
    irrigation_schedules: irrigation,
    activities,
    inventory_items: inventory,
  };
}
