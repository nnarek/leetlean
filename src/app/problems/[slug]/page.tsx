import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Problem } from "@/lib/types";
import { notFound } from "next/navigation";
import DifficultyBadge from "@/components/DifficultyBadge";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Lean4Editor from "@/components/Lean4Editor";
import ResizableProblemLayout from "@/components/ResizableProblemLayout";

export const revalidate = 60;

interface ProblemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: problem, error } = await supabase
    .from("problems")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !problem) {
    notFound();
  }

  const p = problem as Problem;

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      {/* Resizable two-panel layout: description ↔ editor */}
      <ResizableProblemLayout
        left={
          <div className="h-full w-full rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{p.title}</h1>
                <DifficultyBadge difficulty={p.difficulty} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <MarkdownRenderer content={p.description} />
          </div>
        }
        right={
          <div className="h-full w-full">
            <Lean4Editor code={p.starter_code} />
          </div>
        }
      />
    </div>
  );
}
