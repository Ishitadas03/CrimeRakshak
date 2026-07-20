"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronDown, Shield, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface MinorHead {
  name: string;
  section: string;
  reported2025: number;
  reported2024: number;
  disposalRate: number;
}

interface MajorChapter {
  id: string;
  code: string;
  title: string;
  total2025: number;
  total2024: number;
  minorHeads: MinorHead[];
}

const statutoryChapters: MajorChapter[] = [
  {
    id: "chap17",
    code: "IPC Chapter XVII",
    title: "Offences Against Property (Theft, Burglary, Robbery, Dacoity)",
    total2025: 47910,
    total2024: 45368,
    minorHeads: [
      { name: "Motor Vehicle Theft (Two / Four Wheelers)", section: "Sec 379 IPC", reported2025: 18450, reported2024: 17120, disposalRate: 64.2 },
      { name: "House Break-in & Burglary (Night)", section: "Sec 457 / 380 IPC", reported2025: 12345, reported2024: 11890, disposalRate: 71.8 },
      { name: "General Property Theft (Dwelling House)", section: "Sec 380 IPC", reported2025: 11390, reported2024: 11336, disposalRate: 68.5 },
      { name: "Robbery (Highway & Street)", section: "Sec 392 IPC", reported2025: 4567, reported2024: 4122, disposalRate: 82.4 },
      { name: "Dacoity & Armed Gang Assembly", section: "Sec 395 / 399 IPC", reported2025: 1158, reported2024: 900, disposalRate: 88.9 },
    ],
  },
  {
    id: "chap16",
    code: "IPC Chapter XVI",
    title: "Offences Affecting Human Body (Homicide, Assault, Kidnapping)",
    total2025: 24812,
    total2024: 24200,
    minorHeads: [
      { name: "Homicide & Murder", section: "Sec 302 IPC", reported2025: 1412, reported2024: 1445, disposalRate: 91.5 },
      { name: "Attempt to Murder", section: "Sec 307 IPC", reported2025: 1876, reported2024: 1910, disposalRate: 89.2 },
      { name: "Grievous Hurt & Assault", section: "Sec 324 / 326 IPC", reported2025: 15678, reported2024: 15120, disposalRate: 78.4 },
      { name: "Kidnapping & Abduction", section: "Sec 363 / 366 IPC", reported2025: 5678, reported2024: 5590, disposalRate: 84.1 },
      { name: "Culpable Homicide Not Amounting to Murder", section: "Sec 304 IPC", reported2025: 168, reported2024: 135, disposalRate: 87.0 },
    ],
  },
  {
    id: "sll",
    code: "Special Local Laws (SLL)",
    title: "Statutory Enforcement Acts (NDPS, Arms, Excise, COTPA)",
    total2025: 18450,
    total2024: 16980,
    minorHeads: [
      { name: "NDPS Act (Narcotics & Psychotropic Substances)", section: "NDPS Sec 20/21/22", reported2025: 4567, reported2024: 3890, disposalRate: 94.2 },
      { name: "Karnataka Excise Act Violations", section: "Excise Sec 32/34", reported2025: 7890, reported2024: 7650, disposalRate: 96.8 },
      { name: "Arms Act (Illegal Firearm Possession)", section: "Arms Act Sec 25/27", reported2025: 1234, reported2024: 1180, disposalRate: 89.4 },
      { name: "COTPA Act (Cigarettes & Tobacco Enforcement)", section: "COTPA Sec 4/6", reported2025: 4759, reported2024: 4260, disposalRate: 98.1 },
    ],
  },
  {
    id: "cyber",
    code: "IT Act & Cyber Crime",
    title: "Information Technology Act & Digital Financial Frauds",
    total2025: 21450,
    total2024: 18230,
    minorHeads: [
      { name: "Online Financial Cheating & UPI Phishing", section: "IT Act Sec 66D / IPC 420", reported2025: 14890, reported2024: 12450, disposalRate: 58.4 },
      { name: "Identity Theft & Impersonation", section: "IT Act Sec 66C", reported2025: 4120, reported2024: 3680, disposalRate: 61.2 },
      { name: "Cyber Extortion & Ransomware", section: "IT Act Sec 66 / IPC 384", reported2025: 1450, reported2024: 1190, disposalRate: 64.8 },
      { name: "Publishing Obscene Content", section: "IT Act Sec 67", reported2025: 990, reported2024: 910, disposalRate: 77.3 },
    ],
  },
];

export function StatutoryHeadDrillDown() {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    chap17: true,
    sll: false,
  });

  const toggleChapter = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card className="glass-card overflow-hidden border-border/50 shadow-lg">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-brand-purple/15 text-brand-purple border border-brand-purple/30">
                {t("STATUTORY CODEBOOK")}
              </span>
              <span className="text-xs text-muted-foreground">
                Official Major / Minor Head Classification (KSP Crime Review)
              </span>
            </div>
            <CardTitle className="text-lg font-heading mt-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-purple" />
                {t("Major vs. Minor Statutory Head Drill-Down Matrix")}
              </div>
              <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full border border-brand-purple/20 ml-auto">2024–2025 YoY Telemetry</span>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/40">
        {statutoryChapters.map((chap) => {
          const isOpen = !!expanded[chap.id];
          const yoyPercent = ((chap.total2025 - chap.total2024) / chap.total2024) * 100;
          return (
            <div key={chap.id} className="transition-colors">
              {/* Chapter Header Row */}
              <div
                onClick={() => toggleChapter(chap.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted/50 text-foreground">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-brand-purple" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-purple">
                      {t(chap.code)}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t(chap.title)}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-foreground">
                      {chap.total2025.toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center justify-end gap-1 text-[11px]">
                      <span className={yoyPercent >= 0 ? "text-brand-red" : "text-brand-green"}>
                        {yoyPercent >= 0 ? "+" : ""}
                        {yoyPercent.toFixed(1)}% YoY
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Minor Heads Table */}
              {isOpen && (
                <div className="bg-muted/15 border-t border-border/30 px-4 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <th className="py-2 px-3">{t("Minor Crime Head")}</th>
                          <th className="py-2 px-3">{t("Statutory Section")}</th>
                          <th className="py-2 px-3 text-right">{t("2025 Reported")}</th>
                          <th className="py-2 px-3 text-right">{t("2024 Reported")}</th>
                          <th className="py-2 px-3 text-right">{t("YoY Shift")}</th>
                          <th className="py-2 px-3 text-right">{t("Disposal Rate (2025 Annual)")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 text-xs">
                        {chap.minorHeads.map((mh) => {
                          const shift = ((mh.reported2025 - mh.reported2024) / mh.reported2024) * 100;
                          return (
                            <tr key={mh.name} className="hover:bg-muted/30">
                              <td className="py-2.5 px-3 font-semibold text-foreground">
                                {t(mh.name)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                {mh.section}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                {mh.reported2025.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                {mh.reported2024.toLocaleString("en-IN")}
                              </td>
                              <td
                                className={`py-2.5 px-3 text-right font-semibold ${
                                  shift > 0 ? "text-brand-red" : "text-brand-green"
                                }`}
                              >
                                {shift > 0 ? "+" : ""}
                                {shift.toFixed(1)}%
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-brand-purple/10 text-brand-purple">
                                  {mh.disposalRate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
