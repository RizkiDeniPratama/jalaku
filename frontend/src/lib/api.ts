/**
 * Jalaku — Konfigurasi API Terpusat
 *
 * Menyediakan `apiClient` singleton untuk berkomunikasi
 * dengan seluruh microservices (User, Product, Order, Booking).
 *
 * Fitur:
 * - Auto-attach JWT token dari localStorage
 * - Support JSON & FormData (multipart)
 * - Type-safe response handling
 */

export type ServiceName = "user" | "product" | "order" | "booking";

const API_URLS: Record<ServiceName, string> = {
  user: import.meta.env.PUBLIC_USER_SERVICE_URL || "http://localhost:3001",
  product:
    import.meta.env.PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:3002",
  order: import.meta.env.PUBLIC_ORDER_SERVICE_URL || "http://localhost:3003",
  booking:
    import.meta.env.PUBLIC_BOOKING_SERVICE_URL || "http://localhost:3004",
};

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  meta?: {
    total_items?: number;
    current_page?: number;
    total_pages?: number;
    [key: string]: unknown;
  };
  error?: string;
}

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
  params?: Record<string, string | number>;
}

class ApiClient {
  /**
   * Mengambil JWT token dari localStorage (client-side only).
   */
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("jalaku_token");
  }

  /**
   * Mendapatkan base URL untuk service tertentu.
   */
  private getBaseUrl(service: ServiceName): string {
    return API_URLS[service];
  }

  /**
   * Membangun URL lengkap dengan query parameters.
   */
  private buildUrl(
    path: string,
    service: ServiceName,
    params?: Record<string, string | number>
  ): string {
    const base = `${this.getBaseUrl(service)}${path}`;
    if (!params || Object.keys(params).length === 0) return base;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    return `${base}?${searchParams.toString()}`;
  }

  /**
   * Mengirim HTTP request ke microservice.
   */
  private async request<T>(
    method: string,
    path: string,
    service: ServiceName,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, service, options?.params);
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...(options?.headers || {}),
    };

    // Auto-attach JWT token
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Set Content-Type (kecuali FormData, biarkan browser set boundary)
    if (!options?.isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (options?.body) {
      config.body = options.isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Request gagal dengan status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan."
        );
      }
      throw error;
    }
  }

  // ---- Public Methods ----

  async get<T>(
    path: string,
    service: ServiceName,
    params?: Record<string, string | number>
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, service, { params });
  }

  async post<T>(
    path: string,
    body: unknown,
    service: ServiceName,
    isFormData = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, service, { body, isFormData });
  }

  async patch<T>(
    path: string,
    body: unknown,
    service: ServiceName
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, service, { body });
  }

  async delete<T>(
    path: string,
    service: ServiceName
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, service);
  }
}

/** Singleton instance — gunakan ini di seluruh aplikasi */
export const apiClient = new ApiClient();
