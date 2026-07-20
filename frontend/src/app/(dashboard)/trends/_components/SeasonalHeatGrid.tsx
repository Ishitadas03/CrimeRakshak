"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthlyTrendsTotals, type MonthlyTrendRow } from "@/data/trendAnalyticsData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import { TrendingUp, TrendingDown, Minus, Flame } from "lucide-react";

const trendIcon = (trend: MonthlyTrendRow["trend"]) => {
  switch (trend) {
    case "surging": return <Flame className="w-3.5 h-3.5" />;
    case "rising": return <TrendingUp className="w-3.5 h-3.5" />;
    case "stable": return <Minus className="w-3.5 h-3.5" />;
    case "declining": return <TrendingDown className="w-3.5 h-3.5" />;
    case "dropping": return <TrendingDown className="w-3.5 h-3.5" />;
  }
};

const trendColor = (trend: MonthlyTrendRow["trend"]) => {
  switch (trend) {
    case "surging": return "text-red-500 bg-red-500/10 border-red-500/20";
    case "rising": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "stable": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "declining": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "dropping": return "text-emerald-600 bg-emerald-600/10 border-emerald-600/20";
  }
};

function heatColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  if (ratio > 0.7) return "bg-red-500/20 text-red-400";
  if (ratio > 0.4) return "bg-amber-500/15 text-amber-400";
  if (ratio > 0.15) return "bg-blue-500/10 text-blue-400";
  return "bg-emerald-500/10 text-emerald-400";
}

export default function SeasonalHeatGrid() {
  const { t } = useLanguage();

  const maxValue = Math.max(
    ...monthlyTrendsTotals.flatMap((r) => [r.jan2025, r.dec2025, r.jan2026])
  );

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="glass-card hover:!transform-none">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-heading text-base flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-brand-red" />
              {t("Seasonal Crime Heat Grid")}
            </div>
            <span className="text-xs font-semibold text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20 ml-auto">
              Jan 2025 → Jan 2026 Grid
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20 text-muted-foreground border-b border-border/50">
                  <th className="text-left py-3 px-4 font-medium min-w-[180px]">{t("Crime Head")}</th>
                  <th className="text-center py-3 px-3 font-medium min-w-[100px]">{t("Jan 2025")}</th>
                  <th className="text-center py-3 px-3 font-medium min-w-[100px]">{t("Dec 2025")}</th>
                  <th className="text-center py-3 px-3 font-medium min-w-[100px]">{t("Jan 2026")}</th>
                  <th className="text-center py-3 px-3 font-medium min-w-[90px]">{t("MoM (Dec→Jan)")}</th>
                  <th className="text-center py-3 px-3 font-medium min-w-[90px]">{t("YoY (Jan vs Jan)")}</th>
                  <th className="text-center py-3 px-3 font-medium min-w-[90px]">{t("Trend")}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrendsTotals.map((row, idx) => (
                  <motion.tr
                    key={row.crimeHead + "-" + row.category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.03 }}
                    className="border-b border-border/30 hover:bg-muted/10 transition-colors last:border-0"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[200px]">{t(row.category)}</span>
                        {row.category !== row.crimeHead && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t(row.crimeHead)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-md font-mono text-xs ${heatColor(row.jan2025, maxValue)}`}>
                        {row.jan2025.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-md font-mono text-xs ${heatColor(row.dec2025, maxValue)}`}>
                        {row.dec2025.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-md font-mono text-xs font-bold ${heatColor(row.jan2026, maxValue)}`}>
                        {row.jan2026.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold ${row.momChange > 0 ? "text-red-400" : row.momChange < 0 ? "text-emerald-400" : "text-blue-400"}`}>
                        {row.momChange > 0 ? "+" : ""}{row.momChange}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold ${row.yoyChange > 0 ? "text-red-400" : row.yoyChange < 0 ? "text-emerald-400" : "text-blue-400"}`}>
                        {row.yoyChange > 0 ? "+" : ""}{row.yoyChange}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${trendColor(row.trend)}`}>
                        {trendIcon(row.trend)}
                        {t(row.trend.charAt(0).toUpperCase() + row.trend.slice(1))}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
