"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { districts, ipcCrimes } from "@/data/crimeData";
import { runPrediction, type PredictionResult } from "@/lib/predict";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  Brain, AlertTriangle, Target, BarChart3, Activity, Calendar, Zap, Sparkles,
  Loader2, Cpu, Network, CloudLightning, Crosshair, MapPin, ShieldAlert,
  ShieldCheck, Server, Eye, Terminal, ChevronRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { brandColors } from "@/lib/design-tokens";
import { useLanguage } from "@/components/LanguageContext";

// ─── Simulation Terminal Logs ────────────────────────────────────────

const simLogs = [
  "INITIALIZING PREDICTIVE ENGINE V2.4...",
  "LOADING HISTORICAL DATASETS...",
  "ESTABLISHING SPATIAL WEIGHTS...",
  "APPLYING SEASONAL VARIANCES...",
  "CALIBRATING CONFIDENCE INTERVALS...",
  "EXECUTING MONTE CARLO SIMULATION (N=10,000)...",
  "ISOLATING MICRO-HOTSPOTS...",
  "GENERATING RESOURCE ALLOCATION MATRIX...",
  "FINALIZING FORECAST TRAJECTORY...",
  "PREDICTION COMPLETE."
];

export default function AIPredictionPage() {
  const { t } = useLanguage();
  const [district, setDistrict] = useState("Bengaluru City");
  const [crimeType, setCrimeType] = useState("Theft");
  const [modelType, setModelType] = useState<"LSTM" | "XGBoost" | "Prophet">("LSTM");
  const [months, setMonths] = useState(3);
  const [includeEnvironmental, setIncludeEnvironmental] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<PredictionResult | null>(() =>
    runPrediction({
      district: "Bengaluru City",
      crimeType: "Theft",
      months: 3,
      modelType: "LSTM",
      includeEnvironmental: true,
      includeEvents: false,
    })
  );

  const handlePredict = () => {
    if (!district || !crimeType) return;
    setIsAnalyzing(true);
    setResult(null);
    setLogs([]);
    
    // Simulate terminal logs over time
    let logIndex = 0;
    const interval = setInterval(() => {
      setLogs(prev => [...prev, simLogs[logIndex]]);
      logIndex++;
      if (logIndex >= simLogs.length) {
        clearInterval(interval);
        setResult(runPrediction({ 
          district, 
          crimeType, 
          months, 
          modelType,
          includeEnvironmental, 
          includeEvents 
        }));
        setIsAnalyzing(false);
      }
    }, 150);
  };

  const applyPreset = (presetDist: string, presetCrime: string, presetModel: "LSTM" | "XGBoost" | "Prophet") => {
    setDistrict(presetDist);
    setCrimeType(presetCrime);
    setModelType(presetModel);
    setResult(runPrediction({
      district: presetDist,
      crimeType: presetCrime,
      months,
      modelType: presetModel,
      includeEnvironmental,
      includeEvents,
    }));
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Critical": return brandColors.customRed;
      case "High": return brandColors.customYellow;
      case "Medium": return brandColors.amber;
      default: return brandColors.green;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-brand-purple inline-flex items-center gap-3">
          <div className="p-2 bg-brand-purple/10 rounded-lg">
            <Cpu className="h-6 w-6 text-brand-purple" />
          </div>
          {t("Predictive Command Center")}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{t("Multi-model AI forecasting, resource allocation, and spatial hotspot identification.")}</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Config Console */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-4 lg:sticky lg:top-4 space-y-6">
          <Card className="glass-card shadow-lg hover:!transform-none border-t-4 border-t-brand-purple">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-purple" /> 
                {t("Simulation Parameters")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Quick Preset Scenarios */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-brand-purple" /> {t("Regional Archetype Presets")}
                  </label>
                  <span className="text-[9px] font-semibold text-muted-foreground">{t("All 37 Dist. Below")}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => applyPreset("Bengaluru City", "Theft", "LSTM")}
                    className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-brand-purple/10 text-xs font-semibold text-left flex items-center gap-1.5 transition-all"
                  >
                    ⚡ {t("Bengaluru (Metropolitan)")}
                  </button>
                  <button
                    onClick={() => applyPreset("Kalaburagi City", "Hurt/Grievous Hurt", "XGBoost")}
                    className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-brand-purple/10 text-xs font-semibold text-left flex items-center gap-1.5 transition-all"
                  >
                    🔥 {t("Kalaburagi (North-East)")}
                  </button>
                  <button
                    onClick={() => applyPreset("Hubli-Dharwad City", "Cheating", "Prophet")}
                    className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-brand-purple/10 text-xs font-semibold text-left flex items-center gap-1.5 transition-all"
                  >
                    🏙️ {t("Hubballi-Dharwad (North)")}
                  </button>
                  <button
                    onClick={() => applyPreset("Mysuru City", "Cheating", "Prophet")}
                    className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-brand-purple/10 text-xs font-semibold text-left flex items-center gap-1.5 transition-all"
                  >
                    💻 {t("Mysuru (Southern IT)")}
                  </button>
                  <button
                    onClick={() => applyPreset("Mangaluru City", "Hurt/Grievous Hurt", "XGBoost")}
                    className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-brand-purple/10 text-xs font-semibold text-left flex items-center gap-1.5 transition-all"
                  >
                    🌊 {t("Mangaluru (Coastal Port)")}
                  </button>
                  <button
                    onClick={() => applyPreset("Ballari", "Theft", "LSTM")}
                    className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-brand-purple/10 text-xs font-semibold text-left flex items-center gap-1.5 transition-all"
                  >
                    🚨 {t("Ballari (Mining Belt)")}
                  </button>
                </div>
              </div>
              
              {/* Target Vectors */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {t("Location Target")}</label>
                  <Select value={district} onValueChange={(val) => setDistrict(val || "")}>
                    <SelectTrigger className="bg-background/50 backdrop-blur-sm border-border/50 focus:ring-brand-purple/30 text-sm font-semibold"><SelectValue placeholder={t("Select district")} /></SelectTrigger>
                    <SelectContent>{districts.map((d) => <SelectItem key={d.name} value={d.name}>{t(d.name)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> {t("Crime Category")}</label>
                  <Select value={crimeType} onValueChange={(val) => setCrimeType(val || "")}>
                    <SelectTrigger className="bg-background/50 backdrop-blur-sm border-border/50 focus:ring-brand-purple/30 text-sm font-semibold"><SelectValue placeholder={t("Select crime type")} /></SelectTrigger>
                    <SelectContent>{ipcCrimes.map((c) => <SelectItem key={c.category} value={c.category}>{t(c.category)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Model Architecture */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mt-2"><Network className="h-3 w-3" /> {t("Model Architecture")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "LSTM", label: "LSTM", desc: "Time-Series" },
                    { id: "XGBoost", label: "XGBoost", desc: "Spatial Matrix" },
                    { id: "Prophet", label: "Prophet", desc: "Trend-Heavy" }
                  ].map((m) => (
                    <div 
                      key={m.id} 
                      onClick={() => setModelType(m.id as any)}
                      className={`cursor-pointer rounded-lg p-2 text-center transition-all border ${modelType === m.id ? 'bg-brand-purple/10 border-brand-purple/40 text-brand-purple' : 'bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40'}`}
                    >
                      <p className="text-xs font-bold">{t(m.label)}</p>
                      <p className="text-[9px] opacity-70 truncate">{t(m.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Params */}
              <div className="space-y-5 px-1 pt-2 border-t border-border/30">
                <div className="space-y-3 mt-2">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground/90"><Calendar className="h-4 w-4 text-brand-blue" /> {t("Horizon")}</label>
                    <span className="text-xs font-mono font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded">{months} {t("Months")}</span>
                  </div>
                  <input 
                    type="range" min="1" max="6" value={months} onChange={(e) => setMonths(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-brand-purple"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-bold">
                    <span>{t("1 Mo (High Conf)")}</span>
                    <span>{t("6 Mo (Low Conf)")}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" /> {t("Environmental Modifiers")}</label>
                  
                  <label className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/40 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground/90">{t("Seasonal & Weather Bias")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("Apply historical monthly patterns")}</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${includeEnvironmental ? 'bg-brand-purple' : 'bg-muted'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeEnvironmental ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={includeEnvironmental} onChange={(e) => setIncludeEnvironmental(e.target.checked)} />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/40 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground/90">{t("Randomized Events")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("Simulate major public events/holidays")}</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${includeEvents ? 'bg-brand-purple' : 'bg-muted'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeEvents ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={includeEvents} onChange={(e) => setIncludeEvents(e.target.checked)} />
                  </label>
                </div>
              </div>

              <Button 
                onClick={handlePredict} 
                className={`w-full h-12 text-md transition-all duration-300 font-semibold ${isAnalyzing ? 'bg-brand-purple/50 cursor-wait' : 'bg-brand-purple hover:bg-brand-purple/90 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'}`}
                disabled={!district || !crimeType || isAnalyzing}
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {t("RUNNING SIMULATION...")}</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" /> {t("EXECUTE PREDICTION")}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Results Terminal & Visualizer */}
        <div className="lg:col-span-8 relative min-h-[700px]">
          <AnimatePresence mode="wait">
            
            {/* Empty State */}
            {!isAnalyzing && !result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                <Card className="glass-card h-full flex flex-col items-center justify-center text-center p-8 border-dashed border-2">
                  <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 border border-border/50 shadow-inner">
                    <Cpu className="h-10 w-10 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">{t("Awaiting Parameters")}</h3>
                  <p className="text-muted-foreground max-w-md">{t("Configure your location, target crime, and model architecture in the console, then execute the prediction engine.")}</p>
                </Card>
              </motion.div>
            )}

            {/* Loading State: The Terminal */}
            {isAnalyzing && (
              <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                <Card className="glass-card h-full overflow-hidden relative border-brand-purple/40 bg-black/5">
                  <div className="absolute inset-0 bg-brand-purple/5 animate-pulse pointer-events-none" />
                  
                  <CardHeader className="border-b border-border/30 bg-muted/50 pb-3">
                    <CardTitle className="text-sm font-mono flex items-center gap-2 text-brand-purple">
                      <Terminal className="h-4 w-4" /> root@crimescope-ai:~# ./run_prediction --model={modelType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 font-mono text-sm space-y-2">
                    {logs.map((log, index) => (
                      <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 text-brand-teal/80">
                        <span className="text-muted-foreground/50 opacity-50">[{new Date().toISOString().split('T')[1].substring(0,8)}]</span>
                        <span className={log.includes("ERROR") ? "text-brand-red" : log.includes("COMPLETE") ? "text-brand-purple font-bold" : ""}>{log}</span>
                      </motion.div>
                    ))}
                    <div className="flex items-center gap-2 text-brand-purple mt-4">
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("Processing...")}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Results State */}
            {!isAnalyzing && result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, staggerChildren: 0.1 }} className="space-y-6">
                
                {/* KPI Overview */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <Card className="glass-card overflow-hidden relative group h-full">
                      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-${getTierColor(result.tier).replace('var(--', '').replace(')', '')} group-hover:opacity-20 transition-opacity`} />
                      <CardContent className="p-4 text-center h-full flex flex-col justify-center">
                        <Target className="h-5 w-5 mx-auto mb-2 opacity-80" style={{ color: getTierColor(result.tier) }} />
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{t("Risk Score")}</p>
                        <div className="flex items-end justify-center gap-1 mb-1">
                          <span className="text-3xl font-mono font-bold" style={{ color: getTierColor(result.tier) }}>{result.riskScore}</span>
                        </div>
                        <span className="inline-flex px-2 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase tracking-wider mx-auto" style={{ backgroundColor: `${getTierColor(result.tier)}20`, color: getTierColor(result.tier) }}>
                          {t(result.tier)} {t("TIER")}
                        </span>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <Card className="glass-card overflow-hidden relative group h-full">
                      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-brand-blue group-hover:opacity-20 transition-opacity" />
                      <CardContent className="p-4 text-center h-full flex flex-col justify-center">
                        <BarChart3 className="h-5 w-5 mx-auto text-brand-blue mb-2 opacity-80" />
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{t("Projected Total")}</p>
                        <p className="text-3xl font-mono font-bold text-foreground mb-1">{result.predictedCount.toLocaleString()}</p>
                        <span className="text-[10px] text-muted-foreground">{t("over {months} months").replace("{months}", months.toString())}</span>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="sm:col-span-2">
                    <Card className="glass-card overflow-hidden relative group h-full">
                      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-brand-purple group-hover:opacity-20 transition-opacity" />
                      <CardContent className="p-4 flex flex-col justify-center h-full">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-brand-purple" />
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t("Model Confidence")}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-brand-purple/30 bg-brand-purple/10 text-brand-purple">{t(modelType)}</span>
                        </div>
                        <div className="flex items-end gap-1 mb-2">
                          <span className="text-3xl font-mono font-bold">{result.confidence}</span>
                          <span className="text-lg font-bold mb-1">%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }} transition={{ duration: 1, delay: 0.6 }} className="h-full bg-brand-purple" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Forecast Chart (WITH CONFIDENCE CONE) */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                  <Card className="glass-card overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/10 pb-3 pt-4 px-5">
                      <div className="flex justify-between items-center">
                        <CardTitle className="font-heading text-base flex items-center gap-2">
                          <Activity className="h-4 w-4 text-brand-blue" /> {t("Forecast Trajectory")}
                        </CardTitle>
                        <div className="flex gap-4 text-[10px] font-semibold font-mono text-muted-foreground">
                          <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-muted-foreground" /> {t("Actual")}</span>
                          <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 border-t-2 border-dashed border-brand-purple" /> {t("Projection")}</span>
                          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-brand-purple/10 border border-brand-purple/20" /> {t("95% Interval")}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[280px] w-full pt-4 pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={result.forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                              cursor={{ stroke: 'var(--brand-purple)', strokeWidth: 1, strokeDasharray: '4 4' }}
                              contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} 
                              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            
                            {/* Confidence Interval Shading */}
                            <Area 
                              type="monotone" 
                              dataKey={['lowerBound', 'upperBound'] as any}
                              stroke="none" 
                              fill="var(--brand-purple)" 
                              fillOpacity={0.1} 
                              animationDuration={2000} 
                              name={t("95% Interval")}
                            />
                            
                            {/* Historical Line */}
                            <Area 
                              type="monotone" 
                              dataKey="historical" 
                              name={t("Actual")} 
                              stroke="var(--muted-foreground)" 
                              strokeWidth={2} 
                              fill="url(#histGrad)" 
                              animationDuration={1500} 
                            />
                            
                            {/* Projected Line */}
                            <Area 
                              type="monotone" 
                              dataKey="predicted" 
                              name={t("Projection")} 
                              stroke="var(--brand-purple)" 
                              strokeWidth={2} 
                              strokeDasharray="5 5" 
                              fill="none" 
                              animationDuration={2000} 
                            />
                            
                            <ReferenceLine x={result.forecastData.find(d => d.historical !== null && d.predicted !== null)?.month} stroke="var(--border)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: ` ${t("TODAY")}`, fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Bottom Row: Hotspots & Resources & Attribution */}
                <div className="grid gap-6 lg:grid-cols-3">
                  
                  {/* Micro-Hotspots */}
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="lg:col-span-1">
                    <Card className="glass-card h-full">
                      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                        <CardTitle className="text-sm font-heading flex items-center gap-2">
                          <Crosshair className="h-4 w-4 text-brand-red" /> {t("High-Risk Zones")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {result.hotspots.map((spot, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold">{i+1}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground/90">{spot}</p>
                              <p className="text-[10px] text-muted-foreground">{t(district)} {t("Sector")}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Resource Allocation */}
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="lg:col-span-1">
                    <Card className="glass-card h-full border-t-2 border-t-brand-teal">
                      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                        <CardTitle className="text-sm font-heading flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-brand-teal" /> {t("AI Recommended Actions")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {result.resourceRecommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                            <ChevronRight className="h-4 w-4 text-brand-teal flex-shrink-0 mt-0.5" />
                            <p className="leading-snug">{t(rec)}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Feature Attribution */}
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="lg:col-span-1">
                    <Card className="glass-card h-full">
                      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                        <CardTitle className="text-sm font-heading flex items-center gap-2 text-muted-foreground">
                          <Brain className="h-4 w-4" /> {t("Feature Attribution Matrix")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {[
                            { name: t("Environmental Bias"), val: result.factors.environmental, max: 2, color: "bg-brand-blue" },
                            { name: t("District Spatial Risk"), val: result.factors.district, max: 2, color: "bg-brand-red" },
                            { name: t("Recent Velocity Trend"), val: result.factors.trend, max: 2, color: "bg-brand-teal" },
                            ...(result.factors.eventAnomaly ? [{ name: t("Event Anomaly Override"), val: result.factors.eventAnomaly, max: 2, color: "bg-brand-purple" }] : [])
                          ].map((feature, i) => (
                            <div key={feature.name} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-foreground/80">{feature.name}</span>
                                <span className="font-mono text-muted-foreground font-bold">{feature.val.toFixed(2)}x</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                  className={`h-full rounded-full ${feature.color}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((feature.val / feature.max) * 100, 100)}%` }}
                                  transition={{ duration: 1, delay: 0.9 + i * 0.1 }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
