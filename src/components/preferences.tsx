"use client";

import { useSyncExternalStore, useTransition } from "react";
import { useTheme } from "next-themes";
import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { setLocale } from "@/lib/i18n/actions";
import { dirOf } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Toggles between Arabic and English. The Server Action sets the cookie and Next re-renders with the new locale. */
export function LocaleToggle({ className, showLabel }: { className?: string; showLabel?: boolean }) {
  const { locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          document.documentElement.lang = next;
          document.documentElement.dir = dirOf(next);
          await setLocale(next);
        })
      }
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60",
        className,
      )}
      aria-label={next === "ar" ? "العربية" : "English"}
    >
      <Languages className="size-[18px]" />
      <span className={cn(!showLabel && "max-sm:hidden")}>{next === "ar" ? "العربية" : "English"}</span>
    </button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      aria-label={t.common.theme}
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

/** Segmented control used on the settings page. */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useMounted();
  const options = [
    { value: "light", label: t.common.light, icon: Sun },
    { value: "dark", label: t.common.dark, icon: Moon },
    { value: "system", label: t.common.system, icon: Monitor },
  ];

  return (
    <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors",
            mounted && theme === value && "bg-card text-foreground shadow-xs",
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function LocaleSelector() {
  const { locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const options = [
    { value: "ar", label: "العربية" },
    { value: "en", label: "English" },
  ] as const;

  return (
    <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          disabled={pending}
          onClick={() =>
            value !== locale &&
            startTransition(async () => {
              document.documentElement.lang = value;
              document.documentElement.dir = dirOf(value);
              await setLocale(value);
            })
          }
          className={cn(
            "inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors",
            locale === value && "bg-card text-foreground shadow-xs",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const noopSubscribe = () => () => {};

/** false during SSR/hydration, true afterwards — avoids theme icon mismatches. */
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
