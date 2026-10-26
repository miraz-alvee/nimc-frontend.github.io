"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { financeService } from "../services/finance.service";
import { tokenStorage } from "../services/auth.service";
import type {
  WalletBalance,
  DepositRequest,
  DepositResult,
  PaginatedPaymentList,
  WithdrawalRequest,
} from "../types/finance.types";

export const financeKeys = {
  all: ["finance"] as const,
  balance: () => [...financeKeys.all, "balance"] as const,
  payments: (page = 1) => [...financeKeys.all, "payments", page] as const,
};

/**
 * Hook to retrieve available wallet balance (/api/finance/balance/)
 */
export function useBalanceQuery(
  options?: Omit<UseQueryOptions<WalletBalance, Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && Boolean(tokenStorage.getAuthToken());

  return useQuery({
    queryKey: financeKeys.balance(),
    queryFn: () => financeService.getBalance(),
    enabled: hasToken && (options?.enabled ?? true),
    staleTime: 15 * 1000,
    ...options,
  });
}

/**
 * Hook to retrieve paginated payment transaction history (/api/finance/payments/)
 */
export function usePaymentsQuery(
  page = 1,
  options?: Omit<UseQueryOptions<PaginatedPaymentList, Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && Boolean(tokenStorage.getAuthToken());

  return useQuery({
    queryKey: financeKeys.payments(page),
    queryFn: () => financeService.getPayments(page),
    enabled: hasToken && (options?.enabled ?? true),
    staleTime: 10 * 1000,
    ...options,
  });
}

/**
 * Hook to execute a deposit (/api/finance/deposits/)
 */
export function useDepositMutation(
  options?: UseMutationOptions<DepositResult, Error, DepositRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => financeService.createDeposit(payload),
    onSuccess: (...args) => {
      const [data] = args;
      if (data?.available_balance) {
        queryClient.setQueryData<WalletBalance>(financeKeys.balance(), (old) => ({
          available_balance: data.available_balance,
          currency: data.currency || old?.currency || "USD",
          broker: data.broker || old?.broker || "",
          broker_connected: data.broker_connected ?? old?.broker_connected ?? false,
          broker_balance: data.broker_balance ?? old?.broker_balance ?? null,
        }));
      }
      queryClient.invalidateQueries({ queryKey: financeKeys.balance() });
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to execute a withdrawal (/api/finance/withdrawals/)
 */
export function useWithdrawalMutation(
  options?: UseMutationOptions<DepositResult, Error, WithdrawalRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => financeService.createWithdrawal(payload),
    onSuccess: (...args) => {
      const [data] = args;
      if (data?.available_balance) {
        queryClient.setQueryData<WalletBalance>(financeKeys.balance(), (old) => ({
          available_balance: data.available_balance,
          currency: data.currency || old?.currency || "USD",
          broker: data.broker || old?.broker || "",
          broker_connected: data.broker_connected ?? old?.broker_connected ?? false,
          broker_balance: data.broker_balance ?? old?.broker_balance ?? null,
        }));
      }
      queryClient.invalidateQueries({ queryKey: financeKeys.balance() });
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
