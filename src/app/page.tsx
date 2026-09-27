import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChartColumn,
  ClipboardList,
  CloudSun,
  Droplets,
  Languages,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Wheat,
  LandPlot,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LocaleToggle, ThemeToggle } from "@/components/preferences";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { projectInfo } from "@/lib/site";
import { getCurrentUser } from "@/lib/supabase/server";

const featureIcons = [Sprout, Droplets, ClipboardList, CloudSun, Package, ChartColumn];
const featureTones = [
  "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
];

export default async function LandingPage() {
  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-dvh overflow-x-clip">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/">
            <Logo name={t.common.appName} />
          </Link>
          <nav className="ms-6 hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              {t.nav.features}
            </a>
            <a href="#how" className="hover:text-foreground">
              {t.nav.howItWorks}
            </a>
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm", className: "ms-1 h-9" })}>
                {t.landing.goToDashboard}
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "h-9 max-sm:hidden" })}>
                  {t.landing.ctaSecondary}
                </Link>
                <Link href="/register" className={buttonVariants({ size: "sm", className: "ms-1 h-9" })}>
                  {t.landing.ctaPrimary}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ---------- hero ---------- */}
        <section className="relative">
          <div className="bg-dots pointer-events-none absolute inset-0 text-brand-900/10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] dark:text-brand-100/10" />
          <div className="pointer-events-none absolute -top-40 start-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl rtl:translate-x-1/2" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:pb-24">
            <div className="animate-slide-up text-center lg:text-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200">
                <Sparkles className="size-3.5" />
                {t.landing.badge}
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                {t.landing.heroTitle}
                <span className="mt-1 block bg-linear-to-l from-brand-500 to-brand-800 bg-clip-text pb-2 text-transparent dark:from-brand-300 dark:to-brand-500">
                  {t.landing.heroHighlight}
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground lg:mx-0">{t.landing.heroSubtitle}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href={user ? "/dashboard" : "/register"} className={buttonVariants({ size: "lg" })}>
                  {user ? t.landing.goToDashboard : t.landing.ctaPrimary}
                  <Arrow />
                </Link>
                {!user && (
                  <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    {t.landing.ctaSecondary}
                  </Link>
                )}
              </div>
            </div>

            <HeroPreview
              title={t.landing.previewTitle}
              items={[
                { icon: Droplets, text: t.landing.previewIrrigation, meta: "06:00", tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" },
                { icon: ClipboardList, text: t.landing.previewTask, meta: t.enums.priority.high, tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
                { icon: Wheat, text: t.landing.previewHarvest, meta: "92%", tone: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" },
              ]}
              stats={[
                { label: t.dashboard.statActiveCrops, value: "12" },
                { label: t.dashboard.statIrrigationWeek, value: "18" },
                { label: t.dashboard.statArea, value: `42.5 ${t.common.ha}` },
              ]}
              chartLabel={t.dashboard.waterUsage}
            />
          </div>
        </section>

        {/* ---------- highlights ---------- */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            {[
              { icon: LandPlot, label: t.landing.statFields },
              { icon: Languages, label: t.landing.statLanguages },
              { icon: Smartphone, label: t.landing.statDevices },
              { icon: ShieldCheck, label: t.landing.statSecure },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- features ---------- */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.landing.featuresTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.landing.featuresSubtitle}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.landing.features.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className={`grid size-12 place-items-center rounded-2xl ${featureTones[i]}`}>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className="scroll-mt-20 bg-muted/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{t.landing.stepsTitle}</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {t.landing.steps.map((step, i) => (
                <li key={step.title} className="relative rounded-2xl border border-border bg-card p-6">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-md shadow-brand-600/30">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-center text-white sm:px-12">
            <div className="bg-dots absolute inset-0 text-white/15" />
            <Sprout className="absolute -bottom-6 -end-6 size-40 text-white/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">{t.landing.ctaTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/80">{t.landing.ctaText}</p>
              <Link
                href={user ? "/dashboard" : "/register"}
                className={buttonVariants({ size: "lg", className: "mt-8 bg-white text-brand-800 hover:bg-brand-50 dark:bg-white dark:text-brand-800 dark:hover:bg-brand-50" })}
              >
                {user ? t.landing.goToDashboard : t.landing.ctaPrimary}
                <Arrow />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo name={t.common.appName} tagline={t.common.appTagline} />
            <p className="mt-3 text-sm text-muted-foreground">
              © {projectInfo.year} {t.common.appName}. {t.landing.footerRights}
            </p>
          </div>
          <dl className="space-y-1 text-sm text-muted-foreground md:text-end">
            <div>
              <dt className="inline font-medium text-foreground">{t.landing.footerProject}</dt>
              <dd className="inline"> — {projectInfo.university[locale]}</dd>
            </div>
            {projectInfo.student[locale] && (
              <div>
                <dt className="inline">{t.landing.footerStudent}: </dt>
                <dd className="inline">{projectInfo.student[locale]}</dd>
              </div>
            )}
            <div>
              <dt className="inline">{t.landing.footerSupervisor}: </dt>
              <dd className="inline">{projectInfo.supervisor}</dd>
            </div>
          </dl>
        </div>
      </footer>
    </div>
  );
}

/** Decorative dashboard mock-up shown in the hero. */
function HeroPreview({
  title,
  items,
  stats,
  chartLabel,
}: {
  title: string;
  items: { icon: React.ElementType; text: string; meta: string; tone: string }[];
  stats: { label: string; value: string }[];
  chartLabel: string;
}) {
  const bars = [38, 52, 44, 70, 62, 84, 76];
  return (
    <div className="relative mx-auto w-full max-w-lg animate-fade-in" aria-hidden>
      <div className="absolute -inset-4 rounded-[2rem] bg-linear-to-br from-brand-300/40 to-sky-300/30 blur-2xl dark:from-brand-700/30 dark:to-sky-800/20" />
      <div className="relative rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-brand-900/10">
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-muted/70 p-3">
              <p className="truncate text-[11px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground">{chartLabel}</p>
          <div className="mt-3 flex h-28 items-end gap-2" dir="ltr">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-sky-500" : "bg-sky-500/35"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{title}</p>
          <ul className="space-y-2">
            {items.map(({ icon: Icon, text, meta, tone }) => (
              <li key={text} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 truncate text-sm font-medium">{text}</span>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  {meta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
