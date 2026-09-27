import { cn } from "@/lib/utils";

const tones = {
  green: "bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-400/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-400/20",
  red: "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-400/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-400/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-400/20",
  gray: "bg-muted text-muted-foreground ring-foreground/10",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "gray",
  dot,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
