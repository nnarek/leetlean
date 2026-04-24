import type { IDatabase } from "./types";
import { isServerless, dbProvider } from "../config";
import { SupabaseDatabase } from "./supabase";

/**
 * Returns a database instance for use in **server components** or at
 * build time (static export).  Do NOT import this file from client components.
 */
export async function getServerDatabase(): Promise<IDatabase> {
  if (dbProvider === "firebase") {
    const { FirebaseDatabase } = await import("./firebase");
    return new FirebaseDatabase();
  }

  if (isServerless) {
    // Static export: no cookies/headers available at build time.
    // Use a plain Supabase client (public data is read without auth).
    const { createClient } = await import("@supabase/supabase-js");
    return new SupabaseDatabase(
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    );
  }

  // SSR mode: cookie-based client for per-request auth context
  const { createServerSupabaseClient } = await import(
    "@/lib/supabase/server"
  );
  return new SupabaseDatabase(await createServerSupabaseClient());
}
