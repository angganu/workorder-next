"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  collapsed?: boolean;
}

interface NavItem {
  href?: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

const navLinks: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/dashboard/blogs", label: "Blogs", icon: "✎" },
  {
    label: "Companies",
    icon: "🏢",
    children: [
      { href: "/dashboard/companies", label: "Companies", icon: "🏭" },
      { href: "/dashboard/department", label: "Department", icon: "🗂" },
    ],
  },
  {
    label: "Administrator",
    icon: "⚙",
    children: [
      { href: "/dashboard/users", label: "Users", icon: "👤" },
      { href: "/dashboard/privileges", label: "Privileges", icon: "🔐" },
    ],
  },
];

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(["Administrator"]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isMenuOpen = (label: string) => openMenus.includes(label);

  const hasActiveChild = (items: NavItem[]) => {
    return items.some((item) => {
      if (item.href) {
        return item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href);
      }
      return false;
    });
  };

  return (
    <aside
      className={`${
        collapsed ? "w-14" : "w-56"
      } min-h-screen bg-gray-900 dark:bg-gray-900 text-white flex flex-col transition-all duration-200 shrink-0 border-r border-gray-800`}
    >
      <div className={`border-b border-gray-700 dark:border-gray-800 flex items-center pt-4 pb-3 ${collapsed ? "justify-center px-0" : "px-6"}`}>
        {!collapsed && <span className="text-lg font-bold">Administrator</span>}
        {collapsed && <span className="text-lg font-bold">A</span>}
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navLinks.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = hasChildren
              ? hasActiveChild(item.children!)
              : item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href!);
            const isOpen = isMenuOpen(item.label);

            if (hasChildren) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 py-2 text-sm transition-colors ${
                      collapsed ? "justify-center px-0" : "px-6"
                    } ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {!collapsed && (
                      <span className="text-xs">{isOpen ? "▼" : "▶"}</span>
                    )}
                  </button>
                  {isOpen && !collapsed && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const childActive =
                          child.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(child.href!);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href!}
                              className={`flex items-center gap-3 py-1.5 text-sm rounded-r-full px-4 transition-colors ${
                                childActive
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
                              }`}
                            >
                              <span className="text-base leading-none">{child.icon}</span>
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href!}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 py-2 text-sm transition-colors ${
                    collapsed ? "justify-center px-0" : "px-6 rounded-r-full"
                  } ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}