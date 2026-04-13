/**
 * Centralized app configuration.
 *
 * In local bundle (Capacitor) mode, fetch calls need absolute URLs because
 * there is no server host. NEXT_PUBLIC_API_BASE_URL should point to the
 * deployed Vercel backend; it falls back to the production URL so native
 * builds work without any extra env setup.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://runrun-plum.vercel.app";
