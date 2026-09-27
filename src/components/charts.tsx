"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/lib/i18n/provider";
import { intlLocale } from "@/lib/i18n/config";

export type ChartDatum = { label: string; [series: string]: string | number };
export type ChartSeries = { key: string; label: string; color: string };

type Props = {
  data: ChartDatum[];
  series: ChartSeries[];
  /** Formats values in tooltips. */
  format?: (value: number) => string;
  height?: number;
  /** Horizontal bars — better for long category names. */
  horizontal?: boolean;
  /** Counts: integer axis ticks only. */
  integer?: boolean;
};

/**
 * Bar/column chart following the dataviz specs: ≤24px bars, 4px rounded data-ends,
 * hairline grid, value-first tooltip, legend only for 2+ series, RTL-aware axes.
 */
export function BarsChart({ data, series, format, height = 260, horizontal, integer }: Props) {
  const { locale, dir, t } = useI18n();
  const rtl = dir === "rtl";
  const compact = new Intl.NumberFormat(intlLocale(locale), { notation: "compact", maximumFractionDigits: 1 });
  const fmt = format ?? ((v: number) => new Intl.NumberFormat(intlLocale(locale)).format(v));

  const hasData = data.some((d) => series.some((s) => Number(d[s.key]) > 0));
  if (!hasData) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground" style={{ height }}>
        {t.dashboard.noChartData}
      </div>
    );
  }

  // The rounded end sits away from the baseline, which flips in RTL.
  const radius: [number, number, number, number] = horizontal ? (rtl ? [4, 0, 0, 4] : [0, 4, 4, 0]) : [4, 4, 0, 0];
  const axisTick = { fill: "var(--chart-axis)", fontSize: 12 };
  const categoryWidth = horizontal ? Math.min(140, Math.max(...data.map((d) => d.label.length)) * 7 + 12) : undefined;

  return (
    <div style={{ height }} dir="ltr" className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          barGap={2}
          barCategoryGap="28%"
        >
          <CartesianGrid stroke="var(--chart-grid)" vertical={Boolean(horizontal)} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                reversed={rtl}
                allowDecimals={!integer}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => compact.format(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                orientation={rtl ? "right" : "left"}
                width={categoryWidth}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="label" reversed={rtl} tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} />
              <YAxis
                orientation={rtl ? "right" : "left"}
                width={44}
                allowDecimals={!integer}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => compact.format(v)}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div dir={dir} className="min-w-36 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-lg">
                  <p className="mb-1 text-xs text-muted-foreground">{String(label ?? "")}</p>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} className="flex items-center gap-2">
                      <span className="h-0.5 w-3 rounded-full" style={{ background: String(p.color) }} />
                      <span className="font-semibold tabular-nums">{fmt(Number(p.value))}</span>
                      {series.length > 1 && <span className="text-xs text-muted-foreground">{p.name}</span>}
                    </div>
                  ))}
                </div>
              );
            }}
          />
          {series.length > 1 && (
            <Legend
              iconType="rect"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)", paddingTop: 8, direction: dir }}
            />
          )}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={radius} maxBarSize={24} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
