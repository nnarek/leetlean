"use client";

import { useState } from "react";
import type { Problem } from "@/lib/types";
import DifficultyBadge from "@/components/DifficultyBadge";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import SubmissionsList from "@/components/SubmissionsList";
import SolutionsTab from "@/components/SolutionsTab";

type Tab = "description" | "solutions" | "submissions";

interface ProblemTabsProps {
  problem: Problem;
  initialTab?: string;
}

export default function ProblemTabs({ problem, initialTab }: ProblemTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    (initialTab === "solutions" || initialTab === "submissions") ? initialTab : "description"
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "solutions", label: "Solutions" },
    { id: "submissions", label: "Submissions" },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "description") {
      window.history.replaceState(null, "", `/problems/${problem.slug}`);
    } else {
      window.history.replaceState(null, "", `/problems/${problem.slug}/${tab}`);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-border bg-surface/30">
      {/* Header: title + difficulty + tags */}
      <div className="shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {problem.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-badge px-2 py-0.5 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex border-b border-border px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "description" && (
          <MarkdownRenderer content={problem.description} />
        )}
        {activeTab === "solutions" && (
          <SolutionsTab
            problemId={problem.id}
            problemSlug={problem.slug}
          />
        )}
        {activeTab === "submissions" && (
          <SubmissionsList problemId={problem.id} />
        )}
      </div>
    </div>
  );
}
