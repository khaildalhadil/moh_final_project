import type { Dictionary } from "@/lib/i18n";

/** Build <select> options for an enum from its translated labels. */
export function enumOptions<K extends keyof Dictionary["enums"]>(t: Dictionary, kind: K, values: readonly string[]) {
  const labels = t.enums[kind] as Record<string, string>;
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export function enumLabel<K extends keyof Dictionary["enums"]>(t: Dictionary, kind: K, value: string | null | undefined) {
  if (!value) return null;
  return (t.enums[kind] as Record<string, string>)[value] ?? value;
}
