"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, CircleCheck, Droplets, GlassWater } from "lucide-react";
import { useApp } from "@/components/dashboard/app-context";
import { ResourceManager, type Column } from "@/components/resource/resource-manager";
import type { FieldDef } from "@/components/resource/resource-form";
import { StatusBadge } from "@/components/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard, Truncate } from "@/components/ui/misc";
import { select, setStatus, useData } from "@/lib/store";
import { IRRIGATION_METHODS, IRRIGATION_STATUSES } from "@/lib/constants";
import { enumLabel, enumOptions } from "@/lib/enums";
import { useI18n } from "@/lib/i18n/provider";
import type { FarmOption, FieldOption, IrrigationSchedule } from "@/lib/types";
import { addDaysISO, formatDate, formatNumber, formatTime, num } from "@/lib/utils";

/** Page entry: reads the data from the local store. */
export function IrrigationScreen() {
  const { db } = useData();
  return <IrrigationView rows={select.irrigation(db)} fields={select.fieldOptions(db)} farms={select.farmOptions(db)} />;
}

export function IrrigationView({
  rows,
  fields,
  farms,
}: {
  rows: IrrigationSchedule[];
  fields: FieldOption[];
  farms: FarmOption[];
}) {
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
    { name: "field_id", label: t.irrigation.field, type: "select", required: true, options: fieldOptions, full: true },
    { name: "scheduled_date", label: t.irrigation.date, type: "date", required: true },
    { name: "start_time", label: t.irrigation.startTime, type: "time" },
    { name: "duration_minutes", label: t.irrigation.duration, type: "integer", min: 0 },
    { name: "water_amount", label: t.irrigation.water, type: "number", min: 0 },
    { name: "method", label: t.irrigation.method, type: "select", required: true, options: enumOptions(t, "irrigationMethod", IRRIGATION_METHODS) },
    { name: "status", label: t.irrigation.status, type: "select", required: true, options: enumOptions(t, "irrigationStatus", IRRIGATION_STATUSES) },
    { name: "notes", label: t.common.notes, type: "textarea" },
  ];

  const columns: Column<IrrigationSchedule>[] = [
    {
      key: "date",
      header: t.irrigation.date,
      value: (r) => r.scheduled_date,
      primary: true,
      render: (r) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{formatDate(r.scheduled_date, locale, { weekday: "short", year: undefined })}</span>
          {r.scheduled_date === today && <Badge tone="blue">{t.common.today}</Badge>}
          {r.scheduled_date < today && r.status === "scheduled" && <Badge tone="red">{t.dashboard.overdue}</Badge>}
        </div>
      ),
    },
    { key: "time", header: t.irrigation.startTime, value: (r) => formatTime(r.start_time), className: "tabular-nums" },
    {
      key: "field",
      header: t.irrigation.field,
      value: (r) => fieldLabel(r.field_id),
      render: (r) => <Truncate text={fieldLabel(r.field_id)} />,
    },
    { key: "method", header: t.irrigation.method, value: (r) => enumLabel(t, "irrigationMethod", r.method), hideOnMobile: true, wideOnly: true },
    {
      key: "duration",
      header: t.irrigation.duration,
      value: (r) => r.duration_minutes,
      render: (r) => (r.duration_minutes != null ? `${formatNumber(r.duration_minutes, locale)} ${t.common.min}` : "—"),
      hideOnMobile: true,
    },
    {
      key: "water",
      header: t.irrigation.water,
      value: (r) => r.water_amount,
      render: (r) => (r.water_amount != null ? `${formatNumber(r.water_amount, locale)} ${t.common.m3}` : "—"),
    },
    {
      key: "status",
      header: t.irrigation.status,
      value: (r) => enumLabel(t, "irrigationStatus", r.status),
      render: (r) => <StatusBadge kind="irrigationStatus" value={r.status} />,
    },
  ];

  // ---- summary ----
  const weekEnd = addDaysISO(today, 6);
  const month = today.slice(0, 7);
  const todayCount = rows.filter((r) => r.scheduled_date === today && r.status === "scheduled").length;
  const weekCount = rows.filter((r) => r.scheduled_date >= today && r.scheduled_date <= weekEnd && r.status === "scheduled").length;
  const monthWater = rows
    .filter((r) => r.scheduled_date.startsWith(month) && r.status === "completed")
    .reduce((s, r) => s + num(r.water_amount), 0);
  const finished = rows.filter((r) => r.status === "completed" || r.status === "skipped");
  const rate = finished.length ? (finished.filter((r) => r.status === "completed").length / finished.length) * 100 : 0;

  return (
    <ResourceManager
      table="irrigation_schedules"
      rows={rows}
      columns={columns}
      fields={formFields}
      title={t.irrigation.title}
      description={t.irrigation.subtitle}
      labels={{ add: t.irrigation.add, edit: t.irrigation.edit, emptyTitle: t.irrigation.emptyTitle, emptyText: t.irrigation.emptyText }}
      emptyIcon={<Droplets />}
      blockedReason={fields.length === 0 ? t.irrigation.needField : undefined}
      defaults={{ scheduled_date: today, status: "scheduled", method: "drip", start_time: "06:00" }}
      filters={[
        { key: "status", label: t.irrigation.status, options: enumOptions(t, "irrigationStatus", IRRIGATION_STATUSES), get: (r) => r.status },
        { key: "field", label: t.irrigation.field, options: fieldOptions, get: (r) => r.field_id },
      ]}
      rowActions={(r) => (r.status === "scheduled" ? <DoneButton id={r.id} /> : null)}
      summary={
        rows.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t.irrigation.statToday} value={formatNumber(todayCount, locale)} icon={<Droplets />} tone="blue" />
            <StatCard label={t.irrigation.statWeek} value={formatNumber(weekCount, locale)} icon={<CalendarDays />} />
            <StatCard
              label={t.irrigation.statWater}
              value={`${formatNumber(monthWater, locale, 0)} ${t.common.m3}`}
              icon={<GlassWater />}
              tone="violet"
            />
            <StatCard label={t.irrigation.statCompleted} value={`${formatNumber(rate, locale, 0)}%`} icon={<CircleCheck />} tone="amber" />
          </div>
        )
      }
    />
  );
}

function DoneButton({ id }: { id: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      loading={pending}
      title={t.common.markDone}
      aria-label={t.common.markDone}
      className="text-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950"
      onClick={() =>
        start(async () => {
          const res = await setStatus("irrigation_schedules", id, "completed");
          if (res.ok) toast.success(t.common.saved);
          else toast.error(t.common.errorGeneric);
        })
      }
    >
      {!pending && <Check />}
    </Button>
  );
}
