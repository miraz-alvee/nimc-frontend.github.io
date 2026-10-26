export const AUTH_STATE_CHANGE_EVENT = "auth-state-changed";

export const tokenStorage = {
  getAuthToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },
  setTokens: (accessToken?: string, refreshToken?: string) => {
    if (typeof window === "undefined") return;
    if (accessToken) localStorage.setItem("authToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
  },
  clearTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
  },
};
