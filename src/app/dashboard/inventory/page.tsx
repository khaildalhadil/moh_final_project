import type { Metadata } from "next";
import { InventoryView } from "@/components/views/inventory-view";
import { getInventory } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.inventory.title };
}

export default async function InventoryPage() {
  const rows = await getInventory();
  return <InventoryView rows={rows} />;
}
