"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Palette, UserRound } from "lucide-react";
import { Avatar } from "@/components/dashboard/app-shell";
import { useApp } from "@/components/dashboard/app-context";
import { LocaleSelector, ThemeSelector } from "@/components/preferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { updatePassword, type AuthState } from "@/lib/actions/auth";
import { updateProfile } from "@/lib/actions/profile";
import { CURRENCIES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils";

export function SettingsView({ profile }: { profile: { full_name: string; phone: string; currency: string } }) {
  const { t, locale } = useI18n();
  const { user } = useApp();
  const [values, setValues] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(async (prev, formData) => {
    const result = await updatePassword(prev, formData);
    if (result?.success) toast.success(t.auth.passwordUpdated);
    return result;
  }, undefined);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    start(async () => {
      const res = await updateProfile({ ...values, phone: values.phone || null });
      if (res.ok) toast.success(t.settings.profileSaved);
      else {
        if (res.error === "validation" && res.fieldErrors) {
          setErrors(Object.fromEntries(Object.keys(res.fieldErrors).map((k) => [k, t.common.invalidField])));
        }
        toast.error(res.error === "validation" ? t.common.errorValidation : t.common.errorGeneric);
      }
    });
  }

  return (
    <>
      <PageHeader title={t.settings.title} description={t.settings.subtitle} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Avatar name={values.full_name || user.email} className="size-20 text-2xl" />
            <p className="mt-4 text-lg font-semibold">{values.full_name || "—"}</p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {user.email}
            </p>
            <p className="mt-4 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {t.settings.memberSince} {formatDate(user.memberSince.slice(0, 10), locale)}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title={t.settings.profile} description={t.settings.profileText} icon={<UserRound />} />
            <CardContent>
              <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">{t.auth.fullName}</Label>
                  <Input
                    id="full_name"
                    value={values.full_name}
                    onChange={(e) => setValues({ ...values, full_name: e.target.value })}
                    required
                    aria-invalid={errors.full_name ? true : undefined}
                  />
                  <FieldError message={errors.full_name} />
                </div>
                <div>
                  <Label htmlFor="phone">{t.auth.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    value={values.phone}
                    onChange={(e) => setValues({ ...values, phone: e.target.value })}
                  />
                  <FieldError message={errors.phone} />
                </div>
                <div>
                  <Label htmlFor="currency">{t.settings.currency}</Label>
                  <Select id="currency" value={values.currency} onChange={(e) => setValues({ ...values, currency: e.target.value })}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c} — {new Intl.DisplayNames([locale], { type: "currency" }).of(c)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={pending}>
                    {t.common.saveChanges}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t.settings.preferences} description={t.settings.preferencesText} icon={<Palette />} />
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">{t.common.language}</span>
                <LocaleSelector />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">{t.common.theme}</span>
                <ThemeSelector />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t.settings.security} description={t.settings.securityText} icon={<KeyRound />} />
            <CardContent>
              <form action={pwAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="password">{t.auth.newPassword}</Label>
                  <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required dir="ltr" />
                </div>
                <div>
                  <Label htmlFor="confirm_password">{t.auth.confirmPassword}</Label>
                  <Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required dir="ltr" />
                </div>
                {pwState?.error && (
                  <p className="text-sm font-medium text-red-600 sm:col-span-2 dark:text-red-400">{t.auth[pwState.error]}</p>
                )}
                <div className="sm:col-span-2">
                  <Button type="submit" variant="secondary" loading={pwPending}>
                    {t.auth.updatePassword}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
