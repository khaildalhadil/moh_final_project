import type { Metadata } from "next";
import { FieldsView } from "@/components/views/fields-view";
import { getFarmOptions, getFields } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.fields.title };
}

export default async function FieldsPage() {
  const [rows, farms] = await Promise.all([getFields(), getFarmOptions()]);
  return <FieldsView rows={rows} farms={farms} />;
}
