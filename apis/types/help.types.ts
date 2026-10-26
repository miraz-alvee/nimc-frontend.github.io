export type CategoryEnum = "general" | "account" | "finance" | "trading" | "technical";

export type FeedbackStatusEnum = "open" | "closed";

export interface Faq {
  id: number;
  question: string;
  answer: string;
  position?: number;
}

export interface Feedback {
  id: number;
  category: CategoryEnum;
  title: string;
  description: string;
  attachment: string | null;
  status: FeedbackStatusEnum;
  created_at: string;
}

export interface FeedbackRequest {
  category: CategoryEnum;
  title: string;
  description: string;
  attachment?: File | null;
}

export interface HelpArticle {
  slug: string;
  title: string;
  body: string;
  position?: number;
}
