"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthlyComparison } from "@/data/crimeData";
import { getMonthOverMonthChange } from "@/lib/derive";
import * as motion from "motion/react-client";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, AreaChart, Area, Cell
} from "recharts";
import { brandColors, chartPalette } from "@/lib/design-tokens";
import { TrendingUp, TrendingDown, Sparkles, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import SeasonalHeatGrid from "./_components/SeasonalHeatGrid";
import DistrictHotspotTable from "./_components/DistrictHotspotTable";
import EmergingClusterAlerts from "./_components/EmergingClusterAlerts";
import CrimeCategoryBreakdown from "./_components/CrimeCategoryBreakdown";
import { DecadalLongitudinalChart } from "./_components/DecadalLongitudinalChart";

export default function TrendsPage() {
  const { t } = useLanguage();
  const [liveHotspots, setLiveHotspots] = useState<any[] | undefined>(undefined);
  const [liveDecadal, setLiveDecadal] = useState<any[] | undefined>(undefined);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/analytics/hotspots")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setLiveHotspots(data);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {});

    fetch("/api/analytics/trends/yearly")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setLiveDecadal(data);
        }
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  const lineData = monthlyComparison.map((r) => ({
    name: t(r.crime).length > 12 ? t(r.crime).slice(0, 12) + "…" : t(r.crime),
    "YTD Total": r.ytd,
    "Current Month": r.currentMonth,
    "Previous Month": r.prevMonth,
  }));

  const surges = monthlyComparison
    .map((r) => ({ crime: r.crime, change: getMonthOverMonthChange(r.crime), current: r.currentMonth, prev: r.prevMonth }))
    .sort((a, b) => b.change - a.change);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              {t("LONGITUDINAL TEMPORAL & SEASONAL PATTERN ANALYTICS")}
            </span>
            {isLiveConnected && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live DuckDB KSP Telemetry
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-brand-purple">
            {t("Trend Analysis")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("Monthly, seasonal & decadal crime trend trajectories across Karnataka")}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="glass-card hover:bg-brand-blue/10 border-brand-blue/20">
            <Calendar className="w-4 h-4 mr-2 text-brand-blue" />
            {t("Last 30 Days")}
          </Button>
          <Button variant="outline" size="sm" className="glass-card hover:bg-brand-purple/10 border-brand-purple/20">
            <Filter className="w-4 h-4 mr-2 text-brand-purple" />
            {t("Filters")}
          </Button>
        </motion.div>
      </div>

      {/* AI Insights Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-brand-purple/30 bg-gradient-to-r from-brand-purple/5 to-transparent relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple" />
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="p-3 bg-brand-purple/10 rounded-full shrink-0">
              <Sparkles className="h-6 w-6 text-brand-purple" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">{t("AI Trend Summary")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold text-brand-red">{t("NDPS Cases")}</span> {t("surged +53.7% (909 → 1,397) and")} <span className="font-semibold text-brand-amber">{t("SLL Cases")}</span> {t("rose +2.6% month-over-month. However,")} <span className="font-semibold text-brand-green">{t("POCSO")}</span> {t("cases dropped 28.2% and")} <span className="font-semibold text-brand-green">{t("Economic Offences")}</span> {t("declined 33.8%. Recommend intensified NDPS enforcement in urban corridors.")}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 25-Year Longitudinal Decadal Forecasting & Telemetry */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DecadalLongitudinalChart series={liveDecadal} />
      </motion.div>

      {/* Peak Season Callouts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {surges.slice(0, 3).map((s, i) => (
          <motion.div key={s.crime} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}>
            <Card className="glass-card hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-full h-1 ${s.change > 10 ? "bg-brand-red" : s.change > 0 ? "bg-brand-amber" : "bg-brand-green"}`} />
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: s.change > 10 ? brandColors.red : s.change > 0 ? brandColors.amber : brandColors.green }} />
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("Highest Surges")}</p>
                    <p className="font-heading font-bold text-lg mt-1 truncate max-w-[150px] sm:max-w-full" title={t(s.crime)}>{t(s.crime)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-foreground font-medium">{s.prev.toLocaleString()}</span> to <span className="text-foreground font-medium">{s.current.toLocaleString()}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 font-mono text-sm px-2 py-1 rounded-md border ${
                    s.change > 10 ? "text-brand-red border-brand-red/30 bg-brand-red/10" : 
                    s.change > 0 ? "text-brand-amber border-brand-amber/30 bg-brand-amber/10" : 
                    "text-brand-green border-brand-green/30 bg-brand-green/10"
                  }`}>
                    {s.change > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {s.change > 0 ? "+" : ""}{s.change}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* YTD Area Chart */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="h-full">
          <Card className="glass-card hover:!transform-none h-full flex flex-col">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center justify-between">
                <span>{t("Month-over-Month Shift")}</span>
                <span className="text-xs font-semibold text-brand-yellow bg-brand-yellow/10 px-2.5 py-0.5 rounded-full border border-brand-yellow/20">Nov 2025 vs Dec 2025</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData} margin={{ left: -20, top: 10, right: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brandColors.customYellow} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={brandColors.customYellow} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCurr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brandColors.customRed} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={brandColors.customRed} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} angle={-30} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)", color: "var(--foreground)", padding: "12px" }} 
                      itemStyle={{ color: "var(--foreground)", fontWeight: 500, fontSize: "13px" }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" name={t("Previous Month")} dataKey="Previous Month" stroke={brandColors.customYellow} fillOpacity={1} fill="url(#colorPrev)" strokeWidth={2} />
                    <Area type="monotone" name={t("Current Month")} dataKey="Current Month" stroke={brandColors.customRed} fillOpacity={1} fill="url(#colorCurr)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Volume Bar Chart */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="h-full">
          <Card className="glass-card hover:!transform-none h-full flex flex-col">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center justify-between">
                <span>{t("Year-to-Date Volume")}</span>
                <span className="text-xs font-semibold text-brand-red bg-brand-red/10 px-2.5 py-0.5 rounded-full border border-brand-red/20">2025 Cumulative YTD</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineData} margin={{ left: -10, top: 10, right: 10, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={90} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)", color: "var(--foreground)", padding: "12px" }} itemStyle={{ color: "var(--foreground)", fontWeight: 500, fontSize: "13px" }} 
                      cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                    />
                    <Bar dataKey="YTD Total" name={t("YTD Total")} radius={[0, 4, 4, 0]} barSize={16}>
                      {
                        lineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Full MoM table */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
        <Card className="glass-card hover:!transform-none">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-heading text-base flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-purple" />
                {t("Detailed Metric Changes")}
              </div>
              <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full border border-brand-purple/20 ml-auto">Nov 2025 → Dec 2025 Audit</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/20 text-muted-foreground border-b border-border/50">
                    <th className="text-left py-4 px-6 font-medium">{t("Crime Category")}</th>
                    <th className="text-right py-4 px-6 font-medium">{t("Previous Month (Nov 2025)")}</th>
                    <th className="text-right py-4 px-6 font-medium">{t("Current Month (Dec 2025)")}</th>
                    <th className="text-right py-4 px-6 font-medium">{t("Trend Indicator")}</th>
                    <th className="text-right py-4 px-6 font-medium">{t("Change")}</th>
                  </tr>
                </thead>
                <tbody>
                  {surges.map((s, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + idx * 0.05 }}
                      key={s.crime} 
                      className="border-b border-border/30 hover:bg-muted/10 transition-colors last:border-0"
                    >
                      <td className="py-4 px-6 font-medium text-foreground">{t(s.crime)}</td>
                      <td className="py-4 px-6 text-right font-mono text-muted-foreground">{s.prev.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-mono text-foreground">{s.current.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden ml-auto flex items-center">
                          <div 
                            className={`h-full rounded-full ${s.change > 0 ? "bg-brand-red" : "bg-brand-green"}`} 
                            style={{ width: `${Math.min(Math.abs(s.change) * 2, 100)}%` }} 
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center gap-1 font-mono font-semibold px-2 py-1 rounded-md border ${
                          s.change > 10 ? "text-brand-red border-brand-red/20 bg-brand-red/5" : 
                          s.change > 0 ? "text-brand-amber border-brand-amber/20 bg-brand-amber/5" : 
                          "text-brand-green border-brand-green/20 bg-brand-green/5"
                        }`}>
                          {s.change > 0 ? "+" : ""}{s.change}%
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

      {/* ─── Feature 3: Crime Pattern & Trend Analytics ─── */}

      {/* Seasonal Crime Heat Grid */}
      <SeasonalHeatGrid />

      {/* Emerging Crime Cluster Alerts */}
      <EmergingClusterAlerts />

      {/* District Crime Hotspot Ranking */}
      <DistrictHotspotTable hotspots={liveHotspots} />

      {/* Crime Category Composition */}
      <CrimeCategoryBreakdown />
    </div>
  );
}
