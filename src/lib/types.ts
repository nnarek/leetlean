export type Difficulty = "easy" | "medium" | "hard";
export type SubmissionStatus = "pending" | "accepted" | "wrong";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  starter_code: string;
  main_theorem_name: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  code: string;
  status: SubmissionStatus;
  name: string | null;
  submitted_at: string;
}

export interface Solution {
  id: string;
  user_id: string;
  problem_id: string;
  submission_id: string;
  title: string;
  content: string;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SolutionWithMeta extends Solution {
  like_count: number;
  user_has_liked: boolean;
  profiles: { full_name: string | null; avatar_url: string | null };
  submissions: { code: string; status: SubmissionStatus };
}

// For the problems list page (joined with user submission status)
export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  sort_order: number;
  user_status?: SubmissionStatus | null;
}
