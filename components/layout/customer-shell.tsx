"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  Bell,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { currentMockUser } from "@/lib/mock-data/users";

const navItems = [
  { href: "/portal", label: "Overview", icon: Home },
  { href: "/portal/applications", label: "My Applications", icon: FileText },
  { href: "/portal/applications/new", label: "Start New Application", icon: PlusCircle },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/profile", label: "Profile", icon: User },
  { href: "/portal/help", label: "Help & Support", icon: HelpCircle },
];

function CustomerShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl lg:pl-72">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Pixelonics Onboarding</p>
              <p className="text-xs text-muted-foreground">Customer Portal</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/portal/notifications" prefetch={false}>
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/help" prefetch={false}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </Link>
              </Button>
              <div className="flex items-center gap-2 rounded-lg border border-border/50 px-2 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs">
                    {currentMockUser.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium leading-none">{currentMockUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentMockUser.organization}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center px-6">
              <BrandLogo href="/portal" size="sm" />
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/portal" &&
                    pathname.startsWith(item.href + "/") &&
                    !navItems.some(
                      (other) =>
                        other.href !== item.href &&
                        other.href.startsWith(item.href + "/") &&
                        pathname.startsWith(other.href)
                    ));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-3">
              <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
                <Link href="/login" prefetch={false}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Link>
              </Button>
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground">
              <div className="flex h-16 items-center justify-between px-6">
                <BrandLogo href="/portal" size="sm" />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-1 px-3 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 lg:pl-72">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CustomerShellContent>{children}</CustomerShellContent>
    </Suspense>
  );
}
