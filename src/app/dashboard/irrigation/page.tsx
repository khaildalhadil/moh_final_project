import type { Metadata } from "next";
import { IrrigationScreen } from "@/components/views/irrigation-view";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.irrigation.title };
}

export default function Page() {
  return <IrrigationScreen />;
}
