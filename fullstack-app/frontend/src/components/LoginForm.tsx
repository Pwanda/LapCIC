"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/services/api";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted"); // Debug

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Attempting login..."); // Debug
      const result = await authApi.login({ username, password });
      console.log("Login result:", result); // Debug

      // Dispatch auth change event
      window.dispatchEvent(new Event("auth-change"));

      console.log("Redirecting to home..."); // Debug
      // Redirect to home page using Next.js router
      router.push("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "Invalid username or password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10 w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Login to Your Account
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <div className="mt-1">
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "var(--primary)",
            }}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
