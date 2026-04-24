export const isServerless =
  process.env.NEXT_PUBLIC_LEETLEAN_SERVERLESS === "true";

export const dbProvider =
  (process.env.NEXT_PUBLIC_DB_PROVIDER as "supabase" | "firebase") ||
  "supabase";
