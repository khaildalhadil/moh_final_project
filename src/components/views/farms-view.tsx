"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowUpRight, LandPlot, LocateFixed, MapPin, Pencil, Plus, Ruler, Sprout, Tractor, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ResourceForm, toFormValues, type FieldDef, type FormValues } from "@/components/resource/resource-form";
import { useCreateParam } from "@/components/resource/use-create-param";
import { deleteRecord, select, useData } from "@/lib/store";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n";
import type { Farm } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export type FarmWithStats = Farm & { fieldsCount: number; activeCrops: number };

export function farmFields(t: Dictionary): FieldDef[] {
  return [
    { name: "name", label: t.farms.name, type: "text", required: true },
    { name: "location", label: t.farms.location, type: "text" },
    { name: "area", label: t.farms.area, type: "number", min: 0 },
    { name: "latitude", label: t.farms.latitude, type: "number", min: -90, max: 90, dir: "ltr", hint: t.farms.coordsHint },
    { name: "longitude", label: t.farms.longitude, type: "number", min: -180, max: 180, dir: "ltr" },
    { name: "description", label: t.farms.description, type: "textarea" },
  ];
}

/** Fills latitude/longitude from the browser's Geolocation API. */
export function LocateButton({ setValues }: { setValues: (patch: Partial<FormValues>) => void }) {
  const { t } = useI18n();
  const [locating, setLocating] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={locating}
      onClick={() => {
        if (!navigator.geolocation) return toast.error(t.farms.locationError);
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setValues({
              latitude: pos.coords.latitude.toFixed(6),
              longitude: pos.coords.longitude.toFixed(6),
            });
            setLocating(false);
          },
          () => {
            toast.error(t.farms.locationError);
            setLocating(false);
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }}
    >
      {!locating && <LocateFixed />}
      {locating ? t.farms.locating : t.farms.useMyLocation}
    </Button>
  );
}

/** Page entry: farms from the local store with field/crop counts. */
export function FarmsScreen() {
  const { db } = useData();
  const fieldFarm = new Map(db.fields.map((f) => [f.id, f.farm_id]));
  const farms = select.farms(db).map((farm) => ({
    ...farm,
    fieldsCount: db.fields.filter((f) => f.farm_id === farm.id).length,
    activeCrops: db.crops.filter(
      (c) => fieldFarm.get(c.field_id) === farm.id && (c.status === "planted" || c.status === "growing"),
    ).length,
  }));
  return <FarmsView farms={farms} />;
}

export function FarmsView({ farms }: { farms: FarmWithStats[] }) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState<Farm | null>(null);
  const [creating, setCreating] = useCreateParam();
  const [deleting, setDeleting] = useState<Farm | null>(null);
  const [pending, startTransition] = useTransition();
  const fields = farmFields(t);

  return (
    <>
      <PageHeader
        title={t.farms.title}
        description={t.farms.subtitle}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            {t.farms.add}
          </Button>
        }
      />

      {farms.length === 0 ? (
        <EmptyState
          icon={<Tractor />}
          title={t.farms.emptyTitle}
          text={t.farms.emptyText}
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus />
              {t.farms.add}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
              <div className="relative h-24 overflow-hidden bg-linear-to-br from-brand-500 via-brand-600 to-brand-800">
                <div className="bg-dots absolute inset-0 text-white/40" />
                <Tractor className="absolute -bottom-3 end-3 size-20 text-white/15" />
                <div className="absolute start-4 top-4 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(farm)}
                    className="bg-white/15 text-white hover:bg-white/25 hover:text-white"
                    aria-label={t.common.edit}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(farm)}
                    className="bg-white/15 text-white hover:bg-red-500 hover:text-white"
                    aria-label={t.common.delete}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold">{farm.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  <span className="truncate">{farm.location || t.common.none}</span>
                </p>
                {farm.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{farm.description}</p>}

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3 text-center">
                  <div>
                    <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <Ruler className="size-3" />
                      {t.common.ha}
                    </dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{formatNumber(farm.area, locale)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <LandPlot className="size-3" />
                      {t.farms.fieldsCount}
                    </dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{formatNumber(farm.fieldsCount, locale)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <Sprout className="size-3" />
                      {t.nav.crops}
                    </dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{formatNumber(farm.activeCrops, locale)}</dd>
                  </div>
                </dl>

                <Link
                  href={`/dashboard/farms/${farm.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400"
                >
                  {t.farms.viewDetails}
                  <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ResourceForm
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        table="farms"
        title={editing ? t.farms.edit : t.farms.add}
        fields={fields}
        recordId={editing?.id}
        initial={toFormValues(fields, editing ?? {})}
        extra={(_, setValues) => <LocateButton setValues={setValues} />}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        loading={pending}
        onConfirm={() =>
          deleting &&
          startTransition(async () => {
            const res = await deleteRecord("farms", deleting.id);
            if (res.ok) {
              toast.success(t.common.deleted);
              setDeleting(null);
            } else toast.error(t.common.errorGeneric);
          })
        }
      />
    </>
  );
}
