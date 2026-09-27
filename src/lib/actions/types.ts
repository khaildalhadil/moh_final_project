export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      /** Translation key under `common` (or a table-specific key for field errors). */
      error: "unauthorized" | "validation" | "generic";
      fieldErrors?: Record<string, string>;
    };
