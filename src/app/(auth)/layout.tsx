import Link from "next/link";
import { CircleCheck, Droplets, Sprout, Wheat } from "lucide-react";
import { Logo } from "@/components/logo";
import { LocaleToggle, ThemeToggle } from "@/components/preferences";
import { getI18n } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col">
        <header className="flex h-18 items-center justify-between px-5 sm:px-8">
          <Link href="/">
            <Logo name={t.common.appName} tagline={t.common.appTagline} />
          </Link>
          <div className="flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md animate-slide-up">
            {children}
          </div>
        </main>
      </div>

      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-dots absolute inset-0 text-white/20" />
        <div className="absolute -end-24 -top-24 size-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -start-16 size-96 rounded-full bg-amber-400/20 blur-3xl" />

        <div className="relative flex gap-3">
          {[Sprout, Droplets, Wheat].map((Icon, i) => (
            <span key={i} className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <Icon className="size-6" />
            </span>
          ))}
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-4xl font-bold leading-tight">{t.auth.sideTitle}</h2>
          <p className="mt-4 text-lg text-white/80">{t.auth.sideText}</p>
          <ul className="mt-8 space-y-3">
            {[t.auth.sidePoint1, t.auth.sidePoint2, t.auth.sidePoint3].map((point) => (
              <li key={point} className="flex items-center gap-3 text-white/90">
                <CircleCheck className="size-5 shrink-0 text-brand-200" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">
          © {new Date().getFullYear()} {t.common.appName} — {t.common.appTagline}
        </p>
      </aside>
    </div>
  );
}
