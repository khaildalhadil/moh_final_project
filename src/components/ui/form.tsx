import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground shadow-xs transition-colors " +
  "placeholder:text-muted-foreground/70 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:ring-red-500/15";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 resize-y py-2.5", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(control, "select-chevron h-11 cursor-pointer appearance-none pe-9", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props} />;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{message}</p>;
}
