import { ar } from "./dictionaries/ar";
import { en, type Dictionary } from "./dictionaries/en";
import type { Locale } from "./config";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { ar, en };

/** Replace `{name}` placeholders: fmt("{n} days", { n: 3 }) → "3 days". */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
