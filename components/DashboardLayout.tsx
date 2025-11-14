"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Sparkles,
  Map,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { useUserType } from "@/hooks/useUserType";
import { useAuth } from "@/hooks/useAuth";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userType = useUserType();
  
  const navLinks = userType === "employer"
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/jobs/post", label: "Post Job", icon: Briefcase },
        { href: "/jobs", label: "My Jobs", icon: Briefcase },
        { href: "/profile", label: "Profile", icon: User },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/careerbot", label: "CareerBot", icon: Sparkles },
        { href: "/roadmap", label: "Roadmap", icon: Map },
        { href: "/jobs", label: "Jobs", icon: Briefcase },
        { href: "/resources", label: "Learning", icon: BookOpen },
        { href: "/profile", label: "Profile", icon: User },
      ];

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (href: string) => {
    // Exact match for dashboard
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    // Exact match
    if (pathname === href) {
      return true;
    }
    // For /jobs/post, only match exactly (not /jobs)
    if (href === "/jobs/post") {
      return pathname === "/jobs/post";
    }
    // For /jobs, match /jobs but not /jobs/post
    if (href === "/jobs") {
      return pathname === "/jobs" || (pathname.startsWith("/jobs/") && pathname !== "/jobs/post");
    }
    // For /careerbot, exact match
    if (href === "/careerbot") {
      return pathname === "/careerbot";
    }
    // For /roadmap, exact match
    if (href === "/roadmap") {
      return pathname === "/roadmap";
    }
    // For other paths, use startsWith
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="block">
            <h1
              className={`${inter.className} text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}
            >
              NextGen Career
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col mt-6 px-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm",
                  active
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {user && (
            <div className="px-4 py-2 rounded-lg bg-white/5">
              <p className="text-sm font-medium text-white truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition font-medium text-sm"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <h1
                className={`${inter.className} text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}
              >
                NextGen Career
              </h1>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

