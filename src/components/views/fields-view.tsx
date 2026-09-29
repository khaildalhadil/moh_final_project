"use client";

import { LandPlot } from "lucide-react";
import { ResourceManager, type Column } from "@/components/resource/resource-manager";
import type { FieldDef } from "@/components/resource/resource-form";
import { StatusBadge } from "@/components/status";
import { FIELD_STATUSES, IRRIGATION_METHODS, SOIL_TYPES } from "@/lib/constants";
import { enumLabel, enumOptions } from "@/lib/enums";
import { useI18n } from "@/lib/i18n/provider";
import { select, useData } from "@/lib/store";
import type { FarmOption, Field } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

/** Page entry: reads the data from the local store. */
export function FieldsScreen() {
  const { db } = useData();
  return <FieldsView rows={select.fields(db)} farms={select.farmOptions(db)} />;
}

export function FieldsView({ rows, farms }: { rows: Field[]; farms: FarmOption[] }) {
  const { t, locale } = useI18n();
  const farmName = new Map(farms.map((f) => [f.id, f.name]));
  const farmOptions = farms.map((f) => ({ value: f.id, label: f.name }));

  const fields: FieldDef[] = [
    { name: "name", label: t.fields.name, type: "text", required: true },
    { name: "farm_id", label: t.fields.farm, type: "select", required: true, options: farmOptions },
    { name: "area", label: t.fields.area, type: "number", min: 0 },
    { name: "status", label: t.fields.status, type: "select", required: true, options: enumOptions(t, "fieldStatus", FIELD_STATUSES) },
    { name: "soil_type", label: t.fields.soilType, type: "select", options: enumOptions(t, "soilType", SOIL_TYPES) },
    { name: "irrigation_type", label: t.fields.irrigationType, type: "select", options: enumOptions(t, "irrigationMethod", IRRIGATION_METHODS) },
  ];

  const columns: Column<Field>[] = [
    { key: "name", header: t.fields.name, value: (r) => r.name, primary: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "farm", header: t.fields.farm, value: (r) => farmName.get(r.farm_id) ?? "" },
    {
      key: "area",
      header: t.fields.area,
      value: (r) => r.area,
      render: (r) => <span className="tabular-nums">{formatNumber(r.area, locale)}</span>,
    },
    { key: "soil", header: t.fields.soilType, value: (r) => enumLabel(t, "soilType", r.soil_type) },
    { key: "irrigation", header: t.fields.irrigationType, value: (r) => enumLabel(t, "irrigationMethod", r.irrigation_type) },
    {
      key: "status",
      header: t.fields.status,
      value: (r) => enumLabel(t, "fieldStatus", r.status),
      render: (r) => <StatusBadge kind="fieldStatus" value={r.status} />,
    },
  ];

  return (
    <ResourceManager
      table="fields"
      rows={rows}
      columns={columns}
      fields={fields}
      title={t.fields.title}
      description={t.fields.subtitle}
      labels={{ add: t.fields.add, edit: t.fields.edit, emptyTitle: t.fields.emptyTitle, emptyText: t.fields.emptyText }}
      emptyIcon={<LandPlot />}
      blockedReason={farms.length === 0 ? t.fields.needFarm : undefined}
      defaults={{ status: "active", farm_id: farms.length === 1 ? farms[0].id : "" }}
      filters={[
        { key: "farm", label: t.fields.farm, options: farmOptions, get: (r) => r.farm_id },
        { key: "status", label: t.fields.status, options: enumOptions(t, "fieldStatus", FIELD_STATUSES), get: (r) => r.status },
      ]}
    />
  );
}
