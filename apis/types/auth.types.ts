export interface Language {
  code: string;
  name: string;
  native_name?: string;
  is_default?: boolean;
}

export interface UserPreferences {
  default_investment?: string;
  auto_close_seconds?: number;
  chart_layout?: string;
  selected_symbol?: string;
  language?: string;
  notifications_enabled?: boolean;
}

export interface UserMeResponse {
  user?: {
    id: number | string;
    email: string;
    display_name?: string;
    phone?: string;
    country?: string;
    terms_accepted_at?: string;
    date_joined?: string;
  };
  settings?: UserPreferences;
  available_balance?: string;
  currency?: string;
  broker?: string;
  broker_connected?: boolean;
  id?: string | number;
  email?: string;
  username?: string;
}

export interface User {
  id: string | number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  country?: string;
  is_active?: boolean;
  is_verified?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id?: string | number;
  user?: User;
  phone_number?: string;
  country?: string;
  city?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  date_of_birth?: string;
  [key: string]: unknown;
}

export interface UserSettings {
  language?: string;
  currency?: string;
  theme?: "dark" | "light" | "system";
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  two_factor_auth_enabled?: boolean;
  [key: string]: unknown;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user?: User;
  tokens?: AuthTokens;
  access?: string;
  refresh?: string;
  token?: string; // fallback if standard token
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
  password_confirm?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface LogoutRequest {
  refresh: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_new_password?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  uid?: string;
  new_password: string;
  confirm_new_password?: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country?: string;
  city?: string;
  address?: string;
  bio?: string;
  avatar?: File | string;
  [key: string]: unknown;
}

export interface UpdateSettingsRequest {
  language?: string;
  currency?: string;
  theme?: "dark" | "light" | "system";
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  two_factor_auth_enabled?: boolean;
  [key: string]: unknown;
}

export type SocialAuthProvider = "google" | "apple" | "facebook" | "github" | string;

export interface SocialAuthRequest {
  provider: SocialAuthProvider;
  access_token?: string;
  code?: string;
  id_token?: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}
