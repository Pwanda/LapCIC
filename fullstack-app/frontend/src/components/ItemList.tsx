"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Item, itemsApi } from "@/services/api";
import Link from "next/link";

const CATEGORIES = [
  "All",
  "Electronics",
  "Furniture",
  "Clothing",
  "Sports",
  "Books",
  "Toys",
  "Vehicles",
  "Beauty",
  "Services",
  "Other",
];

export default function ItemList() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<string>("desc");

  const searchParams = useSearchParams();

  // Sync selectedCategory with URL query param
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "All";
    setSelectedCategory(urlCategory);
  }, [searchParams]);

  // Sync searchTerm with URL query param
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearchTerm(urlSearch);
  }, [searchParams]);

  // Fetch items with filters
  const fetchItems = async (page: number = 0, searchOverride?: string) => {
    try {
      setLoading(true);

      const category =
        selectedCategory !== "All" ? selectedCategory : undefined;
      const search =
        typeof searchOverride === "string"
          ? searchOverride.trim() !== ""
            ? searchOverride
            : undefined
          : searchTerm.trim() !== ""
            ? searchTerm
            : undefined;

      const response = await itemsApi.getAll(
        page,
        12,
        category,
        search,
        sortBy,
        sortDir,
      );

      setItems(response.items);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
      setError(null);
    } catch (err) {
      setError("Failed to fetch items. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and whenever dependencies change
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm, sortBy, sortDir]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
    // Update URL so Navbar-Kategorien funktionieren
    if (category === "All") {
      router.push("/items");
    } else {
      router.push(`/items?category=${encodeURIComponent(category)}`);
    }
  };

  // Handle search (update URL so Navbar-Suche funktioniert)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    router.push(`/items?search=${encodeURIComponent(searchTerm)}`);
    // fetchItems(0, searchTerm); // Wird automatisch durch useEffect getriggert
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "newest") {
      setSortBy("createdAt");
      setSortDir("desc");
    } else if (value === "oldest") {
      setSortBy("createdAt");
      setSortDir("asc");
    }

    setCurrentPage(0);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchItems(page);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Price formatting removed as all items are now free

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

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"
          style={{ borderColor: "var(--primary)" }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-black"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-black "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-black hover:text-green-800 font-medium"
                style={{ color: "var(--primary)" }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Sort */}
          <div className="flex-shrink-0">
            <select
              value={
                sortBy === "createdAt"
                  ? sortDir === "desc"
                    ? "newest"
                    : "oldest"
                  : sortDir === "asc"
                    ? "priceAsc"
                    : "priceDesc"
              }
              onChange={handleSortChange}
              className="pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md shadow-sm text-black"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? "bg-green-600 text-black  shadow-md"
                  : "bg-gray-100 text-black -700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results info */}
      <div className="flex justify-between items-center">
        <p className="text-black  font-medium">
          {totalItems === 0
            ? "No items found"
            : `Showing ${items.length} of ${totalItems} items`}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Items grid */}
      {items.length === 0 && !loading ? (
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-black ">No items found</h3>
          <p className="mt-2 text-black ">
            Try changing your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-[600px] items-start">
          {items.map((item) => (
            <Link
              href={`/items/${item.id}`}
              key={item.id}
              className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col h-full min-h-[420px]"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                {item.reserved && (
                  <div className="absolute top-3 left-3 z-20 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-yellow-500">
                    🔒 Reserviert
                  </div>
                )}
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <img
                    src={`http://localhost:8080${item.imageUrls[0]}`}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-image.jpg";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                    <svg
                      className="h-20 w-20 mb-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Kein Bild</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                  {item.category}
                </div>
                {item.imageUrls && item.imageUrls.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm">
                    <span className="flex items-center">
                      <svg
                        className="h-3 w-3 mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {item.imageUrls.length}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-200 leading-tight line-clamp-2 min-h-[3.5rem]">
                    {item.name}
                  </h3>
                  {item.reserved && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 flex-shrink-0">
                      Reserviert
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold text-white bg-green-600 shadow-md">
                    ✨ Kostenlos
                  </span>
                </div>

                <div className="flex-grow">
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 min-h-[4rem]">
                    {item.description || "Keine Beschreibung verfügbar."}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3 mt-auto">
                  {item.location && (
                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="h-4 w-4 mr-2 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">{item.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="h-4 w-4 mr-2 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Details →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-black  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === i
                    ? "z-10 bg-green-50 border-green-500 text-green-600"
                    : "text-black -700 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-black  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
