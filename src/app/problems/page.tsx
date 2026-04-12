import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Problem } from "@/lib/types";
import Link from "next/link";
import DifficultyBadge from "@/components/DifficultyBadge";

export const revalidate = 60; // revalidate every 60 seconds

export default async function ProblemsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: problems, error } = await supabase
    .from("problems")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching problems:", error);
  }

  const problemList: Problem[] = problems ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Problems</h1>
        <p className="mt-2 text-zinc-400">
          Prove theorems and verify code in Lean 4. Problems are sorted by
          difficulty.
        </p>
      </div>

      {/* Problems Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Difficulty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Tags
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {problemList.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-zinc-500"
                >
                  No problems yet. Check back soon or load problems using the
                  seed script.
                </td>
              </tr>
            ) : (
              problemList.map((problem, index) => (
                <tr
                  key={problem.id}
                  className="transition hover:bg-zinc-900/50"
                >
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="text-sm font-medium text-white transition hover:text-[#6aadfe]"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
