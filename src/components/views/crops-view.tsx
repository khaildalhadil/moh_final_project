"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarClock, Sprout, Wheat } from "lucide-react";
import { useApp } from "@/components/dashboard/app-context";
import { ResourceManager, type Column } from "@/components/resource/resource-manager";
import type { FieldDef } from "@/components/resource/resource-form";
import { StatusBadge } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Progress, StatCard, Truncate } from "@/components/ui/misc";
import { setStatus } from "@/lib/actions/records";
import { CROP_STATUSES, YIELD_UNITS } from "@/lib/constants";
import { enumLabel, enumOptions } from "@/lib/enums";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import type { Crop, FarmOption, FieldOption } from "@/lib/types";
import { daysBetween, formatDate, formatNumber, num } from "@/lib/utils";

export function cropProgress(crop: Pick<Crop, "planting_date" | "expected_harvest_date" | "status">, today: string) {
  if (crop.status === "harvested") return 100;
  if (!crop.planting_date || !crop.expected_harvest_date) return 0;
  const total = daysBetween(crop.planting_date, crop.expected_harvest_date);
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, (daysBetween(crop.planting_date, today) / total) * 100));
}

export function toKg(value: number | null, unit: string) {
  return num(value) * (unit === "ton" ? 1000 : 1);
}

