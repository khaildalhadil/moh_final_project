"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n/provider";
import { dirOf, type Locale } from "@/lib/i18n/config";

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider locale={locale}>
        {children}
        <Toaster
          dir={dirOf(locale)}
          position={locale === "ar" ? "top-left" : "top-right"}
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: "var(--font-plex)" } }}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}
