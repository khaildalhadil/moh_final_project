import type { Metadata } from "next";
import { CropsScreen } from "@/components/views/crops-view";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.crops.title };
}

export default function Page() {
  return <CropsScreen />;
}