export function CropsView({ rows, fields, farms }: { rows: Crop[]; fields: FieldOption[]; farms: FarmOption[] }) {
  const { t, locale } = useI18n();
  const { today } = useApp();
  const farmName = new Map(farms.map((f) => [f.id, f.name]));
  const fieldById = new Map(fields.map((f) => [f.id, f]));
  const fieldLabel = (id: string) => {
    const f = fieldById.get(id);
    return f ? `${f.name} · ${farmName.get(f.farm_id) ?? ""}` : "—";
  };
  const fieldOptions = fields.map((f) => ({ value: f.id, label: fieldLabel(f.id) }));

  const formFields: FieldDef[] = [
    { name: "name", label: t.crops.name, type: "text", required: true },
    { name: "variety", label: t.crops.variety, type: "text" },
    { name: "field_id", label: t.crops.field, type: "select", required: true, options: fieldOptions, full: true },
    { name: "planting_date", label: t.crops.plantingDate, type: "date" },
    { name: "expected_harvest_date", label: t.crops.expectedHarvest, type: "date" },
    { name: "status", label: t.crops.status, type: "select", required: true, options: enumOptions(t, "cropStatus", CROP_STATUSES) },
    { name: "actual_harvest_date", label: t.crops.actualHarvest, type: "date" },
    { name: "expected_yield", label: t.crops.expectedYield, type: "number", min: 0 },
    { name: "actual_yield", label: t.crops.actualYield, type: "number", min: 0 },
    { name: "yield_unit", label: t.crops.yieldUnit, type: "select", required: true, options: enumOptions(t, "yieldUnit", YIELD_UNITS) },
    { name: "notes", label: t.common.notes, type: "textarea" },
  ];

  const columns: Column<Crop>[] = [
    {
      key: "name",
      header: t.crops.name,
      value: (r) => `${r.name}${r.variety ? ` (${r.variety})` : ""}`,
      primary: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium">{r.name}</p>
          {r.variety && <p className="text-xs text-muted-foreground">{r.variety}</p>}
        </div>
      ),
    },
    {
      key: "field",
      header: t.crops.field,
      value: (r) => fieldLabel(r.field_id),
      render: (r) => <Truncate text={fieldLabel(r.field_id)} />,
    },
    {
      key: "planting",
      header: t.crops.plantingDate,
      value: (r) => r.planting_date,
      render: (r) => formatDate(r.planting_date, locale),
      hideOnMobile: true,
      wideOnly: true,
    },
    {
      key: "harvest",
      header: t.crops.expectedHarvest,
      value: (r) => r.expected_harvest_date,
      render: (r) => {
        if (!r.expected_harvest_date) return "—";
        const left = daysBetween(today, r.expected_harvest_date);
        const active = r.status === "planted" || r.status === "growing";
        return (
          <div>
            <p>{formatDate(r.expected_harvest_date, locale)}</p>
            {active && left >= 0 && (
              <p className={left <= 14 ? "text-xs font-medium text-amber-600 dark:text-amber-400" : "text-xs text-muted-foreground"}>
                {left === 0 ? t.common.today : fmt(t.common.inDays, { n: left })}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "progress",
      header: t.crops.progress,
      value: (r) => Math.round(cropProgress(r, today)),
      render: (r) => (
        <div className="flex min-w-28 items-center gap-2">
          <Progress value={cropProgress(r, today)} />
          <span className="w-9 text-xs tabular-nums text-muted-foreground">{Math.round(cropProgress(r, today))}%</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t.crops.status,
      value: (r) => enumLabel(t, "cropStatus", r.status),
      render: (r) => <StatusBadge kind="cropStatus" value={r.status} />,
    },
    {
      key: "yield",
      header: t.crops.actualYield,
      value: (r) => r.actual_yield ?? r.expected_yield,
      render: (r) => {
        const unit = enumLabel(t, "yieldUnit", r.yield_unit);
        if (r.actual_yield != null) return <span className="tabular-nums">{formatNumber(r.actual_yield, locale)} {unit}</span>;
        if (r.expected_yield != null)
          return (
            <span className="tabular-nums text-muted-foreground">
              ~{formatNumber(r.expected_yield, locale)} {unit}
            </span>
          );
        return "—";
      },
    },
  ];

  const active = rows.filter((c) => c.status === "planted" || c.status === "growing");
  const soon = active.filter(
    (c) => c.expected_harvest_date && daysBetween(today, c.expected_harvest_date) >= 0 && daysBetween(today, c.expected_harvest_date) <= 14,
  );
  const harvestedKg = rows.reduce((s, c) => s + (c.status === "harvested" ? toKg(c.actual_yield, c.yield_unit) : 0), 0);

  return (
    <ResourceManager
      table="crops"
      rows={rows}
      columns={columns}
      fields={formFields}
      title={t.crops.title}
      description={t.crops.subtitle}
      labels={{ add: t.crops.add, edit: t.crops.edit, emptyTitle: t.crops.emptyTitle, emptyText: t.crops.emptyText }}
      emptyIcon={<Sprout />}
      blockedReason={fields.length === 0 ? t.crops.needField : undefined}
      defaults={{ status: "planted", yield_unit: "kg", planting_date: today }}
      errorMessages={{ harvestBeforePlanting: t.crops.harvestBeforePlanting }}
      filters={[
        { key: "status", label: t.crops.status, options: enumOptions(t, "cropStatus", CROP_STATUSES), get: (r) => r.status },
        { key: "field", label: t.crops.field, options: fieldOptions, get: (r) => r.field_id },
      ]}
      rowActions={(r) => (r.status === "planted" || r.status === "growing" ? <HarvestButton id={r.id} /> : null)}
      summary={
        rows.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t.crops.title} value={formatNumber(rows.length, locale)} icon={<Sprout />} />
            <StatCard label={t.dashboard.statActiveCrops} value={formatNumber(active.length, locale)} icon={<Sprout />} tone="blue" />
            <StatCard label={t.dashboard.harvestSoon} value={formatNumber(soon.length, locale)} icon={<CalendarClock />} tone="amber" />
            <StatCard
              label={t.reports.totalYield}
              value={`${formatNumber(harvestedKg / 1000, locale, 1)} ${t.enums.yieldUnit.ton}`}
              icon={<Wheat />}
              tone="violet"
            />
          </div>
        )
      }
    />
  );
}

function HarvestButton({ id }: { id: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      loading={pending}
      title={t.enums.cropStatus.harvested}
      aria-label={t.enums.cropStatus.harvested}
      className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/50"
      onClick={() =>
        start(async () => {
          const res = await setStatus("crops", id, "harvested");
          if (res.ok) toast.success(t.common.saved);
          else toast.error(t.common.errorGeneric);
        })
      }
    >
      {!pending && <Wheat />}
    </Button>
  );
}
