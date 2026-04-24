// Re-export types for convenience
export type { IDatabase, ProblemsFilter, ProblemsResult } from "./types";

// Import from these files directly to avoid pulling server code into client bundles:
//   "@/lib/db/client"  → getClientDatabase()  (for client components)
//   "@/lib/db/server"  → getServerDatabase()  (for server components / build-time)
export { getClientDatabase } from "./client";
export { getServerDatabase } from "./server";
