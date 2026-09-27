"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Banknote, Check, ClipboardList, ListChecks, TriangleAlert } from "lucide-react";
import { useApp } from "@/components/dashboard/app-context";
import { ResourceManager, type Column } from "@/components/resource/resource-manager";
import type { FieldDef } from "@/components/resource/resource-form";
import { StatusBadge } from "@/components/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard, Truncate } from "@/components/ui/misc";
import { setStatus } from "@/lib/actions/records";
import { ACTIVITY_STATUSES, ACTIVITY_TYPES, PRIORITIES } from "@/lib/constants";
import { enumLabel, enumOptions } from "@/lib/enums";
import { useI18n } from "@/lib/i18n/provider";
import type { Activity, FarmOption, FieldOption } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const isOpen = (a: Pick<Activity, "status">) => a.status === "pending" || a.status === "in_progress";

export function ActivitiesView({ rows, farms, fields }: { rows: Activity[]; farms: FarmOption[]; fields: FieldOption[] }) {
  const { t, locale } = useI18n();
  const { today, currency } = useApp();
  const farmName = new Map(farms.map((f) => [f.id, f.name]));
  const fieldName = new Map(fields.map((f) => [f.id, f.name]));
  const fieldFarm = new Map(fields.map((f) => [f.id, f.farm_id]));
  const farmOptions = farms.map((f) => ({ value: f.id, label: f.name }));

  const formFields: FieldDef[] = [
    { name: "title", label: t.activities.titleField, type: "text", required: true, full: true },
    { name: "type", label: t.activities.type, type: "select", required: true, options: enumOptions(t, "activityType", ACTIVITY_TYPES) },
    { name: "scheduled_date", label: t.activities.date, type: "date", required: true },
    { name: "farm_id", label: t.activities.farm, type: "select", required: true, options: farmOptions },
    {
      name: "field_id",
      label: t.activities.field,
      type: "select",
      options: fields.map((f) => ({ value: f.id, label: f.name })),
      filterOptions: (o, values) => fieldFarm.get(o.value) === values.farm_id,
    },
    { name: "priority", label: t.activities.priority, type: "select", required: true, options: enumOptions(t, "priority", PRIORITIES) },
    { name: "status", label: t.activities.status, type: "select", required: true, options: enumOptions(t, "activityStatus", ACTIVITY_STATUSES) },
    { name: "cost", label: `${t.activities.cost} (${currency})`, type: "number", min: 0 },
    { name: "assigned_to", label: t.activities.assignedTo, type: "text" },
    { name: "notes", label: t.common.notes, type: "textarea" },
  ];

  const columns: Column<Activity>[] = [
    {
      key: "title",
      header: t.activities.titleField,
      value: (r) => r.title,
      primary: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium">{r.title}</p>
          <p className="text-xs text-muted-foreground">{enumLabel(t, "activityType", r.type)}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: t.activities.farm,
      value: (r) => [farmName.get(r.farm_id), r.field_id ? fieldName.get(r.field_id) : null].filter(Boolean).join(" · "),
      render: (r) => (
        <Truncate text={[farmName.get(r.farm_id), r.field_id ? fieldName.get(r.field_id) : null].filter(Boolean).join(" · ")} />
      ),
      wideOnly: true,
    },
    {
      key: "date",
      header: t.activities.date,
      value: (r) => r.scheduled_date,
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="whitespace-nowrap">{formatDate(r.scheduled_date, locale)}</span>
          {r.scheduled_date < today && isOpen(r) && <Badge tone="red">{t.dashboard.overdue}</Badge>}
        </div>
      ),
    },
    {
      key: "priority",
      header: t.activities.priority,
      value: (r) => enumLabel(t, "priority", r.priority),
      render: (r) => <StatusBadge kind="priority" value={r.priority} />,
      hideOnMobile: true,
    },
    {
      key: "status",
      header: t.activities.status,
      value: (r) => enumLabel(t, "activityStatus", r.status),
      render: (r) => <StatusBadge kind="activityStatus" value={r.status} />,
    },
    {
      key: "cost",
      header: t.activities.cost,
      value: (r) => r.cost,
      render: (r) => <span className="tabular-nums">{formatCurrency(r.cost, locale, currency)}</span>,
    },
    { key: "assigned", header: t.activities.assignedTo, value: (r) => r.assigned_to, hideOnMobile: true, wideOnly: true },
  ];

  const open = rows.filter(isOpen);
  const overdue = open.filter((r) => r.scheduled_date < today);
  const totalCost = rows.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.cost, 0);

  return (
    <ResourceManager
      table="activities"
      rows={rows}
      columns={columns}
      fields={formFields}
      title={t.activities.title}
      description={t.activities.subtitle}
      labels={{ add: t.activities.add, edit: t.activities.edit, emptyTitle: t.activities.emptyTitle, emptyText: t.activities.emptyText }}
      emptyIcon={<ClipboardList />}
      blockedReason={farms.length === 0 ? t.activities.needFarm : undefined}
      defaults={{
        scheduled_date: today,
        status: "pending",
        priority: "medium",
        type: "other",
        farm_id: farms.length === 1 ? farms[0].id : "",
      }}
      filters={[
        { key: "status", label: t.activities.status, options: enumOptions(t, "activityStatus", ACTIVITY_STATUSES), get: (r) => r.status },
        { key: "type", label: t.activities.type, options: enumOptions(t, "activityType", ACTIVITY_TYPES), get: (r) => r.type },
      ]}
      rowActions={(r) => (isOpen(r) ? <DoneButton id={r.id} /> : null)}
      summary={
        rows.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t.activities.title} value={formatNumber(rows.length, locale)} icon={<ClipboardList />} />
            <StatCard label={t.activities.statOpen} value={formatNumber(open.length, locale)} icon={<ListChecks />} tone="blue" />
            <StatCard label={t.activities.statOverdue} value={formatNumber(overdue.length, locale)} icon={<TriangleAlert />} tone="red" />
            <StatCard label={t.activities.statCost} value={formatCurrency(totalCost, locale, currency)} icon={<Banknote />} tone="amber" />
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
          const res = await setStatus("activities", id, "completed");
          if (res.ok) toast.success(t.common.saved);
          else toast.error(t.common.errorGeneric);
        })
      }
    >
      {!pending && <Check />}
    </Button>
  );
}
