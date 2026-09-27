"use client";

import Link from "next/link";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Info,
  MapPin,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { cn, formatDate } from "@/lib/utils";
import type { WeatherData, WeatherGroup } from "@/lib/weather";

const icons: Record<WeatherGroup, LucideIcon> = {
  clear: Sun,
  cloudy: CloudSun,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

const advisoryStyle = {
  rain: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100",
  high: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
  moderate: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  low: "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-100",
};

export function WeatherCard({ farmName, weather }: { farmName: string | null; weather: WeatherData | null }) {
  const { t, locale } = useI18n();

  if (!farmName) {
    return (
      <Card className="h-full">
        <CardHeader title={t.weather.title} icon={<CloudSun />} />
        <CardContent>
          <div className="flex flex-col items-center rounded-xl bg-muted/60 px-4 py-8 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">{t.weather.noLocationTitle}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.weather.noLocationText}</p>
            <Link href="/dashboard/farms" className="mt-4 text-sm font-semibold text-brand-700 dark:text-brand-400">
              {t.nav.farms} →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="h-full">
        <CardHeader title={t.weather.title} description={farmName} icon={<Cloud />} />
        <CardContent>
          <p className="rounded-xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">{t.weather.unavailable}</p>
        </CardContent>
      </Card>
    );
  }

  const Now = icons[weather.current.group];
  const a = weather.advisory;
  const advice =
    a.kind === "rain"
      ? fmt(t.weather.advisoryRain, { mm: a.rainMm })
      : fmt(t.weather[a.kind === "high" ? "advisoryHigh" : a.kind === "moderate" ? "advisoryModerate" : "advisoryLow"], { et: a.et0 });

  return (
    <Card className="h-full overflow-hidden">
      <div className="relative bg-linear-to-br from-sky-500 via-sky-600 to-brand-700 p-5 text-white">
        <div className="bg-dots absolute inset-0 text-white/25" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-white/85">
              <MapPin className="size-4" />
              {farmName}
            </p>
            <p className="mt-3 text-5xl font-bold tracking-tight tabular-nums">{weather.current.temperature}°</p>
            <p className="mt-1 text-sm text-white/90">{t.weather.codes[weather.current.group]}</p>
          </div>
          <Now className="size-16 text-white/90" strokeWidth={1.5} />
        </div>
        <dl className="relative mt-5 grid grid-cols-3 gap-2 text-sm">
          {[
            { icon: Droplets, label: t.weather.humidity, value: `${weather.current.humidity}%` },
            { icon: Wind, label: t.weather.wind, value: `${weather.current.wind} km/h` },
            { icon: Thermometer, label: t.weather.et0, value: `${weather.daily[0]?.et0.toFixed(1) ?? "—"} mm` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <dt className="flex items-center gap-1 text-[11px] text-white/80">
                <Icon className="size-3.5" />
                <span className="truncate">{label}</span>
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums" dir="ltr">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <CardContent className="space-y-4">
        <div className={cn("flex gap-3 rounded-xl border p-3 text-sm", advisoryStyle[a.kind])}>
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>{advice}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t.weather.forecast}</p>
          <ul className="grid grid-cols-5 gap-1.5">
            {weather.daily.map((d) => {
              const Icon = icons[d.group];
              return (
                <li key={d.date} className="flex min-w-0 flex-col items-center rounded-xl bg-muted/60 px-1 py-2.5 text-center">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(d.date, locale, { weekday: "short", day: undefined, month: undefined, year: undefined })}
                  </span>
                  <Icon className="my-1.5 size-5 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-semibold tabular-nums" dir="ltr">
                    {d.max}° <span className="font-normal text-muted-foreground">{d.min}°</span>
                  </span>
                  {d.rain > 0 && (
                    <span className="mt-0.5 text-[10px] text-sky-600 tabular-nums dark:text-sky-400" dir="ltr">
                      {d.rain.toFixed(1)}mm
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
