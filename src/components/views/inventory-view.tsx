"use client";

import { Coins, Package, TriangleAlert } from "lucide-react";
import { useApp } from "@/components/dashboard/app-context";
import { ResourceManager, type Column } from "@/components/resource/resource-manager";
import type { FieldDef } from "@/components/resource/resource-form";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/misc";
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from "@/lib/constants";
import { enumLabel, enumOptions } from "@/lib/enums";
import { useI18n } from "@/lib/i18n/provider";
import type { InventoryItem } from "@/lib/types";
import { formatCurrency, formatNumber, num } from "@/lib/utils";

const isLow = (i: InventoryItem) => i.min_quantity != null && num(i.quantity) <= num(i.min_quantity);
const value = (i: InventoryItem) => num(i.quantity) * num(i.unit_cost);

export function InventoryView({ rows }: { rows: InventoryItem[] }) {
  const { t, locale } = useI18n();
  const { currency } = useApp();

  const formFields: FieldDef[] = [
    { name: "name", label: t.inventory.name, type: "text", required: true },
    { name: "category", label: t.inventory.category, type: "select", required: true, options: enumOptions(t, "category", INVENTORY_CATEGORIES) },
    { name: "quantity", label: t.inventory.quantity, type: "number", required: true, min: 0 },
    { name: "unit", label: t.inventory.unit, type: "select", required: true, options: enumOptions(t, "unit", INVENTORY_UNITS) },
    { name: "min_quantity", label: t.inventory.minQuantity, type: "number", min: 0 },
    { name: "unit_cost", label: `${t.inventory.unitCost} (${currency})`, type: "number", min: 0 },
    { name: "supplier", label: t.inventory.supplier, type: "text", full: true },
    { name: "notes", label: t.common.notes, type: "textarea" },
  ];

  const columns: Column<InventoryItem>[] = [
    {
      key: "name",
      header: t.inventory.name,
      value: (r) => r.name,
      primary: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium">{r.name}</p>
          {r.supplier && <p className="text-xs text-muted-foreground">{r.supplier}</p>}
        </div>
      ),
    },
    { key: "category", header: t.inventory.category, value: (r) => enumLabel(t, "category", r.category) },
    {
      key: "quantity",
      header: t.inventory.quantity,
      value: (r) => num(r.quantity),
      render: (r) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums">
            {formatNumber(r.quantity, locale)} {enumLabel(t, "unit", r.unit)}
          </span>
          {isLow(r) ? (
            <Badge tone="red" dot>
              {t.inventory.lowStock}
            </Badge>
          ) : (
            <Badge tone="green" dot>
              {t.inventory.inStock}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "min",
      header: t.inventory.minQuantity,
      value: (r) => r.min_quantity,
      render: (r) => <span className="tabular-nums">{formatNumber(r.min_quantity, locale)}</span>,
      hideOnMobile: true,
      wideOnly: true,
    },
    {
      key: "unitCost",
      header: t.inventory.unitCost,
      value: (r) => r.unit_cost,
      render: (r) => <span className="tabular-nums">{formatCurrency(r.unit_cost, locale, currency)}</span>,
      hideOnMobile: true,
    },
    {
      key: "value",
      header: t.inventory.stockValue,
      value: (r) => value(r),
      render: (r) => <span className="font-medium tabular-nums">{formatCurrency(value(r), locale, currency)}</span>,
    },
  ];

  const low = rows.filter(isLow);
  const total = rows.reduce((s, r) => s + value(r), 0);

  return (
    <ResourceManager
      table="inventory_items"
      rows={rows}
      columns={columns}
      fields={formFields}
      title={t.inventory.title}
      description={t.inventory.subtitle}
      labels={{ add: t.inventory.add, edit: t.inventory.edit, emptyTitle: t.inventory.emptyTitle, emptyText: t.inventory.emptyText }}
      emptyIcon={<Package />}
      defaults={{ category: "fertilizer", unit: "kg" }}
      filters={[
        { key: "category", label: t.inventory.category, options: enumOptions(t, "category", INVENTORY_CATEGORIES), get: (r) => r.category },
        {
          key: "stock",
          label: t.inventory.quantity,
          options: [
            { value: "low", label: t.inventory.lowStock },
            { value: "ok", label: t.inventory.inStock },
          ],
          get: (r) => (isLow(r) ? "low" : "ok"),
        },
      ]}
      summary={
        rows.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label={t.inventory.title} value={formatNumber(rows.length, locale)} icon={<Package />} />
            <StatCard label={t.inventory.lowStock} value={formatNumber(low.length, locale)} icon={<TriangleAlert />} tone="red" />
            <StatCard
              label={t.inventory.stockValue}
              value={formatCurrency(total, locale, currency)}
              icon={<Coins />}
              tone="amber"
              className="col-span-2 lg:col-span-1"
            />
          </div>
        )
      }
    />
  );
}
