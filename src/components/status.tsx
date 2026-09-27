"use client";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";

type EnumKind = "fieldStatus" | "cropStatus" | "irrigationStatus" | "activityStatus" | "priority";

const tones: Record<EnumKind, Record<string, BadgeTone>> = {
  fieldStatus: { active: "green", fallow: "gray", preparing: "amber" },
  cropStatus: { planned: "violet", planted: "blue", growing: "green", harvested: "amber", failed: "red" },
  irrigationStatus: { scheduled: "blue", completed: "green", skipped: "amber", cancelled: "gray" },
  activityStatus: { pending: "amber", in_progress: "blue", completed: "green", cancelled: "gray" },
  priority: { low: "gray", medium: "blue", high: "red" },
};

export function StatusBadge({ kind, value }: { kind: EnumKind; value: string }) {
  const { t } = useI18n();
  const labels = t.enums[kind] as Record<string, string>;
  return (
    <Badge tone={tones[kind][value] ?? "gray"} dot>
      {labels[value] ?? value}
    </Badge>
  );
}
