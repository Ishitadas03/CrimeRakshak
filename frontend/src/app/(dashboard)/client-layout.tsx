"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SidebarProvider, useSidebar } from "@/components/SidebarContext";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden sidebar-mesh text-foreground">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pt-4",
          "lg:ml-64",
          collapsed && "lg:ml-[72px]"
        )}
      >
        <div className="flex-1 flex flex-col min-h-0 main-mesh rounded-tl-2xl overflow-hidden relative shadow-2xl">
          {/* Gradient Matrix Box */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] dark:opacity-[0.07]" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 dark:to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10 dark:to-black/10" />
          </div>
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 scrollbar-hide relative z-10">
            <Header />
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
