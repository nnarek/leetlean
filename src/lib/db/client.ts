import type { IDatabase } from "./types";
import { dbProvider } from "../config";
import { SupabaseDatabase } from "./supabase";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a database instance for use in **client components** (browser).
 * Safe to call in "use client" files — no server-only imports.
 */
export function getClientDatabase(): IDatabase {
  if (dbProvider === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { FirebaseDatabase } = require("./firebase");
    return new FirebaseDatabase();
  }

  return new SupabaseDatabase(createClient());
}
