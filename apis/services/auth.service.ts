import axiosApiInstance from "../apiAxiosInstance";
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

import axios from "axios";
import { tokenStorage, AUTH_STATE_CHANGE_EVENT } from "./tokenStorage";
export { tokenStorage, AUTH_STATE_CHANGE_EVENT };

export const authService = {
  /**
   * GET /api/auth/languages/
   * Fetch available application languages
   */
  async getLanguages(): Promise<Language[]> {
    const response = await axiosApiInstance.get<Language[]>("/api/auth/languages/");
    return response.data;
  },

  /**
   * POST /api/auth/login/
   * User login with email and password
   */
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await axiosApiInstance.post<AuthResponse>("/api/auth/login/", payload);
    const data = response.data;

    // Automatically store tokens if present
    const dataObj = data as Record<string, unknown>;
    const accessToken = data.tokens?.access || data.access || data.token || dataObj?.access_token;
    const refreshToken = data.tokens?.refresh || data.refresh || dataObj?.refresh_token;

    if (accessToken) {
      tokenStorage.setTokens(String(accessToken), refreshToken ? String(refreshToken) : undefined);
    }

    return data;
  },

  /**
   * POST /api/auth/register/
   * Register a new user account
   */
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosApiInstance.post<AuthResponse>("/api/auth/register/", payload);
    const data = response.data;

    const dataObj = data as Record<string, unknown>;
    const accessToken = data.tokens?.access || data.access || data.token || dataObj?.access_token;
    const refreshToken = data.tokens?.refresh || data.refresh || dataObj?.refresh_token;

    if (accessToken) {
      tokenStorage.setTokens(String(accessToken), refreshToken ? String(refreshToken) : undefined);
    }

    return data;
  },

  /**
   * POST /api/auth/logout/
   * Invalidate user session and blacklist refresh token in the backend
   */
  async logout(payload?: Partial<LogoutRequest>): Promise<{ detail?: string; message?: string }> {
    const refreshToken = payload?.refresh || tokenStorage.getRefreshToken();
    tokenStorage.clearTokens();

    try {
      if (refreshToken) {
        const response = await axiosApiInstance.post<{ detail?: string; message?: string }>(
          "/api/auth/logout/",
          { refresh: refreshToken }
        );
        return response.data || { detail: "Logged out successfully" };
      }
      return { detail: "Logged out locally" };
    } catch {
      // Even if network or token invalidation on backend fails, client is logged out
      return { detail: "Logged out locally" };
    }
  },

  /**
   * GET /api/auth/me/
   * Retrieve the currently authenticated user
   */
  async getMe(): Promise<UserMeResponse> {
    const response = await axiosApiInstance.get<UserMeResponse>("/api/auth/me/");
    return response.data;
  },

  /**
   * GET /api/auth/profile/
   * Fetch authenticated user's profile details
   */
  async getProfile(): Promise<UserProfile> {
    const response = await axiosApiInstance.get<UserProfile>("/api/auth/profile/");
    return response.data;
  },

  /**
   * PATCH /api/auth/profile/
   * Partially update user's profile details
   */
  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    const response = await axiosApiInstance.patch<UserProfile>("/api/auth/profile/", payload);
    return response.data;
  },

  /**
   * GET /api/auth/settings/
   * Retrieve user account settings
   */
  async getSettings(): Promise<UserSettings> {
    const response = await axiosApiInstance.get<UserSettings>("/api/auth/settings/");
    return response.data;
  },

  /**
   * PATCH /api/auth/settings/
   * Partially update user account settings
   */
  async updateSettings(payload: UpdateSettingsRequest): Promise<UserSettings> {
    const response = await axiosApiInstance.patch<UserSettings>("/api/auth/settings/", payload);
    return response.data;
  },

  /**
   * POST /api/auth/password/change/
   * Change current password
   */
  async changePassword(payload: ChangePasswordRequest): Promise<{ detail?: string; message?: string }> {
    const response = await axiosApiInstance.post("/api/auth/password/change/", payload);
    return response.data;
  },

  /**
   * POST /api/auth/password/forgot/
   * Request password reset email
   */
  async forgotPassword(payload: ForgotPasswordRequest): Promise<{ detail?: string; message?: string }> {
    const response = await axiosApiInstance.post("/api/auth/password/forgot/", payload);
    return response.data;
  },

  /**
   * POST /api/auth/password/reset/
   * Confirm password reset with token
   */
  async resetPassword(payload: ResetPasswordRequest): Promise<{ detail?: string; message?: string }> {
    const response = await axiosApiInstance.post("/api/auth/password/reset/", payload);
    return response.data;
  },

  /**
   * POST /api/auth/social/{provider}/
   * Social OAuth login/registration
   */
  async socialLogin({ provider, ...payload }: SocialAuthRequest): Promise<AuthResponse> {
    const response = await axiosApiInstance.post<AuthResponse>(
      `/api/auth/social/${provider}/`,
      payload
    );
    const data = response.data;

    const accessToken = data.tokens?.access || data.access || data.token;
    const refreshToken = data.tokens?.refresh || data.refresh;
    if (accessToken) {
      tokenStorage.setTokens(accessToken, refreshToken);
    }

    return data;
  },

  /**
   * POST /api/auth/token/refresh/
   * Refresh JWT access token
   */
  async refreshToken(payload?: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const refresh = payload?.refresh || tokenStorage.getRefreshToken();
    if (!refresh) {
      throw new Error("No refresh token available");
    }

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const response = await axios.post<RefreshTokenResponse>(
      `${baseURL}/api/auth/token/refresh/`,
      { refresh },
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data.access) {
      tokenStorage.setTokens(response.data.access, response.data.refresh || refresh);
    }

    return response.data;
  },
};
