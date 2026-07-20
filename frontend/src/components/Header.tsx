"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageContext";

const pageTitles: Record<string, string> = {
  "/overview": "Overview",
  "/heatmap": "AI Crime Hotspot Map",
  "/district": "District Analysis",
  "/crime-types": "Crime Categories",
  "/trends": "Trend Analysis",
  "/vulnerable": "Vulnerable Groups",
  "/ai-prediction": "AI Prediction Engine",
  "/ai-assistant": "AI Copilot Chat",
  "/alerts": "Alert Center",
  "/simulator": "Digital Twin Simulator",
  "/explainability": "AI Explainability",
  "/network": "Criminal Network",
  "/profiling": "Offender Profiles",
  "/case-intel": "Case Intelligence",
  "/financial": "Financial Trails",
  "/governance": "Governance",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();

  const { setMobileOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const { lang, setLang, t } = useLanguage();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);


  return (
    <header className="w-full flex items-center justify-between px-4 md:px-6 pt-4 lg:pt-6 pb-2 pointer-events-none">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          suppressHydrationWarning
          className="lg:hidden pointer-events-auto bg-background/50 backdrop-blur-sm border border-border/50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto bg-background/50 backdrop-blur-md rounded-full p-1.5 border border-border/50 shadow-sm">


        {/* Language toggle sliding button */}
        {mounted && (
          <div 
            className="relative flex items-center bg-muted/80 rounded-full p-1 cursor-pointer select-none border border-border/50 ml-1 h-[36px]"
            onClick={() => setLang(lang === "EN" ? "KA" : "EN")}
            style={{ width: "112px" }}
          >
            <div 
              className={cn(
                "absolute top-1 left-1 h-[26px] w-[50px] rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border border-transparent",
                lang === "EN" 
                  ? "translate-x-0 bg-brand-purple text-white" 
                  : "translate-x-[52px] bg-brand-cyan text-white"
              )}
            />
            <div className={cn("relative z-10 w-[50px] text-center text-xs font-extrabold tracking-wider transition-colors duration-300 flex items-center justify-center gap-1.5", lang === "EN" ? "text-white drop-shadow-sm" : "text-muted-foreground hover:text-foreground/80")}>
              <span className="text-[14px]">A</span> EN
            </div>
            <div className={cn("relative z-10 w-[50px] ml-[2px] text-center text-[11px] font-extrabold tracking-wider transition-colors duration-300 flex items-center justify-center gap-1.5", lang === "KA" ? "text-white drop-shadow-sm" : "text-muted-foreground hover:text-foreground/80")}>
              <span className="text-[14px]">ಅ</span> KA
            </div>
          </div>
        )}


      </div>
    </header>
  );
}
