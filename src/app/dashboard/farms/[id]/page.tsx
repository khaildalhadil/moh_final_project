import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Droplets, LandPlot, MapPin, Ruler, Sprout } from "lucide-react";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { StatusBadge } from "@/components/status";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/misc";
import { getProfile } from "@/lib/data";
import { enumLabel } from "@/lib/enums";
import { getI18n } from "@/lib/i18n/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Activity, Crop, Farm, Field } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber, num, todayISO } from "@/lib/utils";
import { getWeather } from "@/lib/weather";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadFarm(id: string) {
  if (!uuidPattern.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("farms").select("*").eq("id", id).maybeSingle();
  return data as Farm | null;
}

export async function generateMetadata({ params }: PageProps<"/dashboard/farms/[id]">): Promise<Metadata> {
  const farm = await loadFarm((await params).id);
  return { title: farm?.name };
}

export default async function FarmDetailsPage({ params }: PageProps<"/dashboard/farms/[id]">) {
  const { id } = await params;
  const farm = await loadFarm(id);
  if (!farm) notFound();

  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: fieldsData }, { data: activitiesData }, profile] = await Promise.all([
    supabase.from("fields").select("*").eq("farm_id", id).order("name"),
    supabase.from("activities").select("*").eq("farm_id", id).order("scheduled_date", { ascending: false }).limit(6),
    user ? getProfile(user.id) : null,
  ]);
  const fields = (fieldsData ?? []) as Field[];
  const activities = (activitiesData ?? []) as Activity[];
  const fieldIds = fields.map((f) => f.id);

  const [{ data: cropsData }, { count: irrigationCount }] = await Promise.all([
    fieldIds.length
      ? supabase.from("crops").select("*").in("field_id", fieldIds).in("status", ["planted", "growing"])
      : Promise.resolve({ data: [] }),
    fieldIds.length
      ? supabase
          .from("irrigation_schedules")
          .select("id", { count: "exact", head: true })
          .in("field_id", fieldIds)
          .eq("status", "scheduled")
          .gte("scheduled_date", today)
      : Promise.resolve({ count: 0 }),
  ]);
  const crops = (cropsData ?? []) as Crop[];
  const cropsByField = new Map<string, Crop[]>();
  crops.forEach((c) => cropsByField.set(c.field_id, [...(cropsByField.get(c.field_id) ?? []), c]));

  const hasCoords = farm.latitude != null && farm.longitude != null;
  const weather = hasCoords ? await getWeather(num(farm.latitude), num(farm.longitude)) : null;
  const currency = profile?.currency ?? "SAR";

  return (
    <>
      <Link
        href="/dashboard/farms"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t.nav.farms}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{farm.name}</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {farm.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {farm.location}
            </span>
          )}
          {hasCoords && (
            <span dir="ltr" className="tabular-nums">
              {num(farm.latitude).toFixed(4)}, {num(farm.longitude).toFixed(4)}
            </span>
          )}
        </p>
        {farm.description && <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{farm.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.farms.area} value={formatNumber(farm.area, locale)} icon={<Ruler />} tone="violet" />
        <StatCard label={t.farms.fieldsCount} value={formatNumber(fields.length, locale)} icon={<LandPlot />} />
        <StatCard label={t.farms.activeCrops} value={formatNumber(crops.length, locale)} icon={<Sprout />} />
        <StatCard label={t.dashboard.upcomingIrrigation} value={formatNumber(irrigationCount ?? 0, locale)} icon={<Droplets />} tone="blue" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <WeatherCard farmName={hasCoords ? farm.name : null} weather={weather} />
        </div>

        <Card className="xl:col-span-3">
          <CardHeader title={t.farms.fieldsInFarm} icon={<LandPlot />} />
          <CardContent>
            {fields.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t.farms.noFields}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((f) => (
                  <li key={f.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{f.name}</p>
                      <StatusBadge kind="fieldStatus" value={f.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        f.area != null ? `${formatNumber(f.area, locale)} ${t.common.ha}` : null,
                        enumLabel(t, "soilType", f.soil_type),
                        enumLabel(t, "irrigationMethod", f.irrigation_type),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {(cropsByField.get(f.id) ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {cropsByField.get(f.id)!.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                          >
                            <Sprout className="size-3" />
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title={t.farms.recentActivities}
          icon={<ClipboardList />}
          action={
            <Link href="/dashboard/activities" className="text-sm font-medium text-brand-700 dark:text-brand-400">
              {t.common.viewAll}
            </Link>
          }
        />
        <CardContent>
          {activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t.farms.noActivities}</p>
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {enumLabel(t, "activityType", a.type)} · {formatDate(a.scheduled_date, locale)}
                      {num(a.cost) > 0 && ` · ${formatCurrency(num(a.cost), locale, currency)}`}
                    </p>
                  </div>
                  <StatusBadge kind="activityStatus" value={a.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
