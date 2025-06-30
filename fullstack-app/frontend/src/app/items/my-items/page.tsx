"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Item, itemsApi, authApi } from "@/services/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function MyItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!authApi.isLoggedIn()) {
      router.push("/login");
      return;
    }

    // Fetch user's items
    const fetchMyItems = async () => {
      try {
        setLoading(true);
        const myItems = await itemsApi.getMyItems();
        setItems(myItems);
        setError(null);
      } catch (err) {
        setError("Failed to fetch your items. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyItems();
  }, [router]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-AT", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-AT", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Handle delete item
  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await itemsApi.delete(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      setError("Failed to delete item. Please try again.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-black  mb-6">My Items</h1>
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </main>
        <footer className="bg-white shadow py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-black  text-sm">
              Willhaben Clone - Next.js Frontend + Spring Boot Backend
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black ">My Items</h1>
            <Link
              href="/items/new"
              className="bg-blue-600 text-black  px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add New Item
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <svg
                className="mx-auto h-12 w-12 text-black "
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-black ">
                No items yet
              </h3>
              <p className="mt-1 text-black ">
                Get started by creating a new item listing.
              </p>
              <div className="mt-6">
                <Link
                  href="/items/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black  bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Item
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center px-4 py-4 sm:px-6">
                      <div className="min-w-0 flex-1 flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md overflow-hidden">
                          {item.imageUrls && item.imageUrls.length > 0 ? (
                            <div className="relative h-full w-full bg-white">
                              <img
                                src={item.imageUrls[0]}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                style={{ backgroundColor: "#fff" }}
                              />
                              {item.imageUrls.length > 1 && (
                                <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                                  +{item.imageUrls.length}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-white">
                              <svg
                                className="h-8 w-8 text-black"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="text-lg font-medium text-blue-600 truncate">
                                {item.name}
                              </p>
                              {item.reserved && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-200 text-yellow-800 border border-yellow-400">
                                  Reserviert
                                </span>
                              )}
                            </div>
                            <p className="ml-2 flex-shrink-0 font-semibold text-green-600">
                              {formatPrice(item.price || 0)}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-black ">
                            <span className="truncate">{item.description}</span>
                          </div>
                          <div className="mt-1 flex items-center text-xs text-black ">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                              {item.category}
                            </span>
                            <span className="ml-2">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0 flex space-x-2">
                        <Link
                          href={`/items/${item.id}/edit`}
                          className="inline-flex items-center px-3 py-1 rounded-md bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold text-xs transition-colors duration-150 shadow-sm border border-blue-200 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          title="Bearbeiten"
                        >
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6"
                            />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => item.id && handleDeleteItem(item.id)}
                          className="inline-flex items-center px-3 py-1 rounded-md bg-red-100 hover:bg-red-600 text-red-700 hover:text-white font-semibold text-xs transition-colors duration-150 shadow-sm border border-red-200 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                          title="Löschen"
                          type="button"
                        >
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <footer className="bg-white shadow py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-black  text-sm">
            Next.js Frontend + Spring Boot Backend
          </p>
        </div>
      </footer>
    </div>
  );
}
