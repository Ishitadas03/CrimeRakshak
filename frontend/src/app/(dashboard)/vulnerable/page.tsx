"use client";

import { useState, useEffect, useMemo } from "react";
import { sociologicalDetails } from "@/data/sociologicalData";
import { Card, CardContent } from "@/components/ui/card";
import { womenCrimes, childrenCrimes, scstCrimes, ipcCrimes } from "@/data/crimeData";
import * as motion from "motion/react-client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import { brandColors, chartPalette } from "@/lib/design-tokens";
import { ShieldAlert, Baby, Users, Car, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import UrbanSocioCorrelationMatrix from "./_components/UrbanSocioCorrelationMatrix";
import DemographicBreakdownCards from "./_components/DemographicBreakdownCards";
import SocioRiskRadar from "./_components/SocioRiskRadar";

export default function VulnerablePage() {
  const { t } = useLanguage();
  const [liveDetails, setLiveDetails] = useState<any[]>(sociologicalDetails);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/analytics/sociological")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setLiveDetails(data);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const fatalAcc = ipcCrimes.find((c) => c.category === "Fatal Road Accidents");
  const nonFatalAcc = ipcCrimes.find((c) => c.category === "Non-Fatal Road Accidents");

  const womenGroup = liveDetails.find(g => g.category === "Women") || sociologicalDetails[0];
  const childGroup = liveDetails.find(g => g.category === "Children") || sociologicalDetails[1];
  const scstGroup = liveDetails.find(g => g.category === "SC / ST Protection") || sociologicalDetails[2];

  const totalWomen2025 = womenGroup.totalCases;
  const womenChange = womenGroup.yoyChangePct;

  const womenData = womenGroup.subCategories.map((sub: any) => ({
    name: t(sub.name).length > 16 ? t(sub.name).slice(0, 16) + "…" : t(sub.name),
    fullName: sub.name,
    "2024": Math.round(sub.cases / (1 + (womenChange / 100))),
    "2025": sub.cases,
    change: sub.sharePct
  }));

  const childData: { name: string; value: number }[] = childGroup.subCategories.map((sub: any) => ({
    name: t(sub.name),
    value: sub.cases
  }));
  const totalChildren = childGroup.totalCases;

  const scstData: { name: string; value: number }[] = scstGroup.subCategories.map((sub: any) => ({
    name: t(sub.name),
    value: sub.cases
  }));
  const totalScst = scstGroup.totalCases;

  const roadData = [
    { name: t("Fatal Accidents"), value: fatalAcc?.total || 0, color: brandColors.red },
    { name: t("Non-Fatal Accidents"), value: nonFatalAcc?.total || 0, color: brandColors.orange },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 ">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              {t("DEMOGRAPHIC SAFETY ANALYSIS")}
            </span>
            {isLiveConnected && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live DuckDB KSP Telemetry
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-brand-purple">
            {t("Vulnerable Groups Analysis")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("Focused safety metrics for high-risk demographics and road users")}</p>
        </motion.div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { title: t("Women Crimes (2025)"), val: totalWomen2025, icon: ShieldAlert, color: "text-brand-pink", bg: "bg-brand-pink/10", border: "border-l-brand-pink" },
          { title: t("Child Cases"), val: totalChildren, icon: Baby, color: "text-brand-amber", bg: "bg-brand-amber/10", border: "border-l-brand-amber" },
          { title: t("SC/ST Cases"), val: totalScst, icon: Users, color: "text-brand-teal", bg: "bg-brand-teal/10", border: "border-l-brand-teal" },
          { title: t("Road Accidents"), val: (fatalAcc?.total || 0) + (nonFatalAcc?.total || 0), icon: Car, color: "text-brand-red", bg: "bg-brand-red/10", border: "border-l-brand-red" }
        ].map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
            <Card className={`glass-card hover:-translate-y-1 transition-transform border-l-4 ${kpi.border}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-full ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.title}</p>
                  <p className="text-xl font-bold font-mono mt-1">{kpi.val.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Women Safety Analysis */}
      <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-brand-pink/10 flex items-center justify-center"><ShieldAlert className="h-4 w-4 text-brand-pink" /></div>
          <h2 className="font-heading font-bold text-lg">{t("Women Safety — Year over Year")}</h2>
        </div>
        <Card className="glass-card overflow-hidden relative shadow-md">
          <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
             <ShieldAlert className="w-32 h-32 text-brand-pink" />
          </div>
          <CardContent className="p-0">
             <div className="grid lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
               <div className="p-6 flex flex-col justify-center">
                 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-pink/10 text-brand-pink text-xs font-semibold mb-4 w-fit">
                   <Sparkles className="w-3.5 h-3.5" />
                   {t("Key Insight")}
                 </div>
                 <h3 className="text-2xl font-bold font-heading mb-2">{t("Overall Shift")}</h3>
                 <p className="text-muted-foreground text-sm mb-4">
                   {t("Reported cases affecting women have seen an overall shift of")} <span className="font-bold text-foreground">{Math.abs(womenChange).toFixed(1)}%</span> {t("between 2024 and 2025.")} 
                 </p>
                 <div className="flex items-end gap-2">
                   <span className="text-4xl font-mono font-bold">{totalWomen2025.toLocaleString()}</span>
                   <span className={`flex items-center gap-1 text-sm font-semibold mb-1 ${womenChange > 0 ? "text-brand-red" : "text-brand-green"}`}>
                     {womenChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                     {womenChange > 0 ? "+" : ""}{womenChange.toFixed(1)}%
                   </span>
                 </div>
               </div>
               <div className="p-6 lg:col-span-3 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={womenData} margin={{ left: -10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="color24" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={brandColors.violet} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={brandColors.violet} stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="color25" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={brandColors.pink} stopOpacity={1}/>
                          <stop offset="95%" stopColor={brandColors.pink} stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} angle={-25} textAnchor="end" height={40} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)", color: "var(--foreground)", padding: "12px" }} itemStyle={{ color: "var(--foreground)", fontWeight: 500, fontSize: "13px" }} 
                        cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "13px" }} />
                      <Bar dataKey="2024" fill="url(#color24)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                      <Bar dataKey="2025" fill="url(#color25)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
             </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Children + SC/ST */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-brand-amber/10 flex items-center justify-center"><Baby className="h-4 w-4 text-brand-amber" /></div>
            <h2 className="font-heading font-bold text-lg">{t("Children Safety")}</h2>
          </div>
          <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
                      </filter>
                    </defs>
                    <Pie 
                      data={childData} dataKey="value" nameKey="name" 
                      cx="50%" cy="50%" innerRadius={70} outerRadius={100} 
                      paddingAngle={3} animationDuration={1000}
                      style={{ filter: "url(#pieShadow)" }}
                    >
                      {childData.map((_, i) => <Cell key={i} fill={chartPalette[i % chartPalette.length]} stroke="var(--card)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)", color: "var(--foreground)", padding: "12px" }} itemStyle={{ color: "var(--foreground)", fontWeight: 500, fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">{t("Total")}</span>
                  <span className="text-2xl font-bold font-mono text-brand-amber">{totalChildren.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                {childData.slice(0, 4).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartPalette[i % chartPalette.length] }} />
                    <span className="truncate flex-1 text-muted-foreground">{item.name}</span>
                    <span className="font-mono font-medium">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-brand-teal/10 flex items-center justify-center"><Users className="h-4 w-4 text-brand-teal" /></div>
            <h2 className="font-heading font-bold text-lg">{t("SC/ST Safety")}</h2>
          </div>
          <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={scstData} dataKey="value" nameKey="name" 
                      cx="50%" cy="50%" innerRadius={70} outerRadius={100} 
                      paddingAngle={3} animationDuration={1000}
                      style={{ filter: "url(#pieShadow)" }}
                    >
                      {scstData.map((_, i) => <Cell key={i} fill={chartPalette[(i + 4) % chartPalette.length]} stroke="var(--card)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)", color: "var(--foreground)", padding: "12px" }} itemStyle={{ color: "var(--foreground)", fontWeight: 500, fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">{t("Total")}</span>
                  <span className="text-2xl font-bold font-mono text-brand-teal">{totalScst.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {scstData.slice(0, 4).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartPalette[(i + 4) % chartPalette.length] }} />
                    <span className="truncate flex-1 text-muted-foreground">{item.name}</span>
                    <span className="font-mono font-medium">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Road Safety */}
      <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-brand-red/10 flex items-center justify-center"><Car className="h-4 w-4 text-brand-red" /></div>
          <h2 className="font-heading font-bold text-lg">{t("Road Accident Safety")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {roadData.map((item, i) => (
            <Card key={item.name} className="glass-card hover:-translate-y-1 transition-transform relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: item.color }} />
              <CardContent className="pt-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <div className="p-2 rounded-lg bg-muted/50" style={{ color: item.color }}>
                    <Car className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-4xl font-mono font-bold tracking-tight">{item.value.toLocaleString()}</p>
                  <span className="text-sm text-muted-foreground">{t("incidents")}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / ((fatalAcc?.total || 1) + (nonFatalAcc?.total || 1))) * 100}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* ─── Feature 4: Sociological Crime Insights & Demographic Analysis ─── */}

      {/* Urbanization & District Socio-Geographic Crime Matrix */}
      <UrbanSocioCorrelationMatrix />

      {/* Granular Demographic Sub-Head Breakdown & Risk Drivers */}
      <DemographicBreakdownCards details={liveDetails} />

      {/* District Multi-Factor Sociological Radar & Public Health Correlations */}
      <SocioRiskRadar />
    </div>
  );
}
