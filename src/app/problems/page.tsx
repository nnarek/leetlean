import { Suspense } from "react";
import ProblemsClient from "./ProblemsClient";

export default function ProblemsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Problems</h1>
          <p className="mt-2 text-zinc-400">Loading...</p>
        </div>
      }
    >
      <ProblemsClient />
    </Suspense>
  );
}
