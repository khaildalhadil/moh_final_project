export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Intl locale tag: Gregorian calendar + Latin digits keep tables readable in Arabic. */
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-US";
}
