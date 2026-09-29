"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Database } from "lucide-react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { loadDemoData } from "@/lib/store";
import { useI18n } from "@/lib/i18n/provider";

export function DemoDataButton({ variant = "primary" }: { variant?: ButtonVariant }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();

  return (
    <Button
      variant={variant}
      size="lg"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await loadDemoData();
          if (res.ok) toast.success(t.dashboard.demoLoaded);
          else toast.error(res.error === "unauthorized" ? t.common.errorUnauthorized : t.common.errorGeneric);
        })
      }
    >
      {!pending && <Database />}
      {pending ? t.dashboard.loadingDemo : t.dashboard.loadDemo}
    </Button>
  );
}
