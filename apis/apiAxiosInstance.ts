import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./services/tokenStorage";

const axiosApiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach active Bearer access token
axiosApiInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const authToken = tokenStorage.getAuthToken();

    if (authToken) {
      if (config.headers?.set) {
        config.headers.set("Authorization", `Bearer ${authToken}`);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }
  }
  return config;
});

// State for concurrent silent token refresh & request queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Catch 401 and refresh access token using 7-day refresh token
axiosApiInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // If not a 401 Unauthorized error or no config, reject immediately
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/api/auth/token/refresh/") ||
      requestUrl.includes("/api/auth/login/") ||
      requestUrl.includes("/api/auth/register/");

    // If the error occurred on an auth endpoint or already retried once, do not retry
    if (isAuthEndpoint || originalRequest._retry) {
      if (typeof window !== "undefined" && isAuthEndpoint) {
        tokenStorage.clearTokens();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      return Promise.reject(error);
    }

    // Check if we have a refresh token (valid up to 7 days)
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      if (typeof window !== "undefined") {
        tokenStorage.clearTokens();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      return Promise.reject(error);
    }

    // If another request is already refreshing the token, enqueue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          if (originalRequest.headers?.set) {
            originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosApiInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      // Refresh token request made via raw axios to prevent circular interception
      const { data } = await axios.post<{ access: string; refresh?: string }>(
        `${baseURL}/api/auth/token/refresh/`,
        { refresh: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccessToken = data.access;
      const newRefreshToken = data.refresh || refreshToken;

      // Save new access token and rotated refresh token
      tokenStorage.setTokens(newAccessToken, newRefreshToken);

      // Resolve all queued requests waiting for the new token
      processQueue(null, newAccessToken);

      // Retry original request with the fresh access token
      if (originalRequest.headers?.set) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      } else {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return axiosApiInstance(originalRequest);
    } catch (refreshError) {
      // 7-day refresh token expired or revoked - log out user
      processQueue(refreshError, null);
      tokenStorage.clearTokens();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosApiInstance;