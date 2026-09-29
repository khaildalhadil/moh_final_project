// Shared between the proxy (server) and the browser store.

/** Cookie that tells the proxy a user is signed in (the actual data lives in the browser). */
export const SESSION_COOKIE = "hasad_session";

/** Built-in account for demonstrations. */
export const DEMO_ACCOUNT = {
  id: "demo-user",
  email: "demo@hasad.app",
  password: "hasad2026",
} as const;
