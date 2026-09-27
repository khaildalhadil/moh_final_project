import {
  ChartColumn,
  ClipboardList,
  Droplets,
  LandPlot,
  LayoutDashboard,
  Package,
  Settings,
  Sprout,
  Tractor,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export type NavItem = { href: string; key: keyof Dictionary["nav"]; icon: LucideIcon };
export type NavGroup = { key: keyof Dictionary["nav"]; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    key: "groupMain",
    items: [
      { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
      { href: "/dashboard/reports", key: "reports", icon: ChartColumn },
    ],
  },
  {
    key: "groupManage",
    items: [
      { href: "/dashboard/farms", key: "farms", icon: Tractor },
      { href: "/dashboard/fields", key: "fields", icon: LandPlot },
      { href: "/dashboard/crops", key: "crops", icon: Sprout },
      { href: "/dashboard/irrigation", key: "irrigation", icon: Droplets },
      { href: "/dashboard/activities", key: "activities", icon: ClipboardList },
      { href: "/dashboard/inventory", key: "inventory", icon: Package },
    ],
  },
  {
    key: "groupSystem",
    items: [{ href: "/dashboard/settings", key: "settings", icon: Settings }],
  },
];

/** Items shown in the phone bottom bar (the rest live in the "More" drawer). */
export const mobileNav: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/crops", key: "crops", icon: Sprout },
  { href: "/dashboard/irrigation", key: "irrigation", icon: Droplets },
  { href: "/dashboard/activities", key: "activities", icon: ClipboardList },
];

export function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
