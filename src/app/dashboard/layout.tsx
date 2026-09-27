import { redirect } from "next/navigation";
import { AppProvider } from "@/components/dashboard/app-context";
import { AppShell } from "@/components/dashboard/app-shell";
import { getAlerts, getProfile } from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = todayISO();
  const [profile, alerts] = await Promise.all([getProfile(user.id), getAlerts(today)]);

  return (
    <AppProvider
      value={{
        today,
        currency: profile?.currency ?? "SAR",
        user: {
          name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
          email: user.email ?? "",
          memberSince: user.created_at,
        },
        alerts,
      }}
    >
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
