"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton, UserButton } from "@clerk/nextjs";
import {
  Shield,
  LayoutDashboard,
  Map,
  Building2,
  Layers,
  TrendingUp,
  Users,
  Brain,
  MessageSquare,
  Bell,
  Cpu,
  Eye,
  Settings,
  PanelLeftClose,
  X,
  Network,
  Fingerprint,
  FileSearch,
  Banknote,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Analytics",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/heatmap", label: "Heatmap", icon: Map },
      { href: "/district", label: "District Analysis", icon: Building2 },
      { href: "/crime-types", label: "Crime Categories", icon: Layers },
      { href: "/trends", label: "Trend Analysis", icon: TrendingUp },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/vulnerable", label: "Vulnerable Groups", icon: Users },
      { href: "/network", label: "Criminal Network", icon: Network },
      { href: "/profiling", label: "Offender Profiles", icon: Fingerprint },
      { href: "/case-intel", label: "Case Intelligence", icon: FileSearch },
      { href: "/financial", label: "Financial Trails", icon: Banknote },
    ],
  },
  {
    title: "AI & Prediction",
    items: [
      { href: "/ai-prediction", label: "AI Prediction", icon: Brain },
      { href: "/ai-assistant", label: "AI Copilot", icon: MessageSquare },
      { href: "/alerts", label: "Alert Center", icon: Bell },
      { href: "/simulator", label: "Digital Twin", icon: Cpu },
      { href: "/explainability", label: "Explainability", icon: Eye },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/governance", label: "Governance", icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useLanguage();
  const { user } = useUser();

  const name = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || "User";
  let displayName = name;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    displayName = `${parts[0][0].toUpperCase()}.${parts[parts.length - 1][0].toUpperCase()}`;
  }
  const initials = name.substring(0, 2).toUpperCase();
  const role = (user?.publicMetadata?.role as string) || "Investigator";

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        suppressHydrationWarning
        className={cn(
          "fixed top-0 left-0 h-screen flex flex-col z-50 transition-all duration-300",
          "bg-transparent",
          // Desktop
          "max-lg:hidden",
          collapsed ? "w-[72px]" : "w-64",
          // Mobile overlay
          mobileOpen && "max-lg:!flex max-lg:w-72 max-lg:bg-surface-side"
        )}
      >
        {/* Logo */}
        <div className="h-24 flex items-center px-6 gap-3">
          <button
            onClick={toggle}
            suppressHydrationWarning
            className="flex items-center gap-3 flex-1 min-w-0 group"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(30,64,175,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(30,64,175,0.5)] transition-all duration-300">
                <Shield className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="flex items-center gap-2 group-hover:scale-105 transition-transform duration-300 transform origin-left min-w-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(30,64,175,0.3)]">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="brand-logo font-black text-xl tracking-tight bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] dark:from-[#F8FAFC] dark:via-[#93C5FD] dark:to-[#60A5FA] text-transparent bg-clip-text drop-shadow-sm whitespace-nowrap truncate min-w-0">
                  {t("CrimeRakshak")}
                </span>
              </div>
            )}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            suppressHydrationWarning
            className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop collapse chevron */}
          {!collapsed && (
            <button
              onClick={toggle}
              suppressHydrationWarning
              className="hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto scrollbar-hide space-y-1">
          {navSections.map((section) => (
            <div key={section.title} className="mb-2">
              {!collapsed && (
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/70 dark:text-white/40 px-4 pt-4 pb-2 truncate">
                  {t(section.title)}
                </p>
              )}
              {collapsed && <div className="pt-2 mb-1 border-t border-black/5 dark:border-white/5" />}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group relative min-w-0",
                        collapsed && "justify-center px-0 rounded-xl",
                        isActive
                          ? "bg-card text-brand-purple shadow-sm"
                          : "text-black dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-brand-purple")} />
                      {!collapsed && <span className="flex-1 min-w-0 font-medium text-[13px] tracking-wide truncate">{t(item.label)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 mt-auto">
          <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "h-10 w-10 shadow-sm border-2 border-background" } }} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-bold text-black dark:text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-black/70 dark:text-white/60 uppercase tracking-wider font-semibold truncate">{role}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center">
                <Link href="/settings" title={t("Settings")} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors">
                  <Settings className="h-4 w-4" />
                </Link>
                <SignOutButton redirectUrl="/">
                  <button suppressHydrationWarning title={t("Log Out")} className="p-2 rounded-xl hover:bg-brand-red/10 text-muted-foreground hover:text-brand-red transition-colors">
                    <LogOut className="h-4 w-4" />
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

