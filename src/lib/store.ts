/**
 * Local data store — replaces a database.
 *
 * Everything is kept in the browser's localStorage:
 *   hasad:users          → accounts (the demo account is created automatically)
 *   hasad:session        → id of the signed-in user
 *   hasad:data:<userId>  → that user's farms, fields, crops, irrigation, activities, inventory
 *
 * The demo account starts with the seed data from `src/data/seed.ts`.
 * Components read the store with the hooks at the bottom (useSyncExternalStore).
 */

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { buildSeed, emptyTables, type Tables } from "@/data/seed";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/session";
import type { Dictionary } from "@/lib/i18n";
import type { Activity, Crop, FarmOption, FieldOption, InventoryItem, IrrigationSchedule } from "@/lib/types";
import { uuid } from "@/lib/uid";
import { num, todayISO } from "@/lib/utils";
import { profileSchema, schemas, statusValues, type StatusTable, type TableName } from "@/lib/validations";
import { geocode } from "@/lib/weather";

export type { Tables };

export type User = {
  id: string;
  email: string;
  password: string;
  full_name: string;
  phone: string | null;
  currency: string;
  created_at: string;
};

export type AppState = { user: User | null; db: Tables };

export type ActionResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "validation" | "generic"; fieldErrors?: Record<string, string> };

export type AuthError = keyof Dictionary["auth"];

