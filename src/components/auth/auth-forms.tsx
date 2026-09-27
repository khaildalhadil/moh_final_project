"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CircleCheck, Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthState } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Alert({ state }: { state: AuthState }) {
  const { t } = useI18n();
  if (!state?.error) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {t.auth[state.error]}
    </p>
  );
}

function IconInput({ icon: Icon, className, ...props }: React.ComponentProps<typeof Input> & { icon: React.ElementType }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("ps-11", className)} {...props} />
    </div>
  );
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
      <Input {...props} type={visible ? "text" : "password"} dir="ltr" className="ps-11 pe-11 rtl:text-right" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        aria-label={t.auth.password}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SuccessPanel({ title, text }: { title: string; text: string }) {
  const { t } = useI18n();
  return (
    <div className="text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
        <CircleCheck className="size-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{text}</p>
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        {t.auth.backToLogin}
      </Link>
    </div>
  );
}

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signIn, linkError ? { error: "linkInvalid" } : undefined);

  return (
    <>
      <Heading title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle} />
      <form action={action} className="space-y-5">
        <Alert state={state} />
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <Label htmlFor="email">{t.auth.email}</Label>
          <IconInput icon={Mail} id="email" name="email" type="email" autoComplete="email" required dir="ltr" defaultValue={state?.email} className="rtl:text-right" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              {t.auth.password}
            </Label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">
              {t.auth.forgotPassword}
            </Link>
          </div>
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {t.auth.login}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
          {t.auth.register}
        </Link>
      </p>
    </>
  );
}

export function RegisterForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signUp, undefined);

  if (state?.success) return <SuccessPanel title={t.auth.checkEmailTitle} text={t.auth[state.success]} />;

  return (
    <>
      <Heading title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle} />
      <form action={action} className="space-y-4">
        <Alert state={state} />
        <div>
          <Label htmlFor="full_name">{t.auth.fullName}</Label>
          <IconInput icon={UserRound} id="full_name" name="full_name" autoComplete="name" required minLength={2} defaultValue={state?.fullName} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <IconInput icon={Mail} id="email" name="email" type="email" autoComplete="email" required dir="ltr" defaultValue={state?.email} className="rtl:text-right" />
          </div>
          <div>
            <Label htmlFor="phone">
              {t.auth.phone} <span className="text-xs font-normal text-muted-foreground">({t.common.optional})</span>
            </Label>
            <IconInput icon={Phone} id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" className="rtl:text-right" defaultValue={state?.phone} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div>
            <Label htmlFor="confirm_password">{t.auth.confirmPassword}</Label>
            <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" required minLength={8} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t.auth.weakPassword}</p>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {t.auth.register}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
          {t.auth.login}
        </Link>
      </p>
    </>
  );
}

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) return <SuccessPanel title={t.auth.checkEmailTitle} text={t.auth[state.success]} />;

  return (
    <>
      <Heading title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle} />
      <form action={action} className="space-y-5">
        <Alert state={state} />
        <div>
          <Label htmlFor="email">{t.auth.email}</Label>
          <IconInput icon={Mail} id="email" name="email" type="email" autoComplete="email" required dir="ltr" defaultValue={state?.email} className="rtl:text-right" />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {t.auth.sendResetLink}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
          {t.auth.backToLogin}
        </Link>
      </p>
    </>
  );
}

export function ResetPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(updatePassword, undefined);

  if (state?.success) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <CircleCheck className="size-8" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">{t.auth.passwordUpdated}</h1>
        <Link href="/dashboard" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
          {t.nav.dashboard} →
        </Link>
      </div>
    );
  }

  return (
    <>
      <Heading title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle} />
      <form action={action} className="space-y-5">
        <Alert state={state} />
        <div>
          <Label htmlFor="password">{t.auth.newPassword}</Label>
          <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} />
        </div>
        <div>
          <Label htmlFor="confirm_password">{t.auth.confirmPassword}</Label>
          <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" required minLength={8} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {t.auth.updatePassword}
        </Button>
      </form>
    </>
  );
}
