// API base URL
const API_BASE_URL = "http://localhost:8080/api";

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Item {
  id?: number;
  name: string;
  description: string;
  category: string;
  location?: string;
  imageUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  price?: number; // Optional price field for frontend compatibility
  reserved?: boolean; // Optional reserved field for reserviert support
}

// Kommentar-Typdefinition
export interface Comment {
  id?: number;
  text: string;
  createdAt?: string;
  user?: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  username: string;
  email: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

// Helper function to get auth header
const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Default fetch options for consistency

// Auth API service
export const authApi = {
  // Login
  login: async (loginRequest: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log("Attempting login to:", `${API_BASE_URL}/auth/login`);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Wichtig für Cookies
        body: JSON.stringify(loginRequest),
      });

      console.log("Login response status:", response.status);
      console.log(
        "Login response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (response.status === 307) {
        console.error(
          "307 Redirect detected. Check your backend URL configuration.",
        );
        throw new Error(
          "Server configuration error (307 redirect). Please check backend settings.",
        );
      }

      const responseText = await response.text();
      console.log("Login response body:", responseText);

      if (!response.ok) {
        throw new Error(
          responseText || `HTTP ${response.status}: Login failed`,
        );
      }

      try {
        const data = JSON.parse(responseText);

        // Validierung der Antwort
        if (!data.id || !data.username || !data.email) {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response format from server");
        }

        // Store user info und token
        const userData = {
          id: data.id,
          username: data.username,
          email: data.email,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isLoggedIn", "true");

        // Falls ein token zurückgegeben wird, speichere ihn auch
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }

        console.log("Login successful, user data stored");
        return data;
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Failed to parse server response");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Register
  register: async (registerRequest: RegisterRequest): Promise<string> => {
    try {
      console.log(
        "Attempting registration to:",
        `${API_BASE_URL}/auth/register`,
      );

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(registerRequest),
      });

      console.log("Register response status:", response.status);

      if (response.status === 307) {
        console.error("307 Redirect detected during registration.");
        throw new Error(
          "Server configuration error (307 redirect). Please check backend settings.",
        );
      }

      const responseText = await response.text();
      console.log("Register response body:", responseText);

      if (!response.ok) {
        throw new Error(
          responseText || `HTTP ${response.status}: Registration failed`,
        );
      }

      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeader(),
      });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // Clear local storage
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("authToken");

    console.log("Logout completed, localStorage cleared");
  },

  // Check if user is logged in
  isLoggedIn: (): boolean => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const hasUser = !!localStorage.getItem("user");
      return isLoggedIn && hasUser;
    }
    return false;
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};

// File upload API service
export const uploadApi = {
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file: File) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_BASE_URL}/upload/images`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeader(), // Kein Content-Type für FormData
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload images");
    }

    return response.json();
  },
};

// Kommentare API-Service
export const commentsApi = {
  // Alle Kommentare zu einem Item laden
  getByItemId: async (itemId: number): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/comments`, {
      credentials: "include",
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error("Failed to fetch comments");
    return response.json();
  },

  // Kommentar zu einem Item hinzufügen
  add: async (itemId: number, text: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/comments`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("Failed to add comment");
    return response.json();
  },
};

// Items API service
export const itemsApi = {
  getAll: async (
    page: number = 0,
    size: number = 10,
    category?: string,
    search?: string,
    sortBy: string = "createdAt",
    sortDir: string = "desc",
  ): Promise<PaginatedResponse<Item>> => {
    let url = `${API_BASE_URL}/items?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;

    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      credentials: "include",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch items");
    }

    return response.json();
  },

  getById: async (id: number): Promise<Item> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      credentials: "include",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item with ID ${id}`);
    }
    return response.json();
  },

  create: async (item: Item): Promise<Item> => {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error("Failed to create item");
    }

    return response.json();
  },

  update: async (id: number, item: Item): Promise<Item> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Failed to update item with ID ${id}`);
    }

    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete item with ID ${id}`);
    }
  },

  getMyItems: async (): Promise<Item[]> => {
    const response = await fetch(`${API_BASE_URL}/items/my-items`, {
      credentials: "include",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch your items");
    }

    return response.json();
  },
};