// ---------------------------------------------------------------------------
// persistence
// ---------------------------------------------------------------------------
const USERS_KEY = "hasad:users";
const SESSION_KEY = "hasad:session";
const dataKey = (userId: string) => `hasad:data:${userId}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked (private mode) — the app keeps working in memory
  }
}

function currentLocale(): "ar" | "en" {
  return document.documentElement.lang === "en" ? "en" : "ar";
}

function setSessionCookie(signedIn: boolean) {
  document.cookie = signedIn
    ? `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    : `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Accounts, making sure the demo account (with its seed data) exists. */
function loadUsers(): User[] {
  const users = read<User[]>(USERS_KEY, []);
  if (!users.some((u) => u.id === DEMO_ACCOUNT.id)) {
    const demo: User = {
      id: DEMO_ACCOUNT.id,
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
      full_name: currentLocale() === "ar" ? "محمد" : "Mohamad",
      phone: null,
      currency: "SAR",
      created_at: new Date().toISOString(),
    };
    users.push(demo);
    write(USERS_KEY, users);
    write(dataKey(demo.id), buildSeed(demo.id, currentLocale()));
  }
  return users;
}

function loadState(): AppState {
  const users = loadUsers();
  const sessionId = read<string | null>(SESSION_KEY, null);
  const user = users.find((u) => u.id === sessionId) ?? null;
  setSessionCookie(Boolean(user));
  const db = user ? { ...emptyTables(), ...read<Partial<Tables>>(dataKey(user.id), {}) } : emptyTables();
  return { user, db };
}

// ---------------------------------------------------------------------------
// external store plumbing
// ---------------------------------------------------------------------------
let state: AppState | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: AppState) {
  state = next;
  if (next.user) write(dataKey(next.user.id), next.db);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep several open tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("hasad:")) {
      state = loadState();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppState {
  if (!state) state = loadState();
  return state;
}

/** The server has no access to browser storage: render a loading state there. */
function getServerSnapshot(): AppState | null {
  return null;
}

// ---------------------------------------------------------------------------
// hooks
// ---------------------------------------------------------------------------

/** Store state, or null while rendering on the server / during hydration. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** For components rendered inside the dashboard (which only renders once a user is signed in). */
export function useData(): { user: User; db: Tables } {
  const s = useAppState();
  if (!s?.user) throw new Error("useData() must be used inside the signed-in dashboard");
  return { user: s.user, db: s.db };
}

// ---------------------------------------------------------------------------
// authentication (local accounts)
// ---------------------------------------------------------------------------
const emailSchema = z.email();

function signInAs(user: User) {
  write(SESSION_KEY, user.id);
  setSessionCookie(true);
  commit({ user, db: { ...emptyTables(), ...read<Partial<Tables>>(dataKey(user.id), {}) } });
}

export function signIn(email: string, password: string): AuthError | null {
  const user = loadUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) return "invalidCredentials";
  signInAs(user);
  return null;
}

export function signUp(input: { full_name: string; email: string; phone: string; password: string; confirm: string }): AuthError | null {
  const fullName = input.full_name.trim();
  const email = input.email.trim();
  if (fullName.length < 2) return "nameRequired";
  if (!emailSchema.safeParse(email).success) return "invalidEmail";
  if (input.password.length < 8) return "weakPassword";
  if (input.password !== input.confirm) return "passwordsMismatch";

  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return "emailTaken";

  const user: User = {
    id: uuid(),
    email,
    password: input.password,
    full_name: fullName,
    phone: input.phone.trim() || null,
    currency: "SAR",
    created_at: new Date().toISOString(),
  };
  write(USERS_KEY, [...users, user]);
  write(dataKey(user.id), emptyTables());
  signInAs(user);
  return null;
}

export function signOut() {
  write(SESSION_KEY, null);
  setSessionCookie(false);
  commit({ user: null, db: emptyTables() });
}

function updateUser(patch: Partial<User>) {
  const s = getSnapshot();
  if (!s.user) return false;
  const updated = { ...s.user, ...patch };
  write(USERS_KEY, loadUsers().map((u) => (u.id === updated.id ? updated : u)));
  commit({ ...s, user: updated });
  return true;
}

export function updatePassword(password: string, confirm: string): AuthError | null {
  if (password.length < 8) return "weakPassword";
  if (password !== confirm) return "passwordsMismatch";
  return updateUser({ password }) ? null : "invalidCredentials";
}

export async function updateProfile(values: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "validation", fieldErrors: fieldErrors(parsed.error) };
  return updateUser(parsed.data) ? { ok: true } : { ok: false, error: "unauthorized" };
}

// ---------------------------------------------------------------------------
// records
// ---------------------------------------------------------------------------
function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

/** Same integrity rules a database would enforce with foreign keys. */
function referencesExist(db: Tables, table: TableName, data: Record<string, unknown>) {
  const farmExists = (id: unknown) => db.farms.some((f) => f.id === id);
  const field = (id: unknown) => db.fields.find((f) => f.id === id);
  switch (table) {
    case "fields":
      return farmExists(data.farm_id);
    case "crops":
    case "irrigation_schedules":
      return Boolean(field(data.field_id));
    case "activities":
      return farmExists(data.farm_id) && (data.field_id == null || field(data.field_id)?.farm_id === data.farm_id);
    default:
      return true;
  }
}

/** Create (no id) or update (with id) a record. Input is validated with the same zod schemas as before. */
export async function saveRecord(table: TableName, values: unknown, id?: string): Promise<ActionResult> {
  const parsed = schemas[table].safeParse(values);
  if (!parsed.success) return { ok: false, error: "validation", fieldErrors: fieldErrors(parsed.error) };

  const s = getSnapshot();
  if (!s.user) return { ok: false, error: "unauthorized" };
  const data: Record<string, unknown> = { ...parsed.data };

  // Farms: fill missing coordinates from the location name (best effort, needs internet).
  if (table === "farms" && data.latitude == null && data.longitude == null && typeof data.location === "string") {
    const point = await geocode(data.location, currentLocale());
    if (point) Object.assign(data, point);
  }

  const latest = getSnapshot();
  if (!referencesExist(latest.db, table, data)) return { ok: false, error: "generic" };

  const now = new Date().toISOString();
  const rows = latest.db[table] as unknown as Record<string, unknown>[];
  let nextRows: Record<string, unknown>[];
  if (id) {
    if (!rows.some((r) => r.id === id)) return { ok: false, error: "generic" };
    nextRows = rows.map((r) => (r.id === id ? { ...r, ...data, updated_at: now } : r));
  } else {
    nextRows = [...rows, { id: uuid(), user_id: latest.user!.id, created_at: now, updated_at: now, ...data }];
  }

  commit({ ...latest, db: { ...latest.db, [table]: nextRows } });
  return { ok: true };
}

/** Delete a record together with everything that depends on it. */
export async function deleteRecord(table: TableName, id: string): Promise<ActionResult> {
  const s = getSnapshot();
  if (!s.user) return { ok: false, error: "unauthorized" };
  const db = { ...s.db };

  if (table === "farms") {
    const fieldIds = new Set(db.fields.filter((f) => f.farm_id === id).map((f) => f.id));
    db.farms = db.farms.filter((f) => f.id !== id);
    db.fields = db.fields.filter((f) => f.farm_id !== id);
    db.crops = db.crops.filter((c) => !fieldIds.has(c.field_id));
    db.irrigation_schedules = db.irrigation_schedules.filter((i) => !fieldIds.has(i.field_id));
    db.activities = db.activities.filter((a) => a.farm_id !== id);
  } else if (table === "fields") {
    db.fields = db.fields.filter((f) => f.id !== id);
    db.crops = db.crops.filter((c) => c.field_id !== id);
    db.irrigation_schedules = db.irrigation_schedules.filter((i) => i.field_id !== id);
    db.activities = db.activities.map((a) => (a.field_id === id ? { ...a, field_id: null } : a));
  } else {
    (db as Record<string, { id: string }[]>)[table] = (db[table] as { id: string }[]).filter((r) => r.id !== id);
  }

  commit({ ...s, db });
  return { ok: true };
}

/** Quick status change (e.g. "mark irrigation as completed"). */
export async function setStatus(table: StatusTable, id: string, status: string): Promise<ActionResult> {
  const allowed = statusValues[table] as readonly string[];
  if (!allowed.includes(status)) return { ok: false, error: "validation" };
  const s = getSnapshot();
  if (!s.user) return { ok: false, error: "unauthorized" };

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (table === "crops" && status === "harvested") patch.actual_harvest_date = todayISO();

  const rows = (s.db[table] as unknown as Record<string, unknown>[]).map((r) => (r.id === id ? { ...r, ...patch } : r));
  commit({ ...s, db: { ...s.db, [table]: rows } });
  return { ok: true };
}

/** Add the seed farm to the current user's data. */
export async function loadDemoData(): Promise<ActionResult> {
  const s = getSnapshot();
  if (!s.user) return { ok: false, error: "unauthorized" };
  const seed = buildSeed(s.user.id, currentLocale());
  const db = Object.fromEntries(
    (Object.keys(seed) as (keyof Tables)[]).map((k) => [k, [...s.db[k], ...seed[k]]]),
  ) as Tables;
  commit({ ...s, db });
  return { ok: true };
}

/** Replace all data with a fresh copy of the seed, or clear it completely. */
export function resetData(mode: "seed" | "empty") {
  const s = getSnapshot();
  if (!s.user) return;
  commit({ ...s, db: mode === "seed" ? buildSeed(s.user.id, currentLocale()) : emptyTables() });
}

// ---------------------------------------------------------------------------
// selectors (sorted the way the pages display them)
// ---------------------------------------------------------------------------
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

export const select = {
  farms: (db: Tables) => [...db.farms].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  fields: (db: Tables) => [...db.fields].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  farmOptions: (db: Tables): FarmOption[] => db.farms.map(({ id, name }) => ({ id, name })).sort(byName),
  fieldOptions: (db: Tables): FieldOption[] => db.fields.map(({ id, name, farm_id }) => ({ id, name, farm_id })).sort(byName),
  crops: (db: Tables): Crop[] =>
    [...db.crops].sort((a, b) => (b.planting_date ?? "").localeCompare(a.planting_date ?? "")),
  irrigation: (db: Tables): IrrigationSchedule[] =>
    [...db.irrigation_schedules].sort(
      (a, b) => b.scheduled_date.localeCompare(a.scheduled_date) || (a.start_time ?? "99").localeCompare(b.start_time ?? "99"),
    ),
  activities: (db: Tables): Activity[] =>
    [...db.activities].map((a) => ({ ...a, cost: num(a.cost) })).sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date)),
  inventory: (db: Tables): InventoryItem[] => [...db.inventory_items].sort(byName),
};

export function isLowStock(item: Pick<InventoryItem, "quantity" | "min_quantity">) {
  return item.min_quantity != null && num(item.quantity) <= num(item.min_quantity);
}
