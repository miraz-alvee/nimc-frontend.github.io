"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { botService } from "../services/bot.service";
import { tokenStorage } from "../services/auth.service";
import type { AutoBot, PatchedAutoBotRequest, ExecuteBotResponse } from "../types/bot.types";

export const botKeys = {
  all: ["bot"] as const,
  detail: () => [...botKeys.all, "detail"] as const,
};

/**
 * Hook to retrieve auto bot configuration and status (/api/bots/)
 * Only enabled when authenticated
 */
export function useBotQuery(
  options?: Omit<UseQueryOptions<AutoBot, Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && Boolean(tokenStorage.getAuthToken());

  return useQuery({
    queryKey: botKeys.detail(),
    queryFn: () => botService.getBot(),
    enabled: hasToken && (options?.enabled ?? true),
    staleTime: 10 * 1000, // 10 seconds
    ...options,
  });
}

/**
 * Hook to update bot configuration or toggle is_enabled (/api/bots/)
 */
export function useUpdateBotMutation(
  options?: UseMutationOptions<AutoBot, Error, PatchedAutoBotRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => botService.updateBot(payload),
    onSuccess: (...args) => {
      const [updatedBot] = args;
      queryClient.setQueryData(botKeys.detail(), updatedBot);
      queryClient.invalidateQueries({ queryKey: botKeys.detail() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to execute bot cycle manually (/api/bots/execute/)
 */
export function useExecuteBotMutation(
  options?: UseMutationOptions<ExecuteBotResponse, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => botService.executeBot(),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: botKeys.detail() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
