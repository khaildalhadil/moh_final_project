"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDownUp, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Select } from "@/components/ui/form";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { deleteRecord } from "@/lib/actions/records";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import type { TableName } from "@/lib/validations";
import { cn, downloadCSV } from "@/lib/utils";
import { ResourceForm, toFormValues, type FieldDef, type FormValues, type Option } from "./resource-form";
import { useCreateParam } from "./use-create-param";

export type Column<T> = {
  key: string;
  header: string;
  /** Plain value used for sorting, searching and CSV export. */
  value: (row: T) => string | number | null | undefined;
  /** Rich cell content (defaults to `value`). */
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** Shown as the card title on phones. */
  primary?: boolean;
  hideOnMobile?: boolean;
  /** Only show this column in the table on very wide screens (2xl+). */
  wideOnly?: boolean;
  /** Let long text wrap instead of truncating on one line. */
  wrap?: boolean;
  sortable?: boolean;
};

export type Filter<T> = { key: string; label: string; options: Option[]; get: (row: T) => string | null };

type Props<T extends { id: string }> = {
  table: TableName;
  rows: T[];
  columns: Column<T>[];
  fields: FieldDef[];
  title: string;
  description: string;
  labels: { add: string; edit: string; emptyTitle: string; emptyText: string };
  emptyIcon: React.ReactNode;
  filters?: Filter<T>[];
  rowActions?: (row: T) => React.ReactNode;
  defaults?: Record<string, unknown>;
  /** Map a row to form values (defaults to the row itself). */
  toForm?: (row: T) => Record<string, unknown>;
  /** When set, adding is disabled and this message is shown (e.g. "add a farm first"). */
  blockedReason?: string;
  errorMessages?: Record<string, string>;
  formExtra?: (values: FormValues, setValues: (patch: Partial<FormValues>) => void) => React.ReactNode;
  /** Content between the header and the list (e.g. stat cards). */
  summary?: React.ReactNode;
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
};

