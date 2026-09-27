"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * "Create" modal state that can be opened from a link such as `/dashboard/crops?new=1`
 * (used by the dashboard quick actions). Closing it cleans the query string.
 */
export function useCreateParam() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [creating, setCreatingState] = useState(() => params.get("new") === "1");

  const setCreating = (open: boolean) => {
    setCreatingState(open);
    if (!open && params.get("new")) router.replace(pathname, { scroll: false });
  };

  return [creating, setCreating] as const;
}
