"use client";

import { createContext, useContext } from "react";

export type AppContextValue = {
  /** yyyy-mm-dd computed on the server so server and client render identical relative dates. */
  today: string;
  currency: string;
  user: { name: string; email: string; memberSince: string };
  alerts: { irrigationToday: number; overdueTasks: number; lowStock: number; harvestSoon: number };
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ value, children }: { value: AppContextValue; children: React.ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
