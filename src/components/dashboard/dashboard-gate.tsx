"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LogoMark } from "@/components/logo";
import { isLowStock, useAppState } from "@/lib/store";
import { addDaysISO, todayISO } from "@/lib/utils";
import { AppProvider } from "./app-context";
import { AppShell } from "./app-shell";

/**
 * Client-side guard for /dashboard: waits for the browser store, redirects to
 * sign-in when nobody is signed in, and provides user info + alert counts.
 */
export function DashboardGate({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const user = state?.user ?? null;

  useEffect(() => {
    if (state && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [state, user, router, pathname]);

  const value = useMemo(() => {
    if (!state?.user) return null;
    const { db } = state;
    const today = todayISO();
    const soon = addDaysISO(today, 14);
    return {
      today,
      currency: state.user.currency,
      user: { name: state.user.full_name, email: state.user.email, memberSince: state.user.created_at },
      alerts: {
        irrigationToday: db.irrigation_schedules.filter((i) => i.scheduled_date === today && i.status === "scheduled").length,
        overdueTasks: db.activities.filter((a) => a.scheduled_date < today && (a.status === "pending" || a.status === "in_progress")).length,
        lowStock: db.inventory_items.filter(isLowStock).length,
        harvestSoon: db.crops.filter(
          (c) =>
            (c.status === "planted" || c.status === "growing") &&
            c.expected_harvest_date != null &&
            c.expected_harvest_date >= today &&
            c.expected_harvest_date <= soon,
        ).length,
      },
    };
  }, [state]);

  if (!value) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <LogoMark className="size-14 animate-pulse" />
      </div>
    );
  }

  return (
    <AppProvider value={value}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
