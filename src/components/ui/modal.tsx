"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

/**
 * Accessible modal built on the native <dialog> element (focus trap, Esc to close, top layer).
 * On phones it renders as a bottom sheet.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start typing in the first field on desktop (skip on touch screens so the keyboard doesn't pop up).
      if (window.matchMedia("(pointer: fine)").matches) {
        dialog.querySelector<HTMLElement>("form input:not([type=hidden]), form select, form textarea")?.focus();
      }
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl border border-border bg-card p-0 text-foreground shadow-2xl",
        "backdrop:bg-black/50 backdrop:backdrop-blur-[2px] open:animate-slide-up",
        "sm:m-auto sm:max-h-[88dvh] sm:rounded-2xl",
        size === "sm" && "sm:max-w-md",
        size === "md" && "sm:max-w-xl",
        size === "lg" && "sm:max-w-3xl",
      )}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-muted sm:hidden" aria-hidden />
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t.common.close}
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && (
            <footer className="pb-safe flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-5 py-4 sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
