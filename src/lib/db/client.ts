import type { IDatabase } from "./types";
import { isServerless, dbProvider } from "../config";
import { SupabaseDatabase } from "./supabase";
import { ApiDatabase } from "./api";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a database instance for use in **client components** (browser).
 *
 * - Serverless mode → talks to Supabase/Firebase directly from the browser.
 * - Server mode    → calls local Next.js API routes so the browser never
 *                    contacts Supabase directly.
 */
export function getClientDatabase(): IDatabase {
  // Non-serverless: proxy everything through /api/* routes on the Next.js server
  if (!isServerless) {
    return new ApiDatabase();
  }

  if (dbProvider === "firebase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { FirebaseDatabase } = require("./firebase");
    return new FirebaseDatabase();
  }

  return new SupabaseDatabase(createClient());
}
