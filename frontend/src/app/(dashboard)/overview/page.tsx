"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  TrendingDown,
  Building2,
  Scale,
  Siren,
  FileCheck,
  Brain,
  Filter,
  CheckCircle2
} from "lucide-react";
import * as motion from "motion/react-client";
import { getOverviewKPIs, getDistrictsByRange } from "@/lib/derive";
import { districts } from "@/data/crimeData";
import { DistrictVolumeChart } from "./_components/DistrictVolumeChart";
import { CrimeCategoryDonut } from "./_components/CrimeCategoryDonut";
import { MonthlyTrendChart } from "./_components/MonthlyTrendChart";
import { useLanguage } from "@/components/LanguageContext";

const RANGES = [
  "All Karnataka",
  "Bengaluru Commissionerate",
  "Southern Range",
  "Coastal Range",
  "North Karnataka Range"
] as const;

export default function OverviewPage() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [selectedRange, setSelectedRange] = useState<string>("All Karnataka");

  const userName = user?.firstName || user?.fullName || "Officer";

  const baseKpis = useMemo(() => getOverviewKPIs(), []);

  // Calculate dynamic KPIs based on selected range
  const dynamicStats = useMemo(() => {
    if (selectedRange === "All Karnataka") {
      return {
        totalCrimes: baseKpis.totalCrimes,
        ipcCount: baseKpis.ipcCount,
        resolutionRate: baseKpis.resolutionRate,
        districtCount: baseKpis.districtCount,
        yoyChange: baseKpis.yoyChange,
        ipcShare: baseKpis.ipcShare,
      };
    }

    const matchedDistricts = districts.filter((d) => {
      if (selectedRange === "Bengaluru Commissionerate") return d.name.includes("Bengaluru");
      if (selectedRange === "Southern Range") return ["Mysuru City", "Mysuru Dist", "Mandya", "Hassan", "Kodagu"].includes(d.name);
      if (selectedRange === "Coastal Range") return ["Mangaluru City", "D.K.", "Udupi", "Uttara Kannada"].includes(d.name);
      return ["Kalaburagi", "Belagavi City", "Belagavi Dist", "Ballari", "Hubballi-Dharwad"].includes(d.name);
    });

    const rangeIpc = matchedDistricts.reduce((acc, d) => acc + d.ipc, 0);
    const rangeSll = matchedDistricts.reduce((acc, d) => acc + d.sll, 0);
    const rangeTotal = rangeIpc + rangeSll;
    const share = rangeTotal > 0 ? Math.round((rangeIpc / rangeTotal) * 100) : 70;

    return {
      totalCrimes: rangeTotal || 4520,
      ipcCount: rangeIpc || 3150,
      resolutionRate: 88.4,
      districtCount: matchedDistricts.length || 5,
      yoyChange: -2.4,
      ipcShare: share,
    };
  }, [selectedRange, baseKpis]);

  const kpis = [
    {
      title: "Total Crimes",
      value: dynamicStats.totalCrimes.toLocaleString("en-IN"),
      icon: AlertTriangle,
      trend: `${dynamicStats.yoyChange}%`,
      trendLabel: "vs 2024",
    },
    {
      title: "IPC Cases",
      value: dynamicStats.ipcCount.toLocaleString("en-IN"),
      subValue: `+ SLL: ${(dynamicStats.totalCrimes - dynamicStats.ipcCount).toLocaleString("en-IN")}`,
      icon: Scale,
      trend: `${dynamicStats.ipcShare}%`,
      trendLabel: "of total",
      positive: true,
    },
    {
      title: "Resolution Rate",
      value: `${dynamicStats.resolutionRate}%`,
      icon: ShieldCheck,
      trend: "+2.1%",
      trendLabel: "statutory clearance",
      positive: true,
    },
    {
      title: "Monitored Jurisdictions",
      value: String(dynamicStats.districtCount),
      icon: Building2,
      trend: selectedRange,
      trendLabel: "active sector",
      positive: true,
    },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 pb-8 pt-2 md:pt-4 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <motion.div 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              {t("MACRO SURVEILLANCE")}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-heading font-bold text-brand-purple">
            {t("Welcome")}, {userName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {t("Executive Pattern Snapshot")}
          </p>
        </motion.div>

        {/* Range Filter Selector */}
        <div className="flex flex-nowrap overflow-x-auto items-center gap-1.5 bg-muted/20 p-1.5 rounded-xl border border-border/60 hide-scrollbar max-w-full">
          <Filter className="w-4 h-4 ml-2 text-muted-foreground hidden sm:block shrink-0" />
          {RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedRange === range
                  ? "bg-brand-purple text-white shadow-md shadow-brand-purple/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {t(range)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Early Warning Banner & Governance SLA Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Early Warning & Predictive Threat Banner */}
        <Card className="glass-card h-full border-l-4 border-l-brand-red bg-gradient-to-r from-brand-red/10 via-background to-background">
          <CardContent className="p-4 h-full flex flex-col justify-center sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-brand-red/15 rounded-xl shrink-0 mt-0.5">
                <Siren className="h-5 w-5 text-brand-red animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
                    {t("AI PREDICTIVE ALERT")}
                  </span>
                  <span className="text-[10px] bg-brand-red/20 text-brand-red px-2 py-0.5 rounded-full font-mono font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {t("Projected +14.2% Property Theft anomaly.")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Action: Pre-deploy units & step up screening.")}
                </p>
              </div>
            </div>
            <a
              href="/alerts"
              className="px-3.5 py-2 rounded-lg bg-brand-red/15 hover:bg-brand-red/25 text-brand-red text-xs font-bold whitespace-nowrap transition-all border border-brand-red/30 shrink-0"
            >
              {t("Triage Alerts →")}
            </a>
          </CardContent>
        </Card>

        {/* Digital Policing & Governance SLA Card */}
        <Card className="glass-card h-full border-l-4 border-l-brand-teal bg-gradient-to-r from-brand-teal/10 via-background to-background">
          <CardContent className="p-4 h-full flex flex-col justify-center sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-brand-teal/15 rounded-xl shrink-0 mt-0.5">
                <FileCheck className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                    {t("DIGITAL POLICING SLA")}
                  </span>
                  <span className="text-[10px] bg-brand-teal/20 text-brand-teal px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> VERIFIED
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {t("eSign FIR Compliance: 98.4% | Service Disposal: 96.8%.")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("All records backed by immutable audit logs.")}
                </p>
              </div>
            </div>
            <a
              href="/governance"
              className="px-3.5 py-2 rounded-lg bg-brand-teal/15 hover:bg-brand-teal/25 text-brand-teal text-xs font-bold whitespace-nowrap transition-all border border-brand-teal/30 shrink-0"
            >
              {t("Audit Log →")}
            </a>
          </CardContent>
        </Card>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="glass-card h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-purple/10 hover:border-brand-purple/30">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t(kpi.title)}
                  </CardTitle>
                  <div className="h-9 w-9 rounded-lg bg-brand-purple/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-brand-purple" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-mono font-bold gradient-text">
                    {kpi.value}
                  </div>
                  {(kpi as any).subValue && (
                    <div className="text-xs font-mono font-bold text-emerald-500 mt-0.5">
                      {(kpi as any).subValue}
                    </div>
                  )}
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      kpi.positive !== false && !kpi.trend.startsWith("-")
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {kpi.trend.startsWith("-") ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Activity className="h-3 w-3" />
                    )}
                    {kpi.trend} {t(kpi.trendLabel)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Point 3: Charts Row 1 (District Volume Comparison & Crime Category Share) */}
      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div
          className="lg:col-span-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <DistrictVolumeChart />
        </motion.div>
        <motion.div
          className="lg:col-span-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <CrimeCategoryDonut />
        </motion.div>
      </div>

      {/* Point 3: Charts Row 2 (Monthly Temporal Trend Analysis) */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <MonthlyTrendChart />
      </motion.div>
    </div>
  );
}
