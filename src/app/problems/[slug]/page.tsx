import { getServerDatabase } from "@/lib/db/server";
import { Problem } from "@/lib/types";
import { notFound } from "next/navigation";
import DifficultyBadge from "@/components/DifficultyBadge";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Lean4Editor from "@/components/Lean4Editor";
import ResizableProblemLayout from "@/components/ResizableProblemLayout";

// In static-export mode revalidate is ignored (pages are built once).
// In server mode this enables ISR every 60 s.
export const revalidate = 60;

interface ProblemPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // When LEETLEAN_SERVERLESS=true (static export), this pre-renders every
  // problem page at build time.  In server mode it returns [] so pages are
  // generated on-demand.
  if (process.env.NEXT_PUBLIC_LEETLEAN_SERVERLESS !== "true") return [];
  const db = await getServerDatabase();
  const { problems } = await db.getProblems({ limit: 10000 });
  return problems.map((p) => ({ slug: p.slug }));
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;
  const db = await getServerDatabase();
  const problem = await db.getProblemBySlug(slug);

  if (!problem) {
    notFound();
  }

  const p = problem as Problem;

  return (
    <div className="flex flex-1 min-h-0 w-full p-[1px]">
      {/* Resizable two-panel layout: description ↔ editor */}
      <ResizableProblemLayout
        left={
          <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="mb-4 shrink-0">
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

            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
              <MarkdownRenderer content={p.description} />
            </div>
          </div>
        }
        right={
          <div className="h-full min-h-0 w-full">
            <Lean4Editor code={p.starter_code} />
          </div>
        }
      />
    </div>
  );
}
