"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { districtHotspots, getDistrictRisk, type DistrictHotspot } from "@/data/trendAnalyticsData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import { MapPin, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { riskTierBg } from "@/lib/design-tokens";

type SortKey = "district" | "murder" | "robbery" | "burglaryDay" | "burglaryNight" | "theft" | "cyberCrime" | "ndps" | "total";

const columns: { key: SortKey; label: string; hideOnMobile?: boolean }[] = [
  { key: "district", label: "District" },
  { key: "murder", label: "Murder" },
  { key: "robbery", label: "Robbery" },
  { key: "burglaryNight", label: "Burglary", hideOnMobile: true },
  { key: "theft", label: "Theft" },
  { key: "cyberCrime", label: "Cyber" },
  { key: "ndps", label: "NDPS", hideOnMobile: true },
  { key: "total", label: "Total (Jan 2026)" },
];

export default function DistrictHotspotTable({ hotspots = districtHotspots }: { hotspots?: DistrictHotspot[] }) {
  const { t } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...hotspots].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [hotspots, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const maxTotal = Math.max(...hotspots.map((d) => d.total));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <Card className="glass-card hover:!transform-none">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-heading text-base flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-blue" />
              {t("District Crime Hotspot Ranking")}
            </div>
            <span className="text-xs font-semibold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-full border border-brand-blue/20 ml-auto">
              {t("Jan 2026 Monthly Ranking — 37 Districts")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20 text-muted-foreground border-b border-border/50">
                  <th className="text-center py-3 px-2 font-medium w-8">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-3 px-3 font-medium cursor-pointer hover:text-foreground transition-colors select-none ${col.key === "district" ? "text-left min-w-[160px]" : "text-right min-w-[70px]"} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {t(col.label)}
                        {sortKey === col.key ? (
                          sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="text-center py-3 px-3 font-medium min-w-[80px]">{t("Risk")}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((district, idx) => {
                  const risk = getDistrictRisk(district.total);
                  const isTop5 = idx < 5;
                  return (
                    <tr
                      key={district.district}
                      className={`border-b border-border/30 hover:bg-muted/10 transition-colors last:border-0 ${isTop5 ? "bg-red-500/[0.03]" : ""}`}
                    >
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${isTop5 ? "bg-red-500/15 text-red-400" : "text-muted-foreground"}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px]">{t(district.district)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">{district.murder}</td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">{district.robbery}</td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground hidden md:table-cell">{district.burglaryDay + district.burglaryNight}</td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">{district.theft}</td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">{district.cyberCrime}</td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground hidden md:table-cell">{district.ndps}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${risk === "Critical" ? "bg-red-500" : risk === "High" ? "bg-orange-500" : risk === "Moderate" ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${(district.total / maxTotal) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-foreground">{district.total.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskTierBg[risk]}`}>
                          {t(risk)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
