import type { Metadata } from "next";
import { FarmsView } from "@/components/views/farms-view";
import { getCrops, getFarms, getFields } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.farms.title };
}

export default async function FarmsPage() {
  const [farms, fields, crops] = await Promise.all([getFarms(), getFields(), getCrops()]);

  const fieldFarm = new Map(fields.map((f) => [f.id, f.farm_id]));
  const withStats = farms.map((farm) => ({
    ...farm,
    fieldsCount: fields.filter((f) => f.farm_id === farm.id).length,
    activeCrops: crops.filter(
      (c) => fieldFarm.get(c.field_id) === farm.id && (c.status === "planted" || c.status === "growing"),
    ).length,
  }));

  return <FarmsView farms={withStats} />;
}
