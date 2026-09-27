import type { Metadata } from "next";
import { IrrigationView } from "@/components/views/irrigation-view";
import { getFarmOptions, getFieldOptions, getIrrigation } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.irrigation.title };
}

export default async function IrrigationPage() {
  const [rows, fields, farms] = await Promise.all([getIrrigation(), getFieldOptions(), getFarmOptions()]);
  return <IrrigationView rows={rows} fields={fields} farms={farms} />;
}
