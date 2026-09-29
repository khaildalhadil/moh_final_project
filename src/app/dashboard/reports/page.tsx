import type { Metadata } from "next";
import { ReportsView } from "@/components/views/reports-view";
import { getI18n } from "@/lib/i18n/server";

const RANGES = [3, 6, 12];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.reports.title };
}

export default async function ReportsPage({ searchParams }: PageProps<"/dashboard/reports">) {
  const requested = Number((await searchParams).months);
  return <ReportsView months={RANGES.includes(requested) ? requested : 6} />;
}
