import type { Metadata } from "next";
import { SettingsView } from "@/components/views/settings-view";
import { getProfile } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.title };
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;

  return (
    <SettingsView
      profile={{
        full_name: profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "",
        phone: profile?.phone ?? "",
        currency: profile?.currency ?? "SAR",
      }}
    />
  );
}
