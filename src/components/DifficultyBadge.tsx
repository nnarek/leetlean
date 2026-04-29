"use client";

import { Difficulty } from "@/lib/types";

const colors: Record<Difficulty, string> = {
  easy: "bg-[#6aadfe]/10 text-[#6aadfe] border-[#6aadfe]/20 difficulty-easy",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20 difficulty-medium",
  hard: "bg-red-500/10 text-red-400 border-red-500/20 difficulty-hard",
};

export default function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}
