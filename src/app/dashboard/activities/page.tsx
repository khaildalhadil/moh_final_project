import type { Metadata } from "next";
import { ActivitiesView } from "@/components/views/activities-view";
import { getActivities, getFarmOptions, getFieldOptions } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.activities.title };
}

export default async function ActivitiesPage() {
  const [rows, farms, fields] = await Promise.all([getActivities(), getFarmOptions(), getFieldOptions()]);
  return <ActivitiesView rows={rows} farms={farms} fields={fields} />;
}
