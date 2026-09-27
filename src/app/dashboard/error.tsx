"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useI18n } from "@/lib/i18n/provider";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  console.error(error);
  return (
    <EmptyState
      icon={<TriangleAlert />}
      title={t.common.errorPageTitle}
      text={t.common.errorPageText}
      className="mt-10"
      action={<Button onClick={reset}>{t.common.retry}</Button>}
    />
  );
}
