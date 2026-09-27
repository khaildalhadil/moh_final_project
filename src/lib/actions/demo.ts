"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import type { ActionResult } from "./types";

/** yyyy-mm-dd for today + n days */
function day(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Inserts a realistic sample farm (in the user's language) so the whole system
 * can be demonstrated in one click: fields, crops, irrigation, activities and inventory.
 */
export async function loadDemoData(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { ok: false, error: "unauthorized" };

  const ar = (await getLocale()) === "ar";
  const L = (arabic: string, english: string) => (ar ? arabic : english);
  const uid = user.id;

  try {
    // ---- farms ----
    const { data: farms, error: farmErr } = await supabase
      .from("farms")
      .insert([
        {
          user_id: uid,
          name: L("مزرعة الواحة الخضراء", "Green Oasis Farm"),
          location: L("الخرج، الرياض", "Al-Kharj, Riyadh"),
          area: 42.5,
          latitude: 24.155,
          longitude: 47.334,
          description: L("مزرعة حبوب وخضروات تعتمد على الري بالتنقيط والمحوري.", "Cereal and vegetable farm using drip and center-pivot irrigation."),
        },
        {
          user_id: uid,
          name: L("بستان النخيل", "Palm Grove Orchard"),
          location: L("الأحساء", "Al-Ahsa"),
          area: 18,
          latitude: 25.383,
          longitude: 49.586,
          description: L("بستان نخيل وأشجار فاكهة.", "Date palms and fruit trees."),
        },
      ])
      .select("id");
    if (farmErr || !farms) throw farmErr;
    const [farmA, farmB] = farms.map((f) => f.id as string);

    // ---- fields ----
    const { data: fields, error: fieldErr } = await supabase
      .from("fields")
      .insert([
        { user_id: uid, farm_id: farmA, name: L("الحقل الشمالي (أ)", "North Field (A)"), area: 15, soil_type: "loamy", irrigation_type: "pivot", status: "active" },
        { user_id: uid, farm_id: farmA, name: L("الحقل الشرقي (ب)", "East Field (B)"), area: 12, soil_type: "sandy", irrigation_type: "drip", status: "active" },
        { user_id: uid, farm_id: farmA, name: L("البيت المحمي 1", "Greenhouse 1"), area: 2.5, soil_type: "loamy", irrigation_type: "drip", status: "active" },
        { user_id: uid, farm_id: farmA, name: L("الحقل الجنوبي (ج)", "South Field (C)"), area: 10, soil_type: "clay", irrigation_type: "flood", status: "fallow" },
        { user_id: uid, farm_id: farmB, name: L("قطاع النخيل", "Palm Section"), area: 11, soil_type: "sandy", irrigation_type: "drip", status: "active" },
        { user_id: uid, farm_id: farmB, name: L("قطاع الحمضيات", "Citrus Section"), area: 7, soil_type: "loamy", irrigation_type: "sprinkler", status: "preparing" },
      ])
      .select("id");
    if (fieldErr || !fields) throw fieldErr;
    const [north, east, greenhouse, , palms, citrus] = fields.map((f) => f.id as string);

    // ---- crops ----
    const { error: cropErr } = await supabase.from("crops").insert([
      { user_id: uid, field_id: north, name: L("قمح", "Wheat"), variety: L("يكورا روجو", "Yecora Rojo"), planting_date: day(-95), expected_harvest_date: day(12), status: "growing", expected_yield: 60000, yield_unit: "kg" },
      { user_id: uid, field_id: east, name: L("طماطم", "Tomato"), variety: L("هجين 448", "Hybrid 448"), planting_date: day(-40), expected_harvest_date: day(35), status: "growing", expected_yield: 36000, yield_unit: "kg" },
      { user_id: uid, field_id: greenhouse, name: L("خيار", "Cucumber"), variety: L("بيت ألفا", "Beit Alpha"), planting_date: day(-20), expected_harvest_date: day(25), status: "planted", expected_yield: 9000, yield_unit: "kg" },
      { user_id: uid, field_id: palms, name: L("تمر خلاص", "Khalas Dates"), variety: L("خلاص", "Khalas"), planting_date: day(-200), expected_harvest_date: day(-10), actual_harvest_date: day(-8), status: "harvested", expected_yield: 22000, actual_yield: 24500, yield_unit: "kg" },
      { user_id: uid, field_id: east, name: L("بصل", "Onion"), variety: L("أحمر", "Red"), planting_date: day(-160), expected_harvest_date: day(-45), actual_harvest_date: day(-44), status: "harvested", expected_yield: 30000, actual_yield: 27800, yield_unit: "kg" },
      { user_id: uid, field_id: citrus, name: L("ليمون", "Lemon"), variety: L("بلدي", "Local"), planting_date: day(20), expected_harvest_date: day(200), status: "planned", expected_yield: 8000, yield_unit: "kg" },
    ]);
    if (cropErr) throw cropErr;

    // ---- irrigation (past 5 months + next 10 days) ----
    const irrigation: Record<string, unknown>[] = [];
    const plan = [
      { field: north, method: "pivot", water: 180, duration: 120, time: "05:30" },
      { field: east, method: "drip", water: 45, duration: 90, time: "06:00" },
      { field: greenhouse, method: "drip", water: 8, duration: 30, time: "07:00" },
      { field: palms, method: "drip", water: 60, duration: 100, time: "17:30" },
    ];
    for (let offset = -150; offset <= 10; offset += 5) {
      plan.forEach((p, i) => {
        const date = day(offset + i);
        const past = offset + i < 0;
        irrigation.push({
          user_id: uid,
          field_id: p.field,
          scheduled_date: date,
          start_time: p.time,
          duration_minutes: p.duration,
          water_amount: Math.round(p.water * (0.85 + ((offset + 150 + i * 7) % 30) / 100)),
          method: p.method,
          status: past ? ((offset + i) % 7 === 0 ? "skipped" : "completed") : "scheduled",
        });
      });
    }
    irrigation.push({ user_id: uid, field_id: north, scheduled_date: day(0), start_time: "16:00", duration_minutes: 60, water_amount: 90, method: "pivot", status: "scheduled", notes: L("ري تكميلي بسبب ارتفاع الحرارة", "Extra irrigation due to heat") });
    const { error: irrErr } = await supabase.from("irrigation_schedules").insert(irrigation);
    if (irrErr) throw irrErr;

    // ---- activities (costs spread over 6 months) ----
    const worker1 = L("أحمد", "Ahmed");
    const worker2 = L("سالم", "Salem");
    const { error: actErr } = await supabase.from("activities").insert([
      { user_id: uid, farm_id: farmA, field_id: north, title: L("حراثة الحقل الشمالي", "Plow the north field"), type: "plowing", scheduled_date: day(-110), status: "completed", priority: "high", cost: 3200, assigned_to: worker1 },
      { user_id: uid, farm_id: farmA, field_id: north, title: L("زراعة القمح", "Sow wheat"), type: "planting", scheduled_date: day(-95), status: "completed", priority: "high", cost: 5400, assigned_to: worker1 },
      { user_id: uid, farm_id: farmA, field_id: north, title: L("تسميد نيتروجيني (يوريا)", "Nitrogen fertilizing (urea)"), type: "fertilizing", scheduled_date: day(-60), status: "completed", priority: "medium", cost: 2100, assigned_to: worker2 },
      { user_id: uid, farm_id: farmA, field_id: east, title: L("شتل الطماطم", "Transplant tomatoes"), type: "planting", scheduled_date: day(-40), status: "completed", priority: "high", cost: 4300, assigned_to: worker2 },
      { user_id: uid, farm_id: farmA, field_id: east, title: L("رش وقائي ضد الذبابة البيضاء", "Preventive spray for whitefly"), type: "spraying", scheduled_date: day(-15), status: "completed", priority: "medium", cost: 950, assigned_to: worker2 },
      { user_id: uid, farm_id: farmA, field_id: greenhouse, title: L("صيانة شبكة التنقيط", "Drip network maintenance"), type: "maintenance", scheduled_date: day(-3), status: "pending", priority: "high", cost: 700, assigned_to: worker1 },
      { user_id: uid, farm_id: farmA, field_id: east, title: L("إزالة الأعشاب الضارة", "Weed removal"), type: "weeding", scheduled_date: day(1), status: "in_progress", priority: "medium", cost: 600, assigned_to: worker2 },
      { user_id: uid, farm_id: farmA, field_id: north, title: L("تسميد بوتاسي قبل الحصاد", "Potassium fertilizing before harvest"), type: "fertilizing", scheduled_date: day(3), status: "pending", priority: "medium", cost: 1800, assigned_to: worker1 },
      { user_id: uid, farm_id: farmA, field_id: north, title: L("حصاد القمح", "Harvest wheat"), type: "harvesting", scheduled_date: day(12), status: "pending", priority: "high", cost: 6500, assigned_to: worker1 },
      { user_id: uid, farm_id: farmB, field_id: palms, title: L("تقليم النخيل", "Palm pruning"), type: "pruning", scheduled_date: day(-130), status: "completed", priority: "low", cost: 2600, assigned_to: worker2 },
      { user_id: uid, farm_id: farmB, field_id: palms, title: L("جني التمور", "Date harvest"), type: "harvesting", scheduled_date: day(-8), status: "completed", priority: "high", cost: 7200, assigned_to: worker2 },
      { user_id: uid, farm_id: farmB, field_id: citrus, title: L("تجهيز قطاع الحمضيات", "Prepare citrus section"), type: "plowing", scheduled_date: day(7), status: "pending", priority: "low", cost: 1500 },
    ]);
    if (actErr) throw actErr;

    // ---- inventory ----
    const { error: invErr } = await supabase.from("inventory_items").insert([
      { user_id: uid, name: L("بذور قمح", "Wheat seeds"), category: "seeds", quantity: 350, unit: "kg", min_quantity: 200, unit_cost: 4.5, supplier: L("المؤسسة العامة للحبوب", "Grain Supply Co.") },
      { user_id: uid, name: L("سماد يوريا 46%", "Urea fertilizer 46%"), category: "fertilizer", quantity: 12, unit: "bag", min_quantity: 20, unit_cost: 95, supplier: L("سابك للمغذيات", "AgriNutrients") },
      { user_id: uid, name: L("سماد NPK 20-20-20", "NPK fertilizer 20-20-20"), category: "fertilizer", quantity: 40, unit: "bag", min_quantity: 15, unit_cost: 140 },
      { user_id: uid, name: L("مبيد حشري (إيميداكلوبريد)", "Insecticide (Imidacloprid)"), category: "pesticide", quantity: 6, unit: "liter", min_quantity: 10, unit_cost: 85 },
      { user_id: uid, name: L("ديزل للمضخات", "Diesel for pumps"), category: "fuel", quantity: 900, unit: "liter", min_quantity: 500, unit_cost: 1.15 },
      { user_id: uid, name: L("خراطيم تنقيط", "Drip hoses"), category: "equipment", quantity: 25, unit: "unit", min_quantity: 10, unit_cost: 60 },
    ]);
    if (invErr) throw invErr;
  } catch (error) {
    console.error("[loadDemoData]", error);
    return { ok: false, error: "generic" };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
