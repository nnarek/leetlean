import type { Problem, Difficulty } from "../types";

export interface ProblemsFilter {
  q?: string;
  difficulty?: Difficulty | "";
  tag?: string;
  page?: number;
  limit?: number;
}

export interface ProblemsResult {
  problems: Problem[];
  total: number;
}

export interface IDatabase {
  /** List problems with optional filtering and pagination. */
  getProblems(filter: ProblemsFilter): Promise<ProblemsResult>;

  /** Get a single problem by its URL slug. Returns null if not found. */
  getProblemBySlug(slug: string): Promise<Problem | null>;

  /** Get all unique tags across all problems, sorted alphabetically. */
  getAllTags(): Promise<string[]>;
}
