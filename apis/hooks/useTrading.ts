"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { tradingService } from "../services/trading.service";
import { tokenStorage } from "../services/auth.service";
import { financeKeys } from "./useFinance";
import { authKeys } from "./useAuth";
import type {
  TradingAsset,
  TradingTrendsResponse,
  PaginatedDealList,
  Deal,
  AssetChartResponse,
  TradeOrderRequest,
  DealCreated,
} from "../types/trading.types";

export const tradingKeys = {
  all: ["trading"] as const,
  assets: () => [...tradingKeys.all, "assets"] as const,
  asset: (id: number) => [...tradingKeys.all, "assets", id] as const,
  chart: (id: number) => [...tradingKeys.all, "assets", id, "chart"] as const,
  trends: () => [...tradingKeys.all, "trends"] as const,
  deals: (page = 1) => [...tradingKeys.all, "deals", page] as const,
  deal: (id: number) => [...tradingKeys.all, "deals", "detail", id] as const,
};

/**
 * Hook to retrieve available trading assets (/api/trading/assets/)
 * Refetches periodically to keep prices & payouts fresh
 */
export function useAssetsQuery(
  options?: Omit<UseQueryOptions<TradingAsset[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tradingKeys.assets(),
    queryFn: () => tradingService.getAssets(),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook to retrieve historical chart points (/api/trading/assets/{id}/chart/)
 */
export function useAssetChartQuery(
  assetId: number,
  options?: Omit<UseQueryOptions<AssetChartResponse, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tradingKeys.chart(assetId),
    queryFn: () => tradingService.getAssetChart(assetId),
    enabled: Boolean(assetId) && (options?.enabled ?? true),
    staleTime: 5 * 1000,
    ...options,
  });
}

/**
 * Hook to retrieve market trends (/api/trading/trends/)
 */
export function useTrendsQuery(
  options?: Omit<UseQueryOptions<TradingTrendsResponse, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tradingKeys.trends(),
    queryFn: () => tradingService.getTrends(),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook to retrieve paginated user deals (/api/trading/deals/)
 * Only enabled when authenticated
 */
export function useDealsQuery(
  page = 1,
  options?: Omit<UseQueryOptions<PaginatedDealList, Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && Boolean(tokenStorage.getAuthToken());

  return useQuery({
    queryKey: tradingKeys.deals(page),
    queryFn: () => tradingService.getDeals(page),
    enabled: hasToken && (options?.enabled ?? true),
    staleTime: 5 * 1000,
    ...options,
  });
}

/**
 * Hook to retrieve a single deal by ID (/api/trading/deals/{id}/)
 */
export function useDealQuery(
  id: number,
  options?: Omit<UseQueryOptions<Deal, Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && Boolean(tokenStorage.getAuthToken());

  return useQuery({
    queryKey: tradingKeys.deal(id),
    queryFn: () => tradingService.getDealById(id),
    enabled: hasToken && Boolean(id) && (options?.enabled ?? true),
    staleTime: 5 * 1000,
    ...options,
  });
}

/**
 * Hook to place a BUY / UP order (/api/trading/buy/)
 */
export function useBuyMutation(
  options?: UseMutationOptions<DealCreated, Error, TradeOrderRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => tradingService.buy(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: tradingKeys.deals() });
      queryClient.invalidateQueries({ queryKey: financeKeys.balance() });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to place a SELL / DOWN order (/api/trading/sell/)
 */
export function useSellMutation(
  options?: UseMutationOptions<DealCreated, Error, TradeOrderRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => tradingService.sell(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: tradingKeys.deals() });
      queryClient.invalidateQueries({ queryKey: financeKeys.balance() });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
