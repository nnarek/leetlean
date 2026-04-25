import type { IDatabase } from "./types";
import { dbProvider } from "../config";
import { SupabaseDatabase } from "./supabase";
import { ApiDatabase } from "./api";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a database instance for use in **client components** (browser).
 *
 * Uses the browser Supabase client directly in all modes. The public anon
 * key is safe for client-side use; RLS policies protect the data.
 */
export function getClientDatabase(): IDatabase {
  if (dbProvider === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { FirebaseDatabase } = require("./firebase");
    return new FirebaseDatabase();
  }

  return new SupabaseDatabase(createClient());
}

/** Returns an ApiDatabase that proxies through /api/* routes. */
export function getApiDatabase(): IDatabase {
  return new ApiDatabase();
}
