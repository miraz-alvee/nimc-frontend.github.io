import axiosApiInstance from "../apiAxiosInstance";
import type { Faq, Feedback, FeedbackRequest, HelpArticle } from "../types/help.types";

export const helpService = {
  /**
   * GET /api/help/faq/
   * Fetch list of frequently asked questions
   */
  async getFaqs(): Promise<Faq[]> {
    const response = await axiosApiInstance.get<Faq[]>("/api/help/faq/");
    return response.data;
  },

  /**
   * GET /api/help/support/
   * Fetch authenticated user's submitted support tickets/feedback
   */
  async getSupportTickets(): Promise<Feedback[]> {
    const response = await axiosApiInstance.get<Feedback[]>("/api/help/support/");
    return response.data;
  },

  /**
   * POST /api/help/feedback/
   * Submit feedback or support inquiry with optional attachment
   */
  async createFeedback(payload: FeedbackRequest): Promise<Feedback> {
    const formData = new FormData();
    formData.append("category", payload.category);
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    if (payload.attachment) {
      formData.append("attachment", payload.attachment);
    }

    const response = await axiosApiInstance.post<Feedback>(
      "/api/help/feedback/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * GET /api/help/
   * Fetch knowledge base help articles
   */
  async getArticles(): Promise<HelpArticle[]> {
    const response = await axiosApiInstance.get<HelpArticle[]>("/api/help/");
    return response.data;
  },
};
