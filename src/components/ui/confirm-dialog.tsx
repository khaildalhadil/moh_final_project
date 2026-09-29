"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "./button";
import { Modal } from "./modal";
import { useI18n } from "@/lib/i18n/provider";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading,
  title,
  text,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  text?: string;
  confirmLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-red-600" />
          {title ?? t.common.deleteConfirmTitle}
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t.common.delete}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{text ?? t.common.deleteConfirmText}</p>
    </Modal>
  );
}
