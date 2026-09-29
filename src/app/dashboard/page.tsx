import type { Metadata } from "next";
import { DashboardView } from "@/components/views/dashboard-view";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.dashboard };
}

export default function DashboardPage() {
  return <DashboardView />;
}
