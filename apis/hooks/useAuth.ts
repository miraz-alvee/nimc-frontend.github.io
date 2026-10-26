"use client";

import { useSyncExternalStore } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { authService, tokenStorage, AUTH_STATE_CHANGE_EVENT } from "../services/auth.service";
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  Language,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SocialAuthRequest,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  UserMeResponse,
  UserProfile,
  UserSettings,
} from "../types/auth.types";

/**
 * Query Keys factory for predictable caching and cache invalidation
 */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  settings: () => [...authKeys.all, "settings"] as const,
  languages: () => [...authKeys.all, "languages"] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to retrieve available application languages
 */
export function useLanguagesQuery(
  options?: Omit<UseQueryOptions<Language[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: authKeys.languages(),
    queryFn: () => authService.getLanguages(),
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

/**
 * Hook to retrieve the currently authenticated user (/api/auth/me/)
 * Returns null when not authenticated
 */
export function useCurrentUserQuery(
  options?: Omit<UseQueryOptions<UserMeResponse | null, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async (): Promise<UserMeResponse | null> => {
      const token = tokenStorage.getAuthToken();
      if (!token) return null;
      try {
        return await authService.getMe();
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 401 || error.response?.status === 403) {
          tokenStorage.clearTokens();
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_STATE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_STATE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getAuthSnapshot(): string | null {
  return tokenStorage.getAuthToken();
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Unified auth helper hook to reactively check authentication status
 * Updates immediately when tokens change in localStorage without requiring a page refresh
 */
export function useAuth() {
  const token = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerSnapshot);

  const { data: meData, isLoading, isFetching } = useCurrentUserQuery({
    enabled: Boolean(token),
  });

  const isAuthenticated = Boolean(token);

  return {
    token,
    user: meData?.user || (meData?.email ? meData : undefined),
    settings: meData?.settings,
    availableBalance: meData?.available_balance,
    currency: meData?.currency,
    broker: meData?.broker,
    brokerConnected: meData?.broker_connected,
    rawMe: meData,
    isAuthenticated,
    isLoading: isLoading || isFetching,
  };
}

/**
 * Hook to retrieve user profile (/api/auth/profile/)
 */
export function useProfileQuery(
  options?: Omit<UseQueryOptions<UserProfile, Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && !!tokenStorage.getAuthToken();

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authService.getProfile(),
    enabled: hasToken && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Hook to retrieve user settings (/api/auth/settings/)
 */
export function useSettingsQuery(
  options?: Omit<UseQueryOptions<UserSettings, Error>, "queryKey" | "queryFn">
) {
  const hasToken = typeof window !== "undefined" && !!tokenStorage.getAuthToken();

  return useQuery({
    queryKey: authKeys.settings(),
    queryFn: () => authService.getSettings(),
    enabled: hasToken && (options?.enabled ?? true),
    ...options,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to log in user
 */
export function useLoginMutation(
  options?: UseMutationOptions<AuthResponse, Error, LoginRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: async (...args) => {
      const [data] = args;
      if (data?.user) {
        queryClient.setQueryData(authKeys.me(), data.user);
      }
      await queryClient.refetchQueries({ queryKey: authKeys.me() });
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      queryClient.invalidateQueries({ queryKey: authKeys.settings() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to register new user
 */
export function useRegisterMutation(
  options?: UseMutationOptions<AuthResponse, Error, RegisterRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authService.register(payload),
    onSuccess: async (...args) => {
      const [data] = args;
      if (data?.user) {
        queryClient.setQueryData(authKeys.me(), data.user);
      }
      await queryClient.refetchQueries({ queryKey: authKeys.me() });
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to log out user and clear cache
 */
export function useLogoutMutation(
  options?: UseMutationOptions<
    { detail?: string; message?: string },
    Error,
    Partial<LogoutRequest> | undefined
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authService.logout(payload),
    onSuccess: (...args) => {
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.removeQueries({ queryKey: authKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to partially update profile (/api/auth/profile/)
 */
export function useUpdateProfileMutation(
  options?: UseMutationOptions<UserProfile, Error, UpdateProfileRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authService.updateProfile(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to partially update settings (/api/auth/settings/)
 */
export function useUpdateSettingsMutation(
  options?: UseMutationOptions<UserSettings, Error, UpdateSettingsRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authService.updateSettings(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: authKeys.settings() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to change password (/api/auth/password/change/)
 */
export function useChangePasswordMutation(
  options?: UseMutationOptions<{ detail?: string; message?: string }, Error, ChangePasswordRequest>
) {
  return useMutation({
    mutationFn: (payload) => authService.changePassword(payload),
    ...options,
  });
}

/**
 * Hook to initiate forgot password (/api/auth/password/forgot/)
 */
export function useForgotPasswordMutation(
  options?: UseMutationOptions<{ detail?: string; message?: string }, Error, ForgotPasswordRequest>
) {
  return useMutation({
    mutationFn: (payload) => authService.forgotPassword(payload),
    ...options,
  });
}

/**
 * Hook to complete reset password (/api/auth/password/reset/)
 */
export function useResetPasswordMutation(
  options?: UseMutationOptions<{ detail?: string; message?: string }, Error, ResetPasswordRequest>
) {
  return useMutation({
    mutationFn: (payload) => authService.resetPassword(payload),
    ...options,
  });
}

/**
 * Hook for social authentication (/api/auth/social/{provider}/)
 */
export function useSocialAuthMutation(
  options?: UseMutationOptions<AuthResponse, Error, SocialAuthRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authService.socialLogin(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to manually refresh JWT token (/api/auth/token/refresh/)
 */
export function useRefreshTokenMutation(
  options?: UseMutationOptions<RefreshTokenResponse, Error, RefreshTokenRequest | undefined>
) {
  return useMutation({
    mutationFn: (payload) => authService.refreshToken(payload),
    ...options,
  });
}
