"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/provider";
import { DEMO_ACCOUNT } from "@/lib/session";
import { signIn, signUp, type AuthError } from "@/lib/store";
import { cn } from "@/lib/utils";

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Alert({ error }: { error: AuthError | null }) {
  const { t } = useI18n();
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {t.auth[error]}
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

/** Only allow relative in-app redirects (prevents open-redirects like ?next=//evil.com). */
function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const [pending, start] = useTransition();

  function submit(withEmail: string, withPassword: string) {
    const failure = signIn(withEmail, withPassword);
    setError(failure);
    if (!failure) start(() => router.replace(safeNext(next)));
  }

  return (
    <>
      <Heading title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(email, password);
        }}
        className="space-y-5"
      >
        <Alert error={error} />
        <div>
          <Label htmlFor="email">{t.auth.email}</Label>
          <IconInput
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            dir="ltr"
            className="rtl:text-right"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">{t.auth.password}</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {t.auth.login}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/60">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200">
          <Sparkles className="size-4" />
          {t.auth.demoTitle}
        </p>
        <p className="mt-1 text-sm text-brand-900/80 dark:text-brand-100/80">{t.auth.demoText}</p>
        <p className="mt-2 font-mono text-xs text-brand-900 dark:text-brand-100" dir="ltr">
          {DEMO_ACCOUNT.email} · {DEMO_ACCOUNT.password}
        </p>
        <Button
          variant="secondary"
          className="mt-3 w-full bg-white dark:bg-brand-900"
          disabled={pending}
          onClick={() => {
            setEmail(DEMO_ACCOUNT.email);
            setPassword(DEMO_ACCOUNT.password);
            submit(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
          }}
        >
          {t.auth.useDemo}
        </Button>
      </div>

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
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    const failure = signUp({
      full_name: value("full_name"),
      email: value("email"),
      phone: value("phone"),
      password: value("password"),
      confirm: value("confirm_password"),
    });
    setError(failure);
    if (!failure) start(() => router.replace("/dashboard"));
  }

  return (
    <>
      <Heading title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert error={error} />
        <div>
          <Label htmlFor="full_name">{t.auth.fullName}</Label>
          <IconInput icon={UserRound} id="full_name" name="full_name" autoComplete="name" required minLength={2} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <IconInput icon={Mail} id="email" name="email" type="email" autoComplete="email" required dir="ltr" className="rtl:text-right" />
          </div>
          <div>
            <Label htmlFor="phone">
              {t.auth.phone} <span className="text-xs font-normal text-muted-foreground">({t.common.optional})</span>
            </Label>
            <IconInput icon={Phone} id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" className="rtl:text-right" />
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
