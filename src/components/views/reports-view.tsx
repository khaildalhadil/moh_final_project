"use client";

import Link from "next/link";
import { Coins, Droplets, Package, Wheat } from "lucide-react";
import { BarsChart } from "@/components/charts";
import { PrintButton } from "@/components/print-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/ui/misc";
import {
  costsByType,
  cropsByStatus,
  inventoryByCategory,
  monthlyCosts,
  monthlyWater,
  tasksByStatus,
  yieldByCrop,
} from "@/lib/analytics";
import { fmt } from "@/lib/i18n";
import { useApp } from "@/components/dashboard/app-context";
import { useI18n } from "@/lib/i18n/provider";
import { select, useData } from "@/lib/store";
import { cn, formatCurrency, formatDate, formatNumber, lastMonths, num } from "@/lib/utils";

const RANGES = [3, 6, 12] as const;

export function ReportsView({ months }: { months: number }) {
  const { t, locale } = useI18n();
  const { db } = useData();
  const { today, currency } = useApp();
  const crops = select.crops(db);
  const irrigation = select.irrigation(db);
  const activities = select.activities(db);
  const inventory = select.inventory(db);

  // Time-based metrics are scoped to the selected range; crops & inventory are current snapshots.
  const from = `${lastMonths(months)[0]}-01`;
  const inRange = (d: string | null) => Boolean(d && d >= from && d <= today.slice(0, 7) + "-31");
  const rangedActivities = activities.filter((a) => inRange(a.scheduled_date));
  const rangedIrrigation = irrigation.filter((i) => inRange(i.scheduled_date));
  const rangedCrops = crops.filter((c) => c.status !== "harvested" || inRange(c.actual_harvest_date));

  const totalCost = rangedActivities.filter((a) => a.status !== "cancelled").reduce((s, a) => s + num(a.cost), 0);
  const totalWater = rangedIrrigation.filter((i) => i.status === "completed").reduce((s, i) => s + num(i.water_amount), 0);
  const yields = yieldByCrop(rangedCrops);
  const totalYield = yields.reduce((s, y) => s + y.actual, 0);
  const inventoryValue = inventory.reduce((s, i) => s + num(i.quantity) * num(i.unit_cost), 0);

  const money = (v: number) => formatCurrency(v, locale, currency);

  return (
    <>
      <PageHeader title={t.reports.title} description={t.reports.subtitle} actions={<PrintButton />} />

      <div className="no-print mb-5 inline-flex rounded-xl border border-border bg-card p-1">
        {RANGES.map((m) => (
          <Link
            key={m}
            href={`/dashboard/reports?months=${m}`}
            scroll={false}
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              m === months && "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200",
            )}
          >
            {fmt(t.reports.lastMonths, { n: m })}
          </Link>
        ))}
      </div>

      <p className="mb-4 hidden text-sm text-muted-foreground print:block">
        {t.reports.generatedOn}: {formatDate(today, locale)}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.reports.totalCost} value={money(totalCost)} icon={<Coins />} tone="amber" />
        <StatCard label={t.reports.totalWater} value={`${formatNumber(totalWater, locale, 0)} ${t.common.m3}`} icon={<Droplets />} tone="blue" />
        <StatCard label={t.reports.totalYield} value={`${formatNumber(totalYield, locale, 0)} ${t.enums.yieldUnit.kg}`} icon={<Wheat />} />
        <StatCard label={t.reports.inventoryValue} value={money(inventoryValue)} icon={<Package />} tone="violet" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="break-inside-avoid">
          <CardHeader title={t.reports.waterByMonth} />
          <CardContent>
            <BarsChart
              data={monthlyWater(irrigation, locale, months)}
              series={[{ key: "value", label: t.irrigation.water, color: "var(--chart-blue)" }]}
            />
          </CardContent>
        </Card>
        <Card className="break-inside-avoid">
          <CardHeader title={t.reports.costsByMonth} description={currency} />
          <CardContent>
            <BarsChart
              data={monthlyCosts(activities, locale, months)}
              series={[{ key: "value", label: t.activities.cost, color: "var(--chart-green)" }]}
            />
          </CardContent>
        </Card>
        <Card className="break-inside-avoid">
          <CardHeader title={t.reports.costsByType} description={currency} />
          <CardContent>
            <BarsChart
              data={costsByType(rangedActivities, t)}
              series={[{ key: "value", label: t.activities.cost, color: "var(--chart-green)" }]}
              horizontal
              height={300}
            />
          </CardContent>
        </Card>
        <Card className="break-inside-avoid">
          <CardHeader title={t.reports.yieldByCrop} />
          <CardContent>
            <BarsChart
              data={yields}
              series={[
                { key: "expected", label: t.reports.expected, color: "var(--chart-blue)" },
                { key: "actual", label: t.reports.actual, color: "var(--chart-orange)" },
              ]}
              height={300}
            />
          </CardContent>
        </Card>
        <Card className="break-inside-avoid">
          <CardHeader title={t.reports.cropsByStatus} />
          <CardContent>
            <BarsChart
              data={cropsByStatus(crops, t)}
              series={[{ key: "value", label: t.crops.title, color: "var(--chart-green)" }]}
              horizontal
              integer
              height={220}
            />
          </CardContent>
        </Card>
        <Card className="break-inside-avoid">
          <CardHeader title={t.reports.tasksByStatus} />
          <CardContent>
            <BarsChart
              data={tasksByStatus(rangedActivities, t)}
              series={[{ key: "value", label: t.activities.title, color: "var(--chart-blue)" }]}
              horizontal
              integer
              height={220}
            />
          </CardContent>
        </Card>
        <Card className="break-inside-avoid lg:col-span-2">
          <CardHeader title={t.reports.inventoryByCategory} description={currency} />
          <CardContent>
            <BarsChart
              data={inventoryByCategory(inventory, t)}
              series={[{ key: "value", label: t.inventory.stockValue, color: "var(--chart-green)" }]}
              horizontal
              height={240}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
