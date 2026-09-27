"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { saveRecord } from "@/lib/actions/records";
import { useI18n } from "@/lib/i18n/provider";
import type { TableName } from "@/lib/validations";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "number" | "integer" | "date" | "time" | "select" | "textarea";
  required?: boolean;
  options?: Option[];
  /** Filter select options by the current value of another field (e.g. fields of the selected farm). */
  filterOptions?: (option: Option, values: FormValues) => boolean;
  placeholder?: string;
  full?: boolean;
  step?: string;
  min?: number;
  max?: number;
  hint?: string;
  dir?: "ltr" | "rtl";
};

export type FormValues = Record<string, string>;

export function toFormValues(fields: FieldDef[], source: Record<string, unknown> = {}): FormValues {
  const values: FormValues = {};
  for (const f of fields) {
    const v = source[f.name];
    if (v == null) values[f.name] = "";
    else if (f.type === "time") values[f.name] = String(v).slice(0, 5);
    else values[f.name] = String(v);
  }
  return values;
}

/** Convert string form state into typed values expected by the zod schemas. */
function toPayload(fields: FieldDef[], values: FormValues) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = (values[f.name] ?? "").trim();
    if (raw === "") out[f.name] = null;
    else if (f.type === "number") out[f.name] = Number(raw);
    else if (f.type === "integer") out[f.name] = Math.round(Number(raw));
    else out[f.name] = raw;
  }
  return out;
}

type ResourceFormProps = {
  open: boolean;
  onClose: () => void;
  table: TableName;
  title: string;
  fields: FieldDef[];
  initial: FormValues;
  recordId?: string;
  errorMessages?: Record<string, string>;
  /** Extra UI rendered below the fields (e.g. "use my location"). */
  extra?: (values: FormValues, setValues: (patch: Partial<FormValues>) => void) => React.ReactNode;
};

export function ResourceForm(props: ResourceFormProps) {
  // Mount the form only while open so every opening starts from fresh initial values.
  if (!props.open) return null;
  return <ResourceFormInner key={props.recordId ?? "new"} {...props} />;
}

function ResourceFormInner({ open, onClose, table, title, fields, initial, recordId, errorMessages, extra }: ResourceFormProps) {
  const { t } = useI18n();
  const formId = useId();
  const [values, setValuesState] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const setValues = (patch: Partial<FormValues>) =>
    setValuesState((prev) => {
      const next = { ...prev, ...patch } as FormValues;
      // Clear dependent selects whose current value is no longer allowed.
      for (const f of fields) {
        if (f.filterOptions && next[f.name] && f.options) {
          const opt = f.options.find((o) => o.value === next[f.name]);
          if (!opt || !f.filterOptions(opt, next)) next[f.name] = "";
        }
      }
      return next;
    });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await saveRecord(table, toPayload(fields, values), recordId);
      if (result.ok) {
        toast.success(t.common.saved);
        onClose();
        return;
      }
      if (result.error === "validation" && result.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [key, msg] of Object.entries(result.fieldErrors)) {
          mapped[key] = errorMessages?.[msg] ?? t.common.invalidField;
        }
        setErrors(mapped);
        toast.error(t.common.errorValidation);
      } else {
        toast.error(result.error === "unauthorized" ? t.common.errorUnauthorized : t.common.errorGeneric);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {pending ? t.common.saving : recordId ? t.common.saveChanges : t.common.save}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate={false}>
        {fields.map((f) => {
          const id = `${formId}-${f.name}`;
          const error = errors[f.name];
          const common = {
            id,
            name: f.name,
            required: f.required,
            value: values[f.name] ?? "",
            "aria-invalid": error ? true : undefined,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
              setValues({ [f.name]: e.target.value }),
          };
          const options = f.filterOptions ? f.options?.filter((o) => f.filterOptions!(o, values)) : f.options;

          return (
            <div key={f.name} className={cn((f.full || f.type === "textarea") && "sm:col-span-2")}>
              <Label htmlFor={id}>
                {f.label}
                {f.required ? (
                  <span className="text-red-500"> *</span>
                ) : (
                  <span className="ms-1 text-xs font-normal text-muted-foreground">({t.common.optional})</span>
                )}
              </Label>
              {f.type === "select" ? (
                <Select {...common}>
                  <option value="">{t.common.select}</option>
                  {options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea {...common} placeholder={f.placeholder} rows={3} />
              ) : (
                <Input
                  {...common}
                  type={f.type === "integer" ? "number" : f.type}
                  inputMode={f.type === "number" ? "decimal" : f.type === "integer" ? "numeric" : undefined}
                  step={f.step ?? (f.type === "integer" ? "1" : f.type === "number" ? "any" : undefined)}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  dir={f.dir}
                />
              )}
              {f.hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{f.hint}</p>}
              <FieldError message={error} />
            </div>
          );
        })}
        {extra && <div className="sm:col-span-2">{extra(values, setValues)}</div>}
      </form>
    </Modal>
  );
}
