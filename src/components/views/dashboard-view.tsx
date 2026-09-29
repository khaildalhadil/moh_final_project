"use client";

import Link from "next/link";
import {
  CalendarClock,
  ClipboardList,
  Droplets,
  Package,
  Plus,
  Ruler,
  Sprout,
  Tractor,
} from "lucide-react";
import { BarsChart } from "@/components/charts";
import { DemoDataButton } from "@/components/dashboard/demo-button";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { StatusBadge } from "@/components/status";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { cropsByStatus, monthlyCosts, monthlyWater } from "@/lib/analytics";
import { enumLabel } from "@/lib/enums";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { isLowStock, select, useData } from "@/lib/store";
import { addDaysISO, daysBetween, formatCurrency, formatDate, formatNumber, formatTime, num } from "@/lib/utils";
import { useApp } from "@/components/dashboard/app-context";

export function DashboardView() {
  const { t, locale } = useI18n();
  const { user, db } = useData();
  const { today, currency } = useApp();
  const farms = select.farms(db);
  const fields = select.fields(db);
  const crops = select.crops(db);
  const irrigation = select.irrigation(db);
  const activities = select.activities(db);
  const inventory = select.inventory(db);
  const firstName = user.full_name.split(" ")[0];

  const header = (
    <PageHeader
      title={firstName ? `${t.auth.loginTitle}${locale === "ar" ? "، " : ", "}${firstName}` : t.auth.loginTitle}
      description={`${formatDate(today, locale, { weekday: "long", month: "long" })} — ${t.dashboard.subtitle}`}
      actions={
        farms.length > 0 && (
          <>
            <Link href="/dashboard/irrigation?new=1" className={buttonVariants({ variant: "outline" })}>
              <Droplets />
              {t.irrigation.add}
            </Link>
            <Link href="/dashboard/activities?new=1" className={buttonVariants()}>
              <Plus />
              {t.activities.add}
            </Link>
          </>
        )
      }
    />
  );

  if (farms.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<Sprout />}
          title={t.dashboard.emptyTitle}
          text={t.dashboard.emptyText}
          className="py-20"
          action={
            <>
              <DemoDataButton />
              <Link href="/dashboard/farms?new=1" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <Plus />
                {t.dashboard.addFirstFarm}
              </Link>
            </>
          }
        />
      </>
    );
  }

  // ---- stats ----
  const fieldById = new Map(fields.map((f) => [f.id, f]));
  const farmName = new Map(farms.map((f) => [f.id, f.name]));
  const totalArea = farms.reduce((s, f) => s + num(f.area), 0);
  const activeCrops = crops.filter((c) => c.status === "planted" || c.status === "growing");
  const weekEnd = addDaysISO(today, 6);
  const weekIrrigation = irrigation.filter((i) => i.status === "scheduled" && i.scheduled_date >= today && i.scheduled_date <= weekEnd);
  const openTasks = activities.filter((a) => a.status === "pending" || a.status === "in_progress");
  const lowStock = inventory.filter(isLowStock);

  const upcomingIrrigation = irrigation
    .filter((i) => i.status === "scheduled" && i.scheduled_date >= today)
    .sort((a, b) => (a.scheduled_date + (a.start_time ?? "")).localeCompare(b.scheduled_date + (b.start_time ?? "")))
    .slice(0, 5);
  const upcomingTasks = [...openTasks].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)).slice(0, 6);
  const harvestSoon = activeCrops
    .filter((c) => c.expected_harvest_date && c.expected_harvest_date >= today)
    .sort((a, b) => a.expected_harvest_date!.localeCompare(b.expected_harvest_date!))
    .slice(0, 4);

  // ---- weather for the first farm with coordinates ----
  const weatherFarm = farms.find((f) => f.latitude != null && f.longitude != null) ?? null;

  const fieldLabel = (id: string) => {
    const f = fieldById.get(id);
    return f ? `${f.name} · ${farmName.get(f.farm_id) ?? ""}` : "—";
  };

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard label={t.dashboard.statFarms} value={formatNumber(farms.length, locale)} icon={<Tractor />} />
        <StatCard label={t.dashboard.statArea} value={`${formatNumber(totalArea, locale, 1)} ${t.common.ha}`} icon={<Ruler />} tone="violet" />
        <StatCard label={t.dashboard.statActiveCrops} value={formatNumber(activeCrops.length, locale)} icon={<Sprout />} />
        <StatCard label={t.dashboard.statIrrigationWeek} value={formatNumber(weekIrrigation.length, locale)} icon={<Droplets />} tone="blue" />
        <StatCard label={t.dashboard.statPendingTasks} value={formatNumber(openTasks.length, locale)} icon={<ClipboardList />} tone="amber" />
        <StatCard label={t.dashboard.statLowStock} value={formatNumber(lowStock.length, locale)} icon={<Package />} tone="red" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <WeatherCard farmName={weatherFarm?.name ?? null} latitude={num(weatherFarm?.latitude)} longitude={num(weatherFarm?.longitude)} />
        </div>

        <Card className="xl:col-span-2">
          <CardHeader
            title={t.dashboard.upcomingIrrigation}
            icon={<Droplets />}
            action={
              <Link href="/dashboard/irrigation" className="text-sm font-medium text-brand-700 dark:text-brand-400">
                {t.common.viewAll}
              </Link>
            }
          />
          <CardContent>
            {upcomingIrrigation.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t.dashboard.noUpcomingIrrigation}</p>
            ) : (
              <ul className="space-y-2">
                {upcomingIrrigation.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-50 text-center text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                      <div className="leading-none">
                        <p className="text-base font-bold tabular-nums">{formatDate(i.scheduled_date, locale, { month: undefined, year: undefined })}</p>
                        <p className="mt-0.5 text-[10px]">{formatDate(i.scheduled_date, locale, { day: undefined, year: undefined })}</p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{fieldLabel(i.field_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        <span dir="ltr">{formatTime(i.start_time)}</span> · {enumLabel(t, "irrigationMethod", i.method)}
                        {i.water_amount != null && ` · ${formatNumber(i.water_amount, locale)} ${t.common.m3}`}
                      </p>
                    </div>
                    {i.scheduled_date === today && <Badge tone="blue">{t.common.today}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t.dashboard.monthlyCosts} description={currency} />
          <CardContent>
            <BarsChart data={monthlyCosts(activities, locale)} series={[{ key: "value", label: t.activities.cost, color: "var(--chart-green)" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={t.dashboard.waterUsage} description={t.common.m3} />
          <CardContent>
            <BarsChart data={monthlyWater(irrigation, locale)} series={[{ key: "value", label: t.irrigation.water, color: "var(--chart-blue)" }]} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title={t.dashboard.upcomingTasks}
            icon={<ClipboardList />}
            action={
              <Link href="/dashboard/activities" className="text-sm font-medium text-brand-700 dark:text-brand-400">
                {t.common.viewAll}
              </Link>
            }
          />
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t.dashboard.noUpcomingTasks}</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingTasks.map((a) => {
                  const overdue = a.scheduled_date < today;
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {enumLabel(t, "activityType", a.type)} · {farmName.get(a.farm_id)}
                          {a.cost > 0 && ` · ${formatCurrency(a.cost, locale, currency)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {overdue ? (
                          <Badge tone="red">{t.dashboard.overdue}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{formatDate(a.scheduled_date, locale, { year: undefined })}</span>
                        )}
                        <StatusBadge kind="priority" value={a.priority} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader title={t.dashboard.cropsByStatus} icon={<Sprout />} />
            <CardContent>
              <BarsChart
                data={cropsByStatus(crops, t)}
                series={[{ key: "value", label: t.crops.title, color: "var(--chart-green)" }]}
                horizontal
                integer
                height={200}
              />
            </CardContent>
          </Card>

          {harvestSoon.length > 0 && (
            <Card>
              <CardHeader title={t.dashboard.harvestSoon} icon={<CalendarClock />} />
              <CardContent>
                <ul className="space-y-2.5">
                  {harvestSoon.map((c) => {
                    const left = daysBetween(today, c.expected_harvest_date!);
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground"> · {fieldById.get(c.field_id)?.name}</span>
                        </span>
                        <Badge tone={left <= 14 ? "amber" : "gray"}>
                          {left === 0 ? t.common.today : fmt(t.common.inDays, { n: left })}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
