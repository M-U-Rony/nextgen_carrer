// API client utility for making authenticated requests with JWT tokens

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get token from localStorage
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

// Get refresh token from localStorage
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

// Store tokens in localStorage
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

// Clear tokens from localStorage
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

// Refresh access token using refresh token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    clearTokens();
    return null;
  }
}

// Make authenticated API request
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  // Convert options.headers to a plain object if it's a Headers object
  const existingHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        existingHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        existingHeaders[key] = value;
      });
    } else {
      Object.assign(existingHeaders, options.headers);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...existingHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry request with new token
        headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          return {
            success: false,
            error: errorData.error || "Request failed",
          };
        }

        const data = await retryResponse.json();
        return {
          success: true,
          data,
        };
      } else {
        // Refresh failed, redirect to login
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }
        return {
          success: false,
          error: "Session expired. Please sign in again.",
        };
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Request failed",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("API request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    apiRequest<T>(url, { ...options, method: "GET" }),
  post: <T = any>(url: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T = any>(url: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T = any>(url: string, options?: RequestInit) =>
    apiRequest<T>(url, { ...options, method: "DELETE" }),
};

