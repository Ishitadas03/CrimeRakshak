"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Brain, Bell, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

const items = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/heatmap", label: "Heatmap", icon: Map },
  { href: "/ai-prediction", label: "AI", icon: Brain },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-side border-t border-sidebar-border flex items-center justify-around z-40 lg:hidden safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] rounded-lg transition-colors",
              isActive
                ? "text-brand-purple"
                : "text-sidebar-foreground/50"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] text-sidebar-foreground/50"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </nav>
  );
}
