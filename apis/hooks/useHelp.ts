"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { helpService } from "../services/help.service";
import { tokenStorage } from "../services/tokenStorage";
import type { Faq, Feedback, FeedbackRequest, HelpArticle } from "../types/help.types";

export const helpKeys = {
  all: ["help"] as const,
  faqs: () => [...helpKeys.all, "faqs"] as const,
  support: () => [...helpKeys.all, "support"] as const,
  articles: () => [...helpKeys.all, "articles"] as const,
};

/**
 * Hook to retrieve FAQs (/api/help/faq/)
 * Publicly accessible
 */
export function useFaqsQuery(
  options?: Omit<UseQueryOptions<Faq[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: helpKeys.faqs(),
    queryFn: () => helpService.getFaqs(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to retrieve user's support requests / tickets (/api/help/support/)
 * Only enabled when user is signed in
 */
export function useSupportTicketsQuery(
  options?: Omit<UseQueryOptions<Feedback[], Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && Boolean(tokenStorage.getAuthToken());

  return useQuery({
    queryKey: helpKeys.support(),
    queryFn: () => helpService.getSupportTickets(),
    enabled: hasToken && (options?.enabled ?? true),
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Hook to submit feedback or ticket (/api/help/feedback/)
 */
export function useFeedbackMutation(
  options?: UseMutationOptions<Feedback, Error, FeedbackRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => helpService.createFeedback(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: helpKeys.support() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to retrieve knowledge base help articles (/api/help/)
 */
export function useHelpArticlesQuery(
  options?: Omit<UseQueryOptions<HelpArticle[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: helpKeys.articles(),
    queryFn: () => helpService.getArticles(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
