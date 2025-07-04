"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ItemList from "@/components/ItemList";
import Navbar from "@/components/Navbar";
import { authApi } from "@/services/api";

export default function ItemsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const loggedIn = authApi.isLoggedIn();
      setIsLoggedIn(loggedIn);
      setLoading(false);

      if (!loggedIn) {
        router.push("/login");
      }
    };

    checkAuth();

    // Add event listener for auth changes
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"
            style={{ borderColor: "var(--primary)" }}
          ></div>
        </div>
        <footer className="bg-white shadow py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-black  text-sm">
              CIC to Give - Next.js Frontend + Spring Boot Backend
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4"
                style={{
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-black ">
                Login Required
              </h3>
              <p className="mt-2 text-black  mb-6">
                You need to login to view items.
              </p>
              <Link
                href="/login"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black  bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                style={{
                  backgroundColor: "var(--primary)",
                  borderColor: "var(--primary)",
                }}
              >
                Go to Login
              </Link>
            </div>
          </div>
        </main>
        <footer className="bg-white shadow py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-black  text-sm">
              CIC to Give - Next.js Frontend + Spring Boot Backend
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-black  mb-6">Browse Items</h1>
          <ItemList />
        </div>
      </main>
      <footer className="bg-white shadow py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-black  text-sm">
            CIC to Give - Next.js Frontend + Spring Boot Backend
          </p>
        </div>
      </footer>
    </div>
  );
}
