import type { Metadata } from "next";
import { CropsView } from "@/components/views/crops-view";
import { getCrops, getFarmOptions, getFieldOptions } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.crops.title };
}

export default async function CropsPage() {
  const [rows, fields, farms] = await Promise.all([getCrops(), getFieldOptions(), getFarmOptions()]);
  return <CropsView rows={rows} fields={fields} farms={farms} />;
}
