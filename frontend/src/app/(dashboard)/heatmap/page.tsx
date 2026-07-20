"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { districts } from "@/data/crimeData";
import { getRiskTier, getRiskScore, getTopDistricts, getSafestDistricts } from "@/lib/derive";
import { riskTierBg, riskTierColors, type RiskTier } from "@/lib/design-tokens";
import * as motion from "motion/react-client";
import { Map, MapPin, Shield, AlertTriangle } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useLanguage } from "@/components/LanguageContext";
import KarnatakaVectorMap from "./_components/KarnatakaVectorMap";
import { AccidentClusterOverlay } from "./_components/AccidentClusterOverlay";
import { LocationSearchBox, type GeoLocationTarget } from "./_components/LocationSearchBox";

export default function HeatmapPage() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string | null>("Bengaluru City");
  const [targetArea, setTargetArea] = useState<GeoLocationTarget | null>(null);
  const [crimeFilter, setCrimeFilter] = useState<"ALL" | "VIOLENT" | "CYBER" | "NARCOTICS">("ALL");
  const [shiftFilter, setShiftFilter] = useState<"DAY" | "NIGHT">("DAY");

  const [activeDistricts, setActiveDistricts] = useState(districts);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/analytics/districts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setActiveDistricts(data);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const selectedDistrict = activeDistricts.find((d) => d.name === selected) || activeDistricts[0];
  const top5 = getTopDistricts(5, "total", activeDistricts);
  const safest5 = getSafestDistricts(5, activeDistricts);

  const sortedDistricts = [...activeDistricts].sort((a, b) => (b.ipc + b.sll) - (a.ipc + a.sll));

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-brand-green/10 text-brand-green border border-brand-green/20">
              {t("GIS SPATIAL CLUSTER & HOTSPOT TELEMETRY")}
            </span>
            {isLiveConnected && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live DuckDB KSP Telemetry
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2 text-foreground">
            <Map className="h-7 w-7 text-brand-green" /> {t("AI Crime Hotspot Map & GIS Forensics")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("Interactive Karnataka State GIS vector map with shift telemetry & crime category overlays")}</p>
        </div>

        {/* Interactive Filter Control Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
            {[
              { id: "ALL", label: "All Crimes" },
              { id: "VIOLENT", label: "Violent / Dacoity" },
              { id: "CYBER", label: "Cyber & Fraud" },
              { id: "NARCOTICS", label: "NDPS Narcotics" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCrimeFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  crimeFilter === tab.id
                    ? "bg-brand-purple text-white shadow"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShiftFilter(shiftFilter === "DAY" ? "NIGHT" : "DAY")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono border border-border/60 bg-card hover:bg-muted/40 flex items-center gap-1.5 transition-all"
          >
            <span className={`w-2 h-2 rounded-full ${shiftFilter === "NIGHT" ? "bg-brand-purple" : "bg-brand-amber"}`} />
            {shiftFilter === "DAY" ? t("☀️ Day Shift") : t("🌙 Night Patrol")}
          </button>
        </div>
      </motion.div>

      {/* Instant District & Hotspot Search Bar */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-[9999]">
        <LocationSearchBox
          selectedDistrict={selected}
          onSelectDistrict={(name) => {
            setSelected(name);
            setTargetArea(null);
          }}
          onSelectAreaTarget={(target) => setTargetArea(target)}
        />
      </motion.div>

      {/* Real Interactive Karnataka State GIS Vector Map */}
      <KarnatakaVectorMap
        districts={activeDistricts}
        selectedDistrict={selected}
        onSelectDistrict={(name) => {
          setSelected(name);
          setTargetArea(null);
        }}
        crimeFilter={crimeFilter}
        shiftFilter={shiftFilter}
        targetArea={targetArea}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Grid */}
        <Card className="glass-card lg:col-span-2 relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
          <CardHeader className="relative"><CardTitle className="font-heading text-base flex items-center justify-between gap-2">{t("Karnataka Districts — Risk Heatmap")}<span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full border border-brand-purple/20 ml-auto">2025 Annual Baseline</span></CardTitle></CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {sortedDistricts.map((d, i) => {
                const tier = getRiskTier(d);
                const score = getRiskScore(d);
                const isSelected = selected === d.name;
                return (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    key={d.name}
                    onClick={() => {
                      setSelected(d.name);
                      setTargetArea(null);
                    }}
                    className={`relative p-2 rounded-lg border text-center transition-all duration-200 hover:scale-105 hover:shadow-md ${
                      isSelected ? "ring-2 ring-brand-purple scale-105 shadow-md" : ""
                    }`}
                    style={{
                      backgroundColor: `${riskTierColors[tier]}15`,
                      borderColor: `${riskTierColors[tier]}40`,
                    }}
                    title={`${d.name} — ${tier}`}
                  >
                    <MapPin className="h-3 w-3 mx-auto mb-1" style={{ color: riskTierColors[tier] }} />
                    <span className="text-[9px] font-medium leading-tight block truncate">
                      {t(d.name).length > 10 ? t(d.name).slice(0, 10) + "…" : t(d.name)}
                    </span>
                    <span className="text-[8px] font-mono block" style={{ color: riskTierColors[tier] }}>
                      {score}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border justify-center">
              {(["Safe", "Moderate", "High", "Critical"] as RiskTier[]).map((tier) => (
                <div key={tier} className="flex items-center gap-1.5 text-xs">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: riskTierColors[tier] }} />
                  <span>{t(tier)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Panels */}
        <motion.div 
          className="space-y-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Selected District */}
          <Card className="glass-card relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
            <CardHeader className="relative"><CardTitle className="font-heading text-sm flex items-center justify-between gap-2">{t("Selected District")}<span className="text-[10px] font-semibold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full border border-brand-purple/20 ml-auto">2025 Telemetry</span></CardTitle></CardHeader>
            <CardContent className="relative">
              <AnimatePresence mode="wait">
                {selectedDistrict ? (
                  <motion.div 
                    key={selectedDistrict.name}
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <h3 className="font-bold text-lg text-brand-purple">{t(selectedDistrict.name)}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("Range")}</span><span>{t(selectedDistrict.range)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("IPC Cases")}</span><span className="font-mono">{selectedDistrict.ipc.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("SLL Cases")}</span><span className="font-mono">{selectedDistrict.sll.toLocaleString()}</span></div>
                      <div className="flex justify-between pt-2 border-t"><span className="text-muted-foreground font-medium">{t("Total")}</span><span className="font-mono font-bold">{(selectedDistrict.ipc + selectedDistrict.sll).toLocaleString()}</span></div>
                      <div className="flex justify-between items-center pt-2"><span className="text-muted-foreground">{t("Risk Level")}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${riskTierBg[getRiskTier(selectedDistrict)]}`}>{t(getRiskTier(selectedDistrict))}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.p 
                    key="empty"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground text-center py-4"
                  >
                    {t("Click a district on the map")}
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Top Risk */}
          <Card className="glass-card relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
            <CardHeader className="relative"><CardTitle className="font-heading text-sm flex items-center justify-between gap-1"><span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-brand-red" /> {t("Top 5 Risk")}</span><span className="text-[10px] font-semibold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full border border-brand-red/20 ml-auto">2025 Cases</span></CardTitle></CardHeader>
            <CardContent className="space-y-2 relative">
              {top5.map((d, i) => (
                <button key={d.name} onClick={() => setSelected(d.name)} className="flex items-center justify-between w-full text-sm hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-md px-3 py-2 transition-all hover:scale-[1.02]">
                  <span><span className="text-muted-foreground mr-2">{i + 1}.</span>{t(d.name)}</span>
                  <span className="font-mono text-xs text-brand-red font-medium">{(d.ipc + d.sll).toLocaleString()}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Safest */}
          <Card className="glass-card relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
            <CardHeader className="relative"><CardTitle className="font-heading text-sm flex items-center justify-between gap-1"><span className="flex items-center gap-1"><Shield className="h-4 w-4 text-brand-green" /> {t("Safest 5")}</span><span className="text-[10px] font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20 ml-auto">2025 Cases</span></CardTitle></CardHeader>
            <CardContent className="space-y-2 relative">
              {safest5.map((d, i) => (
                <button key={d.name} onClick={() => setSelected(d.name)} className="flex items-center justify-between w-full text-sm hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-md px-3 py-2 transition-all hover:scale-[1.02]">
                  <span><span className="text-muted-foreground mr-2">{i + 1}.</span>{t(d.name)}</span>
                  <span className="font-mono text-xs text-brand-green font-medium">{(d.ipc + d.sll).toLocaleString()}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Road Safety & Highway Accident Cluster Spatial Overlay */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <AccidentClusterOverlay />
      </motion.div>
    </div>
  );
}
