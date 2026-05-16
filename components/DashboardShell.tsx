"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

interface DashboardShellProps {
  name: string;
  email: string;
  avatar?: string | null;
  children: React.ReactNode;
}

export default function DashboardShell({ name, email, avatar, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-700">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          name={name}
          email={email}
          avatar={avatar}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
        />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-700 transition-colors duration-200">{children}</main>
      </div>
    </div>
  );
}
