"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

interface HeaderProps {
  name: string;
  email: string;
  avatar?: string | null;
  onToggleSidebar?: () => void;
}

export default function Header({ name, email, avatar, onToggleSidebar }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const initials = (name ?? "?").charAt(0).toUpperCase();

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 transition-colors duration-200">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard</span>
      </div>

      {/* Right: avatar trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="User menu"
        >
          {avatar ? (
            <Image src={avatar} alt={name} width={32} height={32} className="rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
            {name ?? ""}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Profile section */}
            <div className="flex flex-col items-center gap-2 px-5 py-5 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
              {avatar ? (
                <Image src={avatar} alt={name} width={56} height={56} className="rounded-full object-cover ring-2 ring-blue-500" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold ring-2 ring-blue-400">
                  {initials}
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="py-2 px-2">
              <Link
                href="/dashboard/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-base">👤</span>
                Profile
              </Link>

              {/* <Link
                href="/dashboard/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 text-base">🔒</span>
                Change Password
              </Link> */}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-base">
                  {theme === "dark" ? "🌙" : "☀️"}
                </span>
                <span className="flex-1 text-left">Dark Theme</span>
                {/* Toggle pill */}
                <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${theme === "dark" ? "bg-blue-600" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${theme === "dark" ? "translate-x-4" : "translate-x-0.5"}`} />
                </span>
              </button>
            </div>

            {/* Divider + Logout */}
            <div className="border-t border-gray-100 dark:border-gray-700 py-2 px-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-500 dark:text-red-400 text-base">⏻</span>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
