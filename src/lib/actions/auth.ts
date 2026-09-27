"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Dictionary } from "@/lib/i18n";

type AuthKey = keyof Dictionary["auth"];
export type AuthState = { error?: AuthKey; success?: AuthKey; email?: string; fullName?: string; phone?: string } | undefined;

const email = z.email();
const password = z.string().min(8).max(72);

/** Only allow relative in-app redirects (prevents open-redirects like ?next=//evil.com). */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}

async function siteOrigin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL || h.get("origin") || `http://${h.get("host") ?? "localhost:3000"}`;
}

function mapAuthError(code: string | undefined, status?: number, fallback: AuthKey = "unknownError"): AuthKey {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "weak_password":
      return "weakPassword";
    case "email_address_invalid":
    case "validation_failed":
      return "invalidEmail";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      return status === 429 ? "rateLimited" : fallback;
  }
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "setupRequired" };
  const emailValue = String(formData.get("email") ?? "").trim();

  if (!email.safeParse(emailValue).success) return { error: "invalidEmail", email: emailValue };
  const pass = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: emailValue, password: pass });
  if (error) return { error: mapAuthError(error.code, error.status, "invalidCredentials"), email: emailValue };

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "setupRequired" };
  const fullName = String(formData.get("full_name") ?? "").trim();
  const emailValue = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const pass = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  // Echo the entered values back so the form keeps them after a failed attempt.
  const fail = (error: AuthKey): AuthState => ({ error, email: emailValue, fullName, phone });

  if (fullName.length < 2) return fail("nameRequired");
  if (!email.safeParse(emailValue).success) return fail("invalidEmail");
  if (!password.safeParse(pass).success) return fail("weakPassword");
  if (pass !== confirm) return fail("passwordsMismatch");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: emailValue,
    password: pass,
    options: {
      data: { full_name: fullName, phone: phone || null },
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
    },
  });

  if (error) return fail(mapAuthError(error.code, error.status));
  // With email confirmation on, Supabase returns a user without identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) return fail("emailTaken");
  if (!data.session) return { success: "checkEmailText", email: emailValue };

  redirect("/dashboard");
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "setupRequired" };
  const emailValue = String(formData.get("email") ?? "").trim();
  if (!email.safeParse(emailValue).success) return { error: "invalidEmail", email: emailValue };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error?.status === 429) return { error: "rateLimited", email: emailValue };

  // Same message whether or not the account exists (no account enumeration).
  return { success: "resetSent", email: emailValue };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const pass = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (!password.safeParse(pass).success) return { error: "weakPassword" };
  if (pass !== confirm) return { error: "passwordsMismatch" };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "linkInvalid" };

  const { error } = await supabase.auth.updateUser({ password: pass });
  if (error) return { error: error.code === "same_password" ? "weakPassword" : mapAuthError(error.code, error.status) };

  return { success: "passwordUpdated" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
