"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ipcCrimes, stateTotals } from "@/data/crimeData";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { brandColors, chartPalette } from "@/lib/design-tokens";
import { ChevronRight, PieChart as PieChartIcon, BarChart2, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { StatutoryHeadDrillDown } from "./_components/StatutoryHeadDrillDown";

export default function CrimeTypesPage() {
  const { t } = useLanguage();
  const sorted = useMemo(() => [...ipcCrimes].sort((a, b) => b.total - a.total), []);
  const [selected, setSelected] = useState<string | null>(sorted[0]?.category || null);
  
  const selectedCat = sorted.find((c) => c.category === selected);

  const data = sorted.map((c) => ({
    name: t(c.category).length > 18 ? t(c.category).slice(0, 18) + "…" : t(c.category),
    fullName: c.category,
    value: c.total,
  }));

  const topCategory = sorted[0];

  return (
    <div className="px-4 md:px-6 lg:px-8 pb-8 pt-2 md:pt-4 space-y-6 ">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              {t("STATUTORY TYPOLOGY & MODUS OPERANDI ANALYTICS")}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-brand-purple">
            {t("Crime Categories")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("Detailed breakdown of IPC crime classifications & operational subcategories")}</p>
        </motion.div>

        {/* Quick Category Drill-down Presets */}
        <div className="flex flex-wrap gap-1.5 bg-muted/20 p-1 rounded-xl border border-border/50">
          {[
            "Theft",
            "Cyber Crime",
            "NDPS",
            "Robbery"
          ].map((catName) => (
            <button
              key={catName}
              onClick={() => {
                const found = sorted.find((s) => s.category.toLowerCase().includes(catName.toLowerCase()));
                if (found) setSelected(found.category);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selected?.toLowerCase().includes(catName.toLowerCase())
                  ? "bg-brand-purple text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {t(catName)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card hover:-translate-y-1 transition-transform border-l-4 border-l-brand-teal">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-brand-teal/10 rounded-full text-brand-teal">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{t("Total IPC Crimes")}</p>
                <p className="text-2xl font-bold font-mono mt-1">{stateTotals.ipc.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card hover:-translate-y-1 transition-transform border-l-4 border-l-brand-purple">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-brand-purple/10 rounded-full text-brand-purple">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{t("Top Category")}</p>
                <p className="text-xl font-bold mt-1 truncate" title={topCategory ? t(topCategory.category) : ""}>{topCategory ? t(topCategory.category) : ""}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card hover:-translate-y-1 transition-transform border-l-4 border-l-brand-cyan">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-brand-cyan/10 rounded-full text-brand-cyan">
                <PieChartIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{t("Categories Monitored")}</p>
                <p className="text-2xl font-bold font-mono mt-1">{sorted.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Categories Bar Chart */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-3">
          <Card className="glass-card h-full relative overflow-hidden transition-all duration-300 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
            <CardHeader className="relative border-b border-border/50 pb-4">
              <CardTitle className="font-heading text-base flex items-center justify-between">
                <span>{t("Top Crime Categories")}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full border border-brand-purple/20">2024 Annual Baseline</span>
                  <span className="text-xs font-normal text-muted-foreground">{t("Click to drill down")}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-4">
              <div className="h-[550px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <defs>
                      <linearGradient id="colorSelected" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={brandColors.customRed} stopOpacity={1}/>
                        <stop offset="100%" stopColor={brandColors.customYellow} stopOpacity={1}/>
                      </linearGradient>
                      <linearGradient id="colorNormal" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--muted)" stopOpacity={0.5}/>
                        <stop offset="100%" stopColor="var(--muted)" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} vertical={true} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: "var(--muted)", opacity: 0.15 }} 
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
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      animationDuration={1000}
                      onClick={(data: any) => data?.fullName && setSelected(data.fullName)}
                      barSize={20}
                    >
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={selected === entry.fullName ? "url(#colorSelected)" : chartPalette[index % chartPalette.length]} 
                          opacity={selected === entry.fullName ? 1 : 0.4}
                          className="transition-all duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Breakdown Panel */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card className="glass-card flex flex-col h-full relative overflow-hidden transition-all duration-300 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-bl from-brand-teal/5 to-transparent pointer-events-none" />
            <CardHeader className="relative border-b border-border/50 pb-4">
              <CardTitle className="font-heading text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-brand-teal" />
                  {selectedCat ? `${t(selectedCat.category)} ${t("Breakdown")}` : t("Category Breakdown")}
                </div>
                <span className="text-xs font-semibold text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full border border-brand-teal/20 ml-auto">2024 Sub-Head Volume</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative flex-1 pt-6">
              <AnimatePresence mode="wait">
                {selectedCat?.subcats ? (
                  <motion.div 
                    key={selectedCat.category}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div className="h-[250px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <filter id="pieShadowCat" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
                            </filter>
                          </defs>
                          <Pie
                            data={selectedCat.subcats.map((s) => ({ name: t(s.name), value: s.val }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={2}
                            animationDuration={1000}
                            style={{ filter: "url(#pieShadowCat)" }}
                          >
                            {selectedCat.subcats.map((_, i) => (
                              <Cell key={i} fill={chartPalette[i % chartPalette.length]} stroke="rgba(255, 255, 255, 0.8)" strokeWidth={2} />
                            ))}
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
                      {/* Center Total */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("Total")}</span>
                        <span className="text-2xl font-bold font-mono text-foreground">{selectedCat.total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Detailed List */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground flex items-center justify-between">
                        <span>{t("Subcategories")}</span>
                        <span className="text-xs text-muted-foreground font-normal bg-muted/30 px-2 py-0.5 rounded">{t("Sorted by volume")}</span>
                      </h4>
                      <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-hide">
                        {/* Sort subcategories before mapping */}
                        {[...selectedCat.subcats].sort((a, b) => b.val - a.val).map((sub, i) => {
                          const percent = ((sub.val / selectedCat.total) * 100).toFixed(1);
                          return (
                            <div key={sub.name} className="space-y-1.5 group">
                              <div className="flex justify-between text-sm items-center">
                                <span className="font-medium text-foreground group-hover:text-brand-teal transition-colors flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartPalette[i % chartPalette.length] }} />
                                  {t(sub.name)}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-foreground font-semibold">{sub.val.toLocaleString()}</span>
                                  <span className="text-xs font-mono text-muted-foreground w-10 text-right">{percent}%</span>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: chartPalette[i % chartPalette.length] }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                      <ChevronRight className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-center font-medium">{selected ? t("No subcategory data available") : t("Select a category on the left")}</p>
                    <p className="text-center text-xs mt-1">{t("Click any bar to see detailed breakdown")}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Major vs Minor Statutory Head Drill-Down Matrix (Positioned at the bottom) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <StatutoryHeadDrillDown />
      </motion.div>
    </div>
  );
}

