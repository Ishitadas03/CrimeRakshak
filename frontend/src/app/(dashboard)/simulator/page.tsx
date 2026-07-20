"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Cpu, Play, AlertTriangle, Users, Calendar, Shield, RotateCcw, Camera, HeartHandshake, TrendingDown, Coins, Smile, Loader2 } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { brandColors } from "@/lib/design-tokens";
import { useLanguage } from "@/components/LanguageContext";

interface SimResult {
  crimeReduction: number;
  costTier: "Low" | "Moderate" | "High" | "Extreme";
  sentiment: "Positive" | "Neutral" | "Negative";
  radarData: Record<string, string | number>[];
}

export default function SimulatorPage() {
  const { t } = useLanguage();
  const [params, setParams] = useState<Record<string, number>>({});
  const [patrols, setPatrols] = useState(50);
  const [cctv, setCctv] = useState(30);
  const [outreach, setOutreach] = useState(20);
  const [festival, setFestival] = useState(false);
  const [curfew, setCurfew] = useState(false);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const handleReset = () => {
    setPatrols(50);
    setCctv(30);
    setOutreach(20);
    setFestival(false);
    setCurfew(false);
    setResult(null);
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setResult(null);

    setTimeout(() => {
      // Base crime levels
      const baseViolent = 80;
      const baseTheft = 75;
      const baseVandal = 60;
      const baseTraffic = 50;
      const baseDisturb = 45;

      // Effects
      const pEff = (patrols - 50) / 100; // -0.4 to 0.5
      const cEff = (cctv - 30) / 100;    // -0.3 to 0.7
      const oEff = (outreach - 20) / 100; // -0.2 to 0.8
      
      const fEff = festival ? 0.3 : 0;
      const curfEff = curfew ? -0.4 : 0;

      // Simulated levels (clamped 0-100)
      const simViolent = Math.max(10, Math.min(100, baseViolent * (1 - (pEff * 0.6) - (oEff * 0.3) + fEff + curfEff)));
      const simTheft = Math.max(10, Math.min(100, baseTheft * (1 - (pEff * 0.4) - (cEff * 0.7) + (fEff * 0.5) + (curfEff * 0.8))));
      const simVandal = Math.max(10, Math.min(100, baseVandal * (1 - (pEff * 0.2) - (cEff * 0.8) - (oEff * 0.2) + fEff)));
      const simTraffic = Math.max(10, Math.min(100, baseTraffic * (1 - (pEff * 0.5) + (fEff * 0.8) + (curfEff * 0.5))));
      const simDisturb = Math.max(10, Math.min(100, baseDisturb * (1 - (pEff * 0.3) - (oEff * 0.9) + (fEff * 1.2) + curfEff)));

      const totalBase = baseViolent + baseTheft + baseVandal + baseTraffic + baseDisturb;
      const totalSim = simViolent + simTheft + simVandal + simTraffic + simDisturb;
      
      const reduction = Math.round(((totalBase - totalSim) / totalBase) * 100);

      // Cost calc
      const totalResource = patrols + cctv + outreach + (curfew ? 40 : 0);
      const costTier = totalResource > 200 ? "Extreme" : totalResource > 150 ? "High" : totalResource > 90 ? "Moderate" : "Low";

      // Sentiment calc
      const sentimentScore = Object.values(params).reduce((acc, val) => acc + Number(val), 0) % 100 + (reduction * 0.5);
      const sentiment = sentimentScore > 15 ? "Positive" : sentimentScore < -10 ? "Negative" : "Neutral";

      const radarData = [
        { subject: t('Violent Crime'), baseline: baseViolent, simulated: Math.round(simViolent) },
        { subject: t('Theft/Robbery'), baseline: baseTheft, simulated: Math.round(simTheft) },
        { subject: t('Vandalism'), baseline: baseVandal, simulated: Math.round(simVandal) },
        { subject: t('Traffic/DUI'), baseline: baseTraffic, simulated: Math.round(simTraffic) },
        { subject: t('Disturbances'), baseline: baseDisturb, simulated: Math.round(simDisturb) },
      ];

      setResult({ crimeReduction: reduction, costTier, sentiment, radarData });
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-foreground tracking-tight">
          <div className="p-2 bg-brand-cyan/10 rounded-lg">
            <Cpu className="h-6 w-6 text-brand-cyan" />
          </div>
          {t("Digital Twin Simulator")}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{t("Test physical policy changes and resource allocations on a virtual city model.")}</p>
        <p className="text-xs font-semibold text-brand-amber mt-2 inline-flex items-center gap-1.5 bg-brand-amber/10 px-2.5 py-1 rounded-full border border-brand-amber/20">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("Predictive Sandbox Environment")}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Input Panel */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-5 lg:sticky lg:top-4">
          <Card className="glass-card shadow-lg hover:!transform-none border-t-4 border-t-brand-cyan">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-cyan" /> 
                  {t("Policy Controls")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-4 w-4 mr-2" /> {t("Reset")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Resource Sliders */}
              <div className="space-y-5 bg-muted/20 p-5 rounded-xl border border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">{t("Resource Allocation")}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-blue" /><span className="text-sm font-semibold text-foreground">{t("Patrol Deployment")}</span></div>
                    <span className="text-xs font-mono font-bold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded">{patrols}%</span>
                  </div>
                  <input type="range" min="10" max="100" value={patrols} onChange={(e) => setPatrols(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-brand-blue" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-brand-purple" /><span className="text-sm font-semibold text-foreground">{t("Active Surveillance (CCTV)")}</span></div>
                    <span className="text-xs font-mono font-bold bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded">{cctv}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={cctv} onChange={(e) => setCctv(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-brand-purple" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-brand-teal" /><span className="text-sm font-semibold text-foreground">{t("Community Outreach")}</span></div>
                    <span className="text-xs font-mono font-bold bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded">{outreach}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={outreach} onChange={(e) => setOutreach(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-brand-teal" />
                </div>
              </div>

              {/* Event Toggles */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">{t("Environmental Modifiers")}</h3>
                
                <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/40 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${festival ? 'bg-brand-amber/10 text-brand-amber' : 'bg-muted text-muted-foreground'}`}><Calendar className="h-4 w-4" /></div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{t("Major Festival / Event")}</p>
                      <p className="text-xs text-muted-foreground">{t("Simulates massive crowd density")}</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${festival ? 'bg-brand-amber' : 'bg-muted'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${festival ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={festival} onChange={(e) => setFestival(e.target.checked)} />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/40 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${curfew ? 'bg-brand-red/10 text-brand-red' : 'bg-muted text-muted-foreground'}`}><AlertTriangle className="h-4 w-4" /></div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{t("Enforce Night Curfew")}</p>
                      <p className="text-xs text-muted-foreground">{t("Severe movement restrictions")}</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${curfew ? 'bg-brand-red' : 'bg-muted'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${curfew ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={curfew} onChange={(e) => setCurfew(e.target.checked)} />
                </label>
              </div>

              <Button 
                onClick={runSimulation} 
                className={`w-full h-12 text-md transition-all duration-300 border-0 ${isSimulating ? 'bg-brand-cyan/50 cursor-wait text-white' : 'text-white shadow-lg'}`}
                style={{ background: isSimulating ? '' : `linear-gradient(to right, ${brandColors.cyan}, ${brandColors.blue})` }}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {t("Rendering City Model...")}</>
                ) : (
                  <><Play className="h-5 w-5 mr-2 fill-current" /> {t("Execute Simulation")}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Results Panel */}
        <div className="lg:col-span-7 relative min-h-[650px]">
          <AnimatePresence mode="wait">
            
            {/* Empty State */}
            {!isSimulating && !result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                <Card className="glass-card h-full flex flex-col items-center justify-center text-center p-8 border-dashed border-2 hover:!transform-none hover:shadow-none cursor-default">
                  <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 border border-border/50 shadow-inner">
                    <Cpu className="h-10 w-10 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2 text-foreground">{t("Awaiting Parameters")}</h3>
                  <p className="text-muted-foreground max-w-sm">{t("Configure your patrol, surveillance, and environmental policies on the left, then execute the simulation to render the physical impact.")}</p>
                </Card>
              </motion.div>
            )}

            {/* Loading State */}
            {isSimulating && (
              <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                <Card className="glass-card h-full flex flex-col items-center justify-center overflow-hidden relative border-brand-cyan/30">
                  <div className="absolute inset-0 bg-brand-cyan/5 animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-40 h-40 mb-8">
                      {/* Radar sweep effect */}
                      <div className="absolute inset-0 rounded-full border border-brand-cyan/20" />
                      <div className="absolute inset-4 rounded-full border border-brand-cyan/30" />
                      <div className="absolute inset-8 rounded-full border border-brand-cyan/40" />
                      
                      <div className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-transparent to-brand-cyan origin-left animate-spin" style={{ animationDuration: '1.5s' }} />
                      
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full backdrop-blur-[1px]">
                        <Cpu className="h-10 w-10 text-brand-cyan animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-mono font-bold text-brand-purple">{t("RENDERING MODEL")}</h3>
                    <p className="text-sm font-mono text-muted-foreground mt-2 flex items-center gap-2">
                      {t("Calculating policy impacts across 5 vectors...")}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Results State */}
            {!isSimulating && result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, staggerChildren: 0.1 }} className="space-y-6">
                
                {/* KPI Overview */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <Card className="glass-card overflow-hidden relative border-l-4 border-l-brand-cyan">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{t("Overall Impact")}</p>
                          <TrendingDown className={`h-4 w-4 ${result.crimeReduction > 0 ? 'text-green-500' : 'text-brand-red'}`} />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className={`text-4xl font-sans font-bold ${result.crimeReduction > 0 ? 'text-green-500' : result.crimeReduction < 0 ? 'text-brand-red' : 'text-muted-foreground'}`}>
                            {result.crimeReduction > 0 ? "-" : result.crimeReduction < 0 ? "+" : ""}{Math.abs(result.crimeReduction)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t("Total crime volume")}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <Card className="glass-card overflow-hidden relative border-l-4 border-l-brand-purple">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{t("Resource Cost")}</p>
                          <Coins className="h-4 w-4 text-brand-purple" />
                        </div>
                        <p className="text-2xl font-sans font-bold text-foreground mt-3">{t(result.costTier)}</p>
                        <p className="text-xs text-muted-foreground mt-2">{t("Financial & manpower")}</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                    <Card className="glass-card overflow-hidden relative border-l-4 border-l-brand-teal">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{t("Public Sentiment")}</p>
                          <Smile className="h-4 w-4 text-brand-teal" />
                        </div>
                        <p className={`text-2xl font-sans font-bold mt-3 ${result.sentiment === "Positive" ? "text-green-500" : result.sentiment === "Negative" ? "text-brand-red" : "text-muted-foreground"}`}>{t(result.sentiment)}</p>
                        <p className="text-xs text-muted-foreground mt-2">{t("Community reception")}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Radar Chart */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                  <Card className="glass-card border-t-4 border-t-brand-blue">
                    <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                      <CardTitle className="font-heading text-lg">{t("Multi-Dimensional Crime Projection")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 relative">
                      <div className="h-[380px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={result.radarData}>
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            
                            <RechartsTooltip 
                              contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)", color: "var(--foreground)", padding: "12px" }} 
                              itemStyle={{ color: "var(--foreground)", fontWeight: 500, fontSize: "13px" }}
                            />
                            
                            <Radar name={t("Baseline (Without Policies)")} dataKey="baseline" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.2} strokeWidth={2} />
                            <Radar name={t("Simulated Projection")} dataKey="simulated" stroke={brandColors.cyan} fill={brandColors.blue} fillOpacity={0.5} strokeWidth={3} />
                            
                            <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "13px", fontWeight: "bold", color: "var(--foreground)" }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
