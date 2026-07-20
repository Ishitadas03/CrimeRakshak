"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  crimeCategoryGroups,
  crimeCompositionByYear,
  availableCompositionYears,
  type CompositionYear,
} from "@/data/trendAnalyticsData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";
import { Layers, Calendar } from "lucide-react";

export default function CrimeCategoryBreakdown() {
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<CompositionYear>(2026);

  const activeGroups = crimeCompositionByYear[selectedYear] || crimeCategoryGroups;
  const totalAll = activeGroups.reduce((sum, g) => sum + g.total, 0);

  const radarData = activeGroups.map((g) => ({
    category: t(g.name),
    value: g.total,
    fullMark: Math.max(...activeGroups.map((x) => x.total)),
  }));

  const barData = activeGroups
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((g) => ({
      name: t(g.name),
      value: g.total,
      color: g.color,
      pct: totalAll > 0 ? Math.round((g.total / totalAll) * 100) : 0,
    }));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.3 }}
      className="space-y-4"
    >
      {/* Multi-Year Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-purple/10 border border-brand-purple/30 text-brand-purple">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              {t("Historical Multi-Year Crime Composition")}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {t("Select telemetry year to dynamically filter radar distribution and category breakdown")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/40">
          {availableCompositionYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedYear === yr
                  ? "bg-brand-purple text-white shadow-md shadow-brand-purple/25 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              {yr === 2026 ? "2026 (YTD)" : yr}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <Card className="glass-card hover:!transform-none">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-purple" />
              {t("Crime Composition Radar")}
              <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full border border-brand-purple/20 ml-auto">
                {selectedYear === 2026 ? t("Jan 2026 (YTD)") : `${selectedYear} ${t("Annual")}`}
              </span>
            </CardTitle>
            {/* Embedded Year Selection Buttons directly inside Radar Card Header */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-purple" /> {t("Select Year")}:
              </span>
              {availableCompositionYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    selectedYear === yr
                      ? "bg-brand-purple text-white shadow-sm scale-105"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {yr === 2026 ? "2026 (YTD)" : yr}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <PolarRadiusAxis
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                  />
                  <Radar
                    name={t("Cases")}
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Composition Bar Chart + Detail Cards */}
        <Card className="glass-card hover:!transform-none">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-blue" />
              {t("Category Volume & Share")}
              <span className="text-xs font-semibold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-full border border-brand-blue/20 ml-auto">
                {totalAll.toLocaleString("en-IN")} {t("total cases")}
              </span>
            </CardTitle>
            {/* Embedded Year Selection Buttons directly inside Bar Card Header */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-blue" /> {t("Select Year")}:
              </span>
              {availableCompositionYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    selectedYear === yr
                      ? "bg-brand-blue text-white shadow-sm scale-105"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {yr === 2026 ? "2026 (YTD)" : yr}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                      color: "var(--foreground)",
                      padding: "10px",
                    }}
                    formatter={(value) => [Number(value).toLocaleString("en-IN") + " cases", ""]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sub-crime detail chips */}
            <div className="space-y-3">
              {activeGroups.map((group) => (
                <div key={group.name} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: group.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{t(group.name)}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {group.total.toLocaleString("en-IN")} ({totalAll > 0 ? Math.round((group.total / totalAll) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {group.crimes.map((c) => (
                        <span
                          key={c.name}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground"
                        >
                          {t(c.name)}: {c.value.toLocaleString("en-IN")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
