"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Droplets, Ellipsis, LogOut, Menu, Package, Settings, Sprout, TriangleAlert, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { LocaleToggle, ThemeToggle } from "@/components/preferences";
import { signOut } from "@/lib/actions/auth";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { useApp } from "./app-context";
import { isActive, mobileNav, navGroups } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (adjusting state during render instead of in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  return (
    <div className="min-h-dvh lg:ps-72">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 start-0 z-30 hidden w-72 flex-col border-e border-border bg-card lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "no-print fixed inset-0 z-50 overflow-hidden lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn("absolute inset-0 bg-black/50 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 start-0 flex w-[84%] max-w-80 flex-col bg-card shadow-2xl transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          )}
          inert={!drawerOpen}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="absolute end-3 top-4 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <SidebarContent />
        </aside>
      </div>

      <Topbar onMenu={() => setDrawerOpen(true)} />

      <main className="print-full mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-12">
        {children}
      </main>

      <MobileNav onMore={() => setDrawerOpen(true)} />
    </div>
  );
}

function SidebarContent() {
  const { t } = useI18n();
  const { user } = useApp();
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-18 items-center px-5">
        <Link href="/dashboard">
          <Logo name={t.common.appName} tagline={t.common.appTagline} />
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.key}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {t.nav[group.key]}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, key, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        className={cn(
                          "size-[18px]",
                          active ? "text-brand-600 dark:text-brand-400" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {t.nav[key]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <Avatar name={user.name || user.email} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name || "—"}</p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
              aria-label={t.nav.logout}
              title={t.nav.logout}
            >
              <LogOut className="size-[18px] rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useI18n();

  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted lg:hidden"
          aria-label={t.nav.menu}
        >
          <Menu className="size-5" />
        </button>
        <Link href="/dashboard" className="lg:hidden">
          <span className="text-lg font-bold">{t.common.appName}</span>
        </Link>

        <div className="ms-auto flex items-center gap-1">
          <LocaleToggle />
          <ThemeToggle />
          <AlertsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function AlertsMenu() {
  const { t } = useI18n();
  const { alerts } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const items = [
    { n: alerts.irrigationToday, text: t.alerts.irrigationToday, href: "/dashboard/irrigation", icon: Droplets, tone: "text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300" },
    { n: alerts.overdueTasks, text: t.alerts.overdueTasks, href: "/dashboard/activities", icon: TriangleAlert, tone: "text-red-600 bg-red-50 dark:bg-red-950/60 dark:text-red-300" },
    { n: alerts.lowStock, text: t.alerts.lowStock, href: "/dashboard/inventory", icon: Package, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300" },
    { n: alerts.harvestSoon, text: t.alerts.harvestSoon, href: "/dashboard/crops", icon: Sprout, tone: "text-brand-700 bg-brand-50 dark:bg-brand-950 dark:text-brand-300" },
  ].filter((i) => i.n > 0);
  const total = items.reduce((s, i) => s + i.n, 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={t.alerts.title}
        aria-expanded={open}
      >
        <Bell className="size-[18px]" />
        {total > 0 && (
          <span className="absolute end-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] animate-fade-in overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">{t.alerts.title}</p>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t.alerts.none}</p>
          ) : (
            <ul className="p-2">
              {items.map(({ n, text, href, icon: Icon, tone }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl p-2.5 text-sm hover:bg-muted"
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tone)}>
                      <Icon className="size-4" />
                    </span>
                    {fmt(text, { n })}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useI18n();
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ms-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t.settings.account}
        aria-expanded={open}
      >
        <Avatar name={user.name || user.email} />
      </button>
      {open && (
        <div className="absolute end-0 top-12 z-40 w-64 animate-fade-in overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name || "—"}</p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
          <div className="p-2">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm hover:bg-muted"
            >
              <Settings className="size-4 text-muted-foreground" />
              {t.nav.settings}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <LogOut className="size-4 rtl:rotate-180" />
                {t.nav.logout}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNav({ onMore }: { onMore: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-lg lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {mobileNav.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-brand-700 dark:text-brand-300" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors",
                    active && "bg-brand-100 dark:bg-brand-900",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {t.nav[key]}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
          >
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <Ellipsis className="size-5" />
            </span>
            {t.nav.more}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  // Arabic letters join together, so a single initial reads better than two.
  const initials = /[؀-ۿ]/.test(name)
    ? (parts[0]?.[0] ?? "")
    : parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
