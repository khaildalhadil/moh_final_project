import type { Metadata } from "next";
import { FieldsScreen } from "@/components/views/fields-view";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.fields.title };
}

export default function Page() {
  return <FieldsScreen />;
}
