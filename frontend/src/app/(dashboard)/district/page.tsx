"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { districts } from "@/data/crimeData";
import { getRanges, getDistrictsByRange, getRiskTier, getRangeTotals } from "@/lib/derive";
import { riskTierBg } from "@/lib/design-tokens";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { brandColors, chartPalette } from "@/lib/design-tokens";
import { Search, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { SllEnforcementBenchmark } from "./_components/SllEnforcementBenchmark";

export default function DistrictPage() {
  const { t } = useLanguage();
  const ranges = getRanges();
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "ipc" | "sll" | "total">("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = selectedRange ? getDistrictsByRange(selectedRange) : [...districts];
    if (search) {
      list = list.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    list.sort((a, b) => {
      const aVal = sortKey === "total" ? a.ipc + a.sll : sortKey === "name" ? 0 : a[sortKey];
      const bVal = sortKey === "total" ? b.ipc + b.sll : sortKey === "name" ? 0 : b[sortKey];
      if (sortKey === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [selectedRange, search, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const stackedData = filtered.slice(0, 15).map((d) => ({
    name: t(d.name).length > 14 ? t(d.name).slice(0, 14) + "…" : t(d.name),
    IPC: d.ipc, SLL: d.sll,
  }));

  const rangeTotals = getRangeTotals();

  return (
    <div className="px-4 md:px-6 lg:px-8 pb-8 pt-2 md:pt-4 space-y-6 ">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
            {t("GRANULAR JURISDICTION & RANGE DECOMPOSITION")}
          </span>
        </div>
        <h1 className="text-2xl md:text-4xl font-heading font-bold text-brand-purple">
          {t("District Analysis")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">{t("IPC vs SLL breakdown by district and police range across Karnataka")}</p>
      </motion.div>

      {/* Range Filters */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={selectedRange === null ? "default" : "outline"} onClick={() => setSelectedRange(null)}>{t("All Ranges")}</Button>
        {ranges.map((r) => (
          <Button key={r} size="sm" variant={selectedRange === r ? "default" : "outline"} onClick={() => setSelectedRange(r)}>{t(r)}</Button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="glass-card lg:col-span-3 relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
          <CardHeader className="relative"><CardTitle className="font-heading text-base flex items-center justify-between gap-2">{t("IPC vs SLL by District")}<span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full border border-brand-purple/20 ml-auto">2025 Annual Baseline</span></CardTitle></CardHeader>
          <CardContent className="relative">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stackedData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} angle={-35} textAnchor="end" height={65} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.75)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.7)",
                      borderRadius: "16px",
                      boxShadow: "0 8px 30px rgba(80, 140, 255, 0.08)",
                      color: "#0f172a",
                    }}
                    itemStyle={{ color: "#0f172a", fontWeight: 500 }}
                    cursor={{ fill: "rgba(143, 211, 255, 0.1)" }}
                  />
                  <Legend />
                  <Line type="natural" name={t("IPC")} dataKey="IPC" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={1500} animationEasing="ease-out" />
                  <Line type="natural" name={t("SLL")} dataKey="SLL" stroke="var(--chart-2)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={1500} animationEasing="ease-out" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card lg:col-span-2 relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
          <CardHeader className="relative"><CardTitle className="font-heading text-base flex items-center justify-between gap-2">{t("Range Share")}<span className="text-xs font-semibold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-full border border-brand-blue/20 ml-auto">2025 Volume Distribution</span></CardTitle></CardHeader>
          <CardContent className="relative">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="pieShadowRange" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
                    </filter>
                  </defs>
                  <Pie data={rangeTotals} dataKey="total" nameKey="range" cx="50%" cy="45%" outerRadius={90} label={({ range }: any) => range && t(range).length > 10 ? t(range).slice(0,10) + "…" : t(range)} labelLine={false} animationDuration={1500} animationEasing="ease-out" style={{ filter: "url(#pieShadowRange)" }}>
                    {rangeTotals.map((_, i) => <Cell key={i} fill={chartPalette[i % chartPalette.length]} stroke="rgba(255, 255, 255, 0.8)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.75)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.7)",
                      borderRadius: "16px",
                      boxShadow: "0 8px 30px rgba(80, 140, 255, 0.08)",
                      color: "#0f172a",
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "#0f172a", fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COTPA & SLL Proactive Enforcement Index */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SllEnforcementBenchmark />
      </motion.div>

      {/* Table */}
      <Card className="glass-card relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative">
          <CardTitle className="font-heading text-base flex items-center gap-2">{t("District Table")}<span className="text-xs font-semibold text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full border border-brand-teal/20 ml-2">2025 Annual Telemetry</span></CardTitle>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("Search districts, crimes…")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto relative min-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {([["name",t("District")],["ipc",t("IPC")],["sll",t("SLL")],["total",t("Total")]] as const).map(([key, label]) => (
                  <th key={key} className="text-left py-3 px-2 cursor-pointer hover:text-foreground" onClick={() => toggleSort(key as typeof sortKey)}>
                    <span className="flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                ))}
                <th className="text-left py-3 px-2">{t("Range")}</th>
                <th className="text-left py-3 px-2">{t("Risk")}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((d) => {
                  const tier = getRiskTier(d);
                  return (
                    <motion.tr 
                      key={d.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 px-2 font-medium">{t(d.name)}</td>
                      <td className="py-2.5 px-2 font-mono text-sm">{d.ipc.toLocaleString()}</td>
                      <td className="py-2.5 px-2 font-mono text-sm">{d.sll.toLocaleString()}</td>
                      <td className="py-2.5 px-2 font-mono font-semibold">{(d.ipc + d.sll).toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{t(d.range)}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${riskTierBg[tier]}`}>{t(tier)}</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
