import type { Metadata } from "next";
import { InventoryScreen } from "@/components/views/inventory-view";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.inventory.title };
}

export default function Page() {
  return <InventoryScreen />;
}
