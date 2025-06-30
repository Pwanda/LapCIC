"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authApi, Item } from "@/services/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Autocomplete State
  const [searchInput, setSearchInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [dropdownFocused, setDropdownFocused] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const userMenuTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const handleUserMenuEnter = () => {
    if (userMenuTimeout.current) clearTimeout(userMenuTimeout.current);
    setShowUserMenu(true);
  };

  const handleUserMenuLeave = () => {
    if (userMenuTimeout.current) clearTimeout(userMenuTimeout.current);
    userMenuTimeout.current = setTimeout(() => {
      setShowUserMenu(false);
    }, 200); // 0.2 Sekunden
  };

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const loggedIn = authApi.isLoggedIn();
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const user = authApi.getCurrentUser();
        setUsername(user?.username || "");
      }
    };

    checkAuth();

    // Add event listener for auth changes
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    setUsername("");

    // Dispatch auth change event
    window.dispatchEvent(new Event("auth-change"));

    // Use Next.js router for navigation
    router.push("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Check if the link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/items?search=${encodeURIComponent(searchInput.trim())}`);
      setShowDropdown(false);
      setSuggestions([]);

      setSearchInput("");
      closeMobileMenu();
    }
  };

  // Autocomplete: fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      setLoadingSuggestions(true);
      try {
        // Fetch first 5 items matching the search term
        const resp = await fetch(
          `/api/items?search=${encodeURIComponent(searchInput)}&size=5`,
        );
        if (resp.ok) {
          const data = await resp.json();
          setSuggestions(data.items || []);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [searchInput]);

  // Hide dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setShowDropdown(false);
    };
    if (showDropdown && !dropdownFocused) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [showDropdown, dropdownFocused]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top bar with logo and search */}
      <div
        className="bg-gradient-to-r from-green-500 to-green-700"
        style={{
          backgroundColor: "var(--primary)",
          backgroundImage:
            "linear-gradient(to right, var(--primary), var(--primary-dark))",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo  */}
            <Link href="/" className="flex items-center">
              <div className="flex items-center">
                <img
                  src="/CIC_Austria_Logo_black.jpg"
                  alt="Logo"
                  className="h-full w-full object-contain border-2 bg-transparent hover:scale-105 transition-transform duration-200"
                  style={{
                    maxWidth: 64,
                    maxHeight: 64,
                    padding: 6,
                    filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                  }}
                />
              </div>
            </Link>

            {/* Search bar - desktop (nur für eingeloggte User) */}
            {isLoggedIn && (
              <div className="hidden md:block flex-grow max-w-2xl mx-4">
                <form onSubmit={handleSearch} className="flex w-full relative">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search for anything..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowDropdown(true);
                        setDropdownFocused(true);
                      }}
                      onBlur={() => setDropdownFocused(false)}
                      className="w-full pl-10 pr-4 py-2 rounded-l-full bg-gray-100 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-300"
                      autoComplete="off"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    {/* Autocomplete Dropdown */}
                    {showDropdown && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                        {loadingSuggestions && (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            Loading...
                          </div>
                        )}
                        {!loadingSuggestions &&
                          suggestions.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                              onMouseDown={() => {
                                setShowDropdown(false);
                                setSuggestions([]);
                                setSearchInput("");
                                router.push(`/items/${item.id}`);
                              }}
                            >
                              {item.imageUrls && item.imageUrls.length > 0 ? (
                                <img
                                  src={`http://localhost:8080${item.imageUrls[0]}`}
                                  alt={item.name}
                                  className="h-8 w-8 object-cover rounded mr-3 border border-gray-200"
                                />
                              ) : (
                                <div className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded mr-3">
                                  <svg
                                    className="h-5 w-5 text-gray-400"
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
                              <span className="truncate text-black">
                                {item.name}
                              </span>
                            </div>
                          ))}
                        {!loadingSuggestions && suggestions.length === 0 && (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            No results found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-r-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors duration-200"
                  >
                    Search
                  </button>
                </form>
              </div>
            )}

            {/* User menu - desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <div
                    className="relative"
                    onMouseEnter={handleUserMenuEnter}
                    onMouseLeave={handleUserMenuLeave}
                  >
                    <button
                      className="flex items-center text-black hover:text-green-100 focus:outline-none"
                      onClick={() => setShowUserMenu((v) => !v)}
                      aria-haspopup="true"
                      aria-expanded={showUserMenu}
                      type="button"
                    >
                      <span className="mr-1">Hi, {username}</span>
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {showUserMenu && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                        onClick={() => setShowUserMenu(false)}
                        onMouseEnter={handleUserMenuEnter}
                        onMouseLeave={handleUserMenuLeave}
                      >
                        <Link
                          href="/items/my-items"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          My Items
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 hover:text-red-700 text-gray-700 transition-colors duration-150 rounded cursor-pointer"
                          style={{ width: "100%" }}
                          type="button"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/items/new"
                    className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300"
                    style={{ color: "var(--primary)" }}
                  >
                    Give Item
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-black hover:text-green-100 text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300"
                    style={{ color: "var(--primary)" }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-black hover:text-green-100 hover:bg-green-700 focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon when menu is closed */}
                <svg
                  className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Icon when menu is open */}
                <svg
                  className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation links (nur für eingeloggte User) */}
      {isLoggedIn && (
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex space-x-8 py-3">
            <Link
              href="/"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/")
                  ? "border-green-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Home
            </Link>
            <Link
              href="/items"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/items") &&
                !isActive("/items/my-items") &&
                !isActive("/items/new")
                  ? "border-green-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Browse Items
            </Link>
            <Link
              href="/items?category=Electronics"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`}
            >
              Electronics
            </Link>
            <Link
              href="/items?category=Furniture"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`}
            >
              Furniture
            </Link>
            <Link
              href="/items?category=Clothing"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`}
            >
              Clothing
            </Link>
            <Link
              href="/items?category=Vehicles"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`}
            >
              Vehicles
            </Link>
          </div>
        </nav>
      )}

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden`}>
        {/* Mobile search und Navigation nur für eingeloggte User */}
        {isLoggedIn && (
          <>
            {/* Mobile search */}
            <div className="px-4 pt-4 pb-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search for anything..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                    setDropdownFocused(true);
                  }}
                  onBlur={() => setDropdownFocused(false)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {/* Autocomplete Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                    {loadingSuggestions && (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        Loading...
                      </div>
                    )}
                    {!loadingSuggestions &&
                      suggestions.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                          onMouseDown={() => {
                            setShowDropdown(false);
                            setSuggestions([]);
                            setSearchInput("");
                            router.push(`/items/${item.id}`);
                            closeMobileMenu();
                          }}
                        >
                          {item.imageUrls && item.imageUrls.length > 0 ? (
                            <img
                              src={`http://localhost:8080${item.imageUrls[0]}`}
                              alt={item.name}
                              className="h-8 w-8 object-cover rounded mr-3 border border-gray-200"
                            />
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded mr-3">
                              <svg
                                className="h-5 w-5 text-gray-400"
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
                          <span className="truncate text-black">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    {!loadingSuggestions && suggestions.length === 0 && (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        No results found
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600 hover:text-green-800"
                  style={{ color: "var(--primary)" }}
                >
                  Search
                </button>
              </form>
            </div>
            {/* Mobile navigation links */}
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/")
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Home
              </Link>
              <Link
                href="/items"
                onClick={closeMobileMenu}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/items") &&
                  !isActive("/items/my-items") &&
                  !isActive("/items/new")
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Browse Items
              </Link>
              <Link
                href="/items?category=Electronics"
                onClick={closeMobileMenu}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              >
                Electronics
              </Link>
              <Link
                href="/items?category=Furniture"
                onClick={closeMobileMenu}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              >
                Furniture
              </Link>
              <Link
                href="/items?category=Clothing"
                onClick={closeMobileMenu}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              >
                Clothing
              </Link>
              <Link
                href="/items?category=Vehicles"
                onClick={closeMobileMenu}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              >
                Vehicles
              </Link>
              <Link
                href="/items/my-items"
                onClick={closeMobileMenu}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/items/my-items")
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                My Items
              </Link>
              <Link
                href="/items/new"
                onClick={closeMobileMenu}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/items/new")
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Give Item
              </Link>
            </div>
          </>
        )}
        {/* Mobile user menu */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isLoggedIn ? (
            <div className="space-y-1">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-500">
                  Signed in as
                </p>
                <p className="text-sm font-medium text-gray-800">{username}</p>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/login")
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={closeMobileMenu}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/register")
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
