import { cn } from "@/lib/utils";

/** Brand mark: a sprout inside a rounded square. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-700/25",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[60%]" aria-hidden>
        <path d="M12 21v-8" />
        <path d="M12 13c0-4 3-7 8-7 0 4.5-3 7-8 7Z" fill="currentColor" fillOpacity=".25" />
        <path d="M12 15c0-3.5-2.5-6-7-6 0 4 2.5 6 7 6Z" fill="currentColor" fillOpacity=".25" />
        <path d="M7 21h10" />
      </svg>
    </span>
  );
}

export function Logo({ name, tagline, className }: { name: string; tagline?: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block text-lg font-bold tracking-tight">{name}</span>
        {tagline && <span className="block text-[11px] font-medium text-muted-foreground">{tagline}</span>}
      </span>
    </span>
  );
}
