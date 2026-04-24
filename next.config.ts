import type { NextConfig } from "next";

const isServerless = process.env.NEXT_PUBLIC_LEETLEAN_SERVERLESS === "true";
const isFirebase = process.env.NEXT_PUBLIC_DB_PROVIDER === "firebase";

const nextConfig: NextConfig = {
  // In serverless mode, produce a fully static site in the `out/` directory.
  ...(isServerless && {
    output: "export",
    // GitHub Pages project sites are served from /<repo-name>/.
    // Set NEXT_PUBLIC_BASE_PATH=/leetlean (or your repo name) when deploying.
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  }),

  // Turbopack (Next.js 16 default bundler)
  turbopack: {
    // When firebase provider is NOT selected, alias firebase packages to an
    // empty stub so the build doesn't fail if firebase isn't installed.
    resolveAlias: isFirebase
      ? {}
      : {
          "firebase/app": "@/lib/db/firebase-stub",
          "firebase/firestore": "@/lib/db/firebase-stub",
          "firebase/auth": "@/lib/db/firebase-stub",
        },
  },

  // Webpack fallback (used with --webpack flag)
  webpack: (config) => {
    if (!isFirebase) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "firebase/app": false,
        "firebase/firestore": false,
        "firebase/auth": false,
      };
    }
    return config;
  },
};

export default nextConfig;
