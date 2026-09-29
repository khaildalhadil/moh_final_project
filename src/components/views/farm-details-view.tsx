"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, Droplets, LandPlot, MapPin, Ruler, Sprout, Tractor } from "lucide-react";
import { useApp } from "@/components/dashboard/app-context";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { StatusBadge } from "@/components/status";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, StatCard } from "@/components/ui/misc";
import { enumLabel } from "@/lib/enums";
import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/store";
import type { Crop } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber, num } from "@/lib/utils";

export function FarmDetailsView({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const { db } = useData();
  const { today, currency } = useApp();

  const farm = db.farms.find((f) => f.id === id);
  if (!farm) {
    return (
      <EmptyState
        icon={<Tractor />}
        title={t.common.notFoundTitle}
        text={t.common.notFoundText}
        className="mt-10"
        action={
          <Link href="/dashboard/farms" className={buttonVariants()}>
            {t.nav.farms}
          </Link>
        }
      />
    );
  }

  const fields = db.fields.filter((f) => f.farm_id === id).sort((a, b) => a.name.localeCompare(b.name));
  const fieldIds = new Set(fields.map((f) => f.id));
  const activities = db.activities
    .filter((a) => a.farm_id === id)
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    .slice(0, 6);
  const crops = db.crops.filter((c) => fieldIds.has(c.field_id) && (c.status === "planted" || c.status === "growing"));
  const irrigationCount = db.irrigation_schedules.filter(
    (i) => fieldIds.has(i.field_id) && i.status === "scheduled" && i.scheduled_date >= today,
  ).length;
  const cropsByField = new Map<string, Crop[]>();
  crops.forEach((c) => cropsByField.set(c.field_id, [...(cropsByField.get(c.field_id) ?? []), c]));
  const hasCoords = farm.latitude != null && farm.longitude != null;

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
          <WeatherCard farmName={hasCoords ? farm.name : null} latitude={num(farm.latitude)} longitude={num(farm.longitude)} />
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