export function ResourceManager<T extends { id: string }>({
  table,
  rows,
  columns,
  fields,
  title,
  description,
  labels,
  emptyIcon,
  filters = [],
  rowActions,
  defaults,
  toForm,
  blockedReason,
  errorMessages,
  formExtra,
  summary,
  pageSize = 10,
  initialSort,
}: Props<T>) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useCreateParam();
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deletePending, startDelete] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((row) => {
      for (const f of filters) {
        const want = filterValues[f.key];
        if (want && f.get(row) !== want) return false;
      }
      if (!q) return true;
      return columns.some((c) => String(c.value(row) ?? "").toLowerCase().includes(q));
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const collator = new Intl.Collator(locale, { numeric: true });
        list = [...list].sort((a, b) => {
          const av = col.value(a);
          const bv = col.value(b);
          if (av == null || av === "") return 1;
          if (bv == null || bv === "") return -1;
          const r = typeof av === "number" && typeof bv === "number" ? av - bv : collator.compare(String(av), String(bv));
          return sort.dir === "asc" ? r : -r;
        });
      }
    }
    return list;
  }, [rows, filters, filterValues, query, columns, sort, locale]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function exportCSV() {
    downloadCSV(
      `${table}-${new Date().toISOString().slice(0, 10)}`,
      columns.map((c) => c.header),
      visible.map((row) => columns.map((c) => c.value(row))),
    );
  }

  function confirmDelete() {
    if (!deleting) return;
    startDelete(async () => {
      const res = await deleteRecord(table, deleting.id);
      if (res.ok) {
        toast.success(t.common.deleted);
        setDeleting(null);
      } else {
        toast.error(res.error === "unauthorized" ? t.common.errorUnauthorized : t.common.errorGeneric);
      }
    });
  }

  const formOpen = creating || editing !== null;
  const primary = columns.find((c) => c.primary) ?? columns[0];

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {rows.length > 0 && (
              <Button variant="outline" onClick={exportCSV}>
                <Download />
                <span className="max-sm:hidden">{t.common.export}</span>
              </Button>
            )}
            <Button onClick={() => setCreating(true)} disabled={Boolean(blockedReason)} title={blockedReason}>
              <Plus />
              {labels.add}
            </Button>
          </>
        }
      />

      {blockedReason && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {blockedReason}
        </p>
      )}

      {summary}

      {rows.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={labels.emptyTitle}
          text={labels.emptyText}
          action={
            !blockedReason && (
              <Button onClick={() => setCreating(true)}>
                <Plus />
                {labels.add}
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={t.common.search}
                className="ps-10"
                type="search"
              />
            </div>
            {filters.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {filters.map((f) => (
                  <Select
                    key={f.key}
                    value={filterValues[f.key] ?? ""}
                    onChange={(e) => {
                      setFilterValues((v) => ({ ...v, [f.key]: e.target.value }));
                      setPage(0);
                    }}
                    className="sm:w-44"
                    aria-label={f.label}
                  >
                    <option value="">
                      {f.label}: {t.common.all}
                    </option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ))}
              </div>
            )}
          </div>

          {visible.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">{t.common.noResults}</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="scrollbar-thin relative hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-start text-xs font-semibold text-muted-foreground">
                      {columns.map((c) => (
                        <th
                          key={c.key}
                          className={cn("px-4 py-3 text-start font-semibold whitespace-nowrap", c.wideOnly && "hidden 2xl:table-cell", c.className)}
                        >
                          {c.sortable === false ? (
                            c.header
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSort(c.key)}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              {c.header}
                              <ArrowDownUp className={cn("size-3", sort?.key === c.key ? "opacity-100" : "opacity-30")} />
                            </button>
                          )}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-end">
                        <span className="sr-only">{t.common.actions}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageRows.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-muted/40">
                        {columns.map((c) => (
                          <td
                            key={c.key}
                            className={cn(
                              "px-4 py-3 align-middle",
                              !c.wrap && "whitespace-nowrap",
                              c.wideOnly && "hidden 2xl:table-cell",
                              c.className,
                            )}
                          >
                            {c.render ? c.render(row) : (c.value(row) ?? "—")}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <RowButtons
                            onEdit={() => setEditing(row)}
                            onDelete={() => setDeleting(row)}
                            extra={rowActions?.(row)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phone cards */}
              <ul className="divide-y divide-border md:hidden">
                {pageRows.map((row) => (
                  <li key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 font-semibold">{primary.render ? primary.render(row) : primary.value(row)}</div>
                      <RowButtons
                        onEdit={() => setEditing(row)}
                        onDelete={() => setDeleting(row)}
                        extra={rowActions?.(row)}
                      />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                      {columns
                        .filter((c) => c !== primary && !c.hideOnMobile)
                        .map((c) => (
                          <div key={c.key} className="min-w-0">
                            <dt className="text-xs text-muted-foreground">{c.header}</dt>
                            <dd className="mt-0.5 truncate">{c.render ? c.render(row) : (c.value(row) ?? "—")}</dd>
                          </div>
                        ))}
                    </dl>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
                <span>{fmt(t.common.records, { n: visible.length })}</span>
                {pageCount > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 0}
                      aria-label="Previous"
                    >
                      <ChevronLeft className="rtl:rotate-180" />
                    </Button>
                    <span className="tabular-nums">
                      {currentPage + 1} / {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= pageCount - 1}
                      aria-label="Next"
                    >
                      <ChevronRight className="rtl:rotate-180" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      <ResourceForm
        open={formOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        table={table}
        title={editing ? labels.edit : labels.add}
        fields={fields}
        recordId={editing?.id}
        initial={toFormValues(
          fields,
          editing ? (toForm ? toForm(editing) : (editing as Record<string, unknown>)) : (defaults ?? {}),
        )}
        errorMessages={errorMessages}
        extra={formExtra}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deletePending}
      />
    </>
  );
}

function RowButtons({ onEdit, onDelete, extra }: { onEdit: () => void; onDelete: () => void; extra?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      {extra}
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={t.common.edit} title={t.common.edit}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label={t.common.delete}
        title={t.common.delete}
        className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
