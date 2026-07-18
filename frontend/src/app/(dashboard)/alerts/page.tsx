"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSurgeAlerts } from "@/lib/derive";
import { fetchAPI } from "@/lib/apiClient";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  Bell, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowRight,
  Activity, ShieldAlert, MapPin, Radio, Siren, CheckCircle, Crosshair, Brain, ShieldCheck
} from "lucide-react";
import { riskTierBg, brandColors } from "@/lib/design-tokens";
import type { RiskTier } from "@/lib/design-tokens";
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, Tooltip as RechartsTooltip, CartesianGrid, YAxis } from "recharts";
import { useLanguage } from "@/components/LanguageContext";

// ─── Data Interfaces ────────────────────────────────────────────────

export interface Alert {
  id: string;
  crime: string;
  change: number;
  currentMonth: number;
  prevMonth: number;
  severity: RiskTier;
  timestamp: Date;
  status: "Unread" | "Investigating" | "Resolved";
  location: string;
  slaMinutes: number;
  suggestedUnits: string[];
}

const mockLocations = [
  "Sector 4, Electronic City",
  "Brigade Road Intersection",
  "Majestic Bus Stand Area",
  "KR Puram Market",
  "Indiranagar 100ft Road",
  "Whitefield Tech Park",
  "Koramangala 5th Block",
  "Jayanagar 4th Block"
];

const mockUnits = [
  ["Deploy 2x Hoysala Interceptor Units", "Alert Local Traffic Police"],
  ["Dispatch Cyber Rapid Response Team", "Notify Nodal Bank Officers"],
  ["Activate Neighborhood Watch Protocol", "Increase Night Patrol Frequency"],
  ["Deploy Special Task Force (STF)", "Establish Tactical Checkpoints"],
];

// Shape returned by GET /predict/early-warning (real Poisson surge detection).
interface BackendSurgeAlert {
  id: string;
  district: string;
  crime: string;
  location: string;
  currentMonth: number;
  prevMonth: number;
  change: number;
  probability: number;
  severity: "Critical" | "High" | "Moderate";
  month: string;
  slaMinutes: number;
  suggestedUnits: string[];
}

function mapBackendAlerts(items: BackendSurgeAlert[]): Alert[] {
  return items.map((a, i) => ({
    id: a.id,
    crime: `${a.crime} Surge — ${a.district}`,
    change: a.change,
    currentMonth: a.currentMonth,
    prevMonth: Math.round(a.prevMonth),
    severity: a.severity as RiskTier,
    timestamp: new Date(Date.now() - i * 3600000),
    status: "Unread" as const,
    location: `${a.location} (${a.district})`,
    slaMinutes: a.slaMinutes,
    suggestedUnits: a.suggestedUnits,
  }));
}

function generateAlerts(): Alert[] {
  const surges = getSurgeAlerts(12);
  return surges.map((s, i) => {
    const isCritical = s.change > 20;
    const isHigh = s.change > 10;
    return {
      id: `alert-${Date.now()}-${i}`,
      crime: s.crime,
      change: s.change,
      currentMonth: s.currentMonth,
      prevMonth: s.prevMonth,
      severity: isCritical ? "Critical" : isHigh ? "High" : s.change > 5 ? "Moderate" : "Safe",
      timestamp: new Date(Date.now() - i * 3600000 * Math.random() * 4),
      status: "Unread",
      location: mockLocations[i % mockLocations.length],
      slaMinutes: isCritical ? 15 : isHigh ? 60 : 120,
      suggestedUnits: mockUnits[i % mockUnits.length]
    };
  });
}

// ─── SLATimer Component ─────────────────────────────────────────────

function SLATimer({ timestamp, slaMinutes, status, t }: { timestamp: Date; slaMinutes: number; status: string; t: (key: string) => string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    if (status === "Resolved") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft("RESOLVED");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBreached(false);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const deadline = new Date(timestamp.getTime() + slaMinutes * 60000);
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setIsBreached(true);
        setTimeLeft("SLA BREACHED");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        setIsBreached(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp, slaMinutes, status]);

  if (status === "Resolved") {
    return <span className="font-mono font-bold text-brand-green">{t("SLA MET")}</span>;
  }

  return (
    <span className={`font-mono font-bold ${isBreached ? 'text-brand-red animate-pulse' : 'text-foreground'}`}>
      {isBreached ? t("SLA BREACHED") : timeLeft}
    </span>
  );
}

// ─── Main Page Component ────────────────────────────────────────────

export default function AlertsPage() {
  const { t, lang } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<RiskTier | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [source, setSource] = useState<"live" | "simulated">("simulated");
  const [generatedFor, setGeneratedFor] = useState<string | null>(null);

  // Initialize on mount: real early-warning scan, mock surges as offline fallback
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAPI("/predict/early-warning");
        if (cancelled) return;
        const mapped = mapBackendAlerts(data.alerts as BackendSurgeAlert[]);
        setAlerts(mapped);
        if (mapped.length > 0) setSelectedId(mapped[0].id);
        setSource("live");
        setGeneratedFor(data.generatedFor ?? null);
      } catch {
        if (cancelled) return;
        const initialAlerts = generateAlerts();
        setAlerts(initialAlerts);
        if (initialAlerts.length > 0) setSelectedId(initialAlerts[0].id);
        setSource("simulated");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateAlertStatus = (id: string, status: Alert["status"]) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleDeploy = (id: string) => {
    setIsDeploying(true);
    updateAlertStatus(id, "Investigating");
    setTimeout(() => {
      setIsDeploying(false);
    }, 1500);
  };

  // Simulate an incoming alert every 45 seconds — demo mode only, so real
  // early-warning results are never polluted with fabricated criticals
  useEffect(() => {
    if (source === "live") return;
    const timer = setInterval(() => {
      setAlerts(prev => {
        const surges = getSurgeAlerts(1); // Get a random one
        const newAlert: Alert = {
          id: `alert-new-${Date.now()}`,
          crime: surges[0].crime,
          change: surges[0].change + 25, // Force critical for drama
          currentMonth: surges[0].currentMonth + 50,
          prevMonth: surges[0].prevMonth,
          severity: "Critical",
          timestamp: new Date(),
          status: "Unread",
          location: "Central Hub District",
          slaMinutes: 10,
          suggestedUnits: ["Deploy Alpha Squad", "Initiate Drone Surveillance"]
        };
        return [newAlert, ...prev];
      });
    }, 45000);
    return () => clearInterval(timer);
  }, [source]);

  const injectFlashAlert = (crime: string, location: string, change: number, units: string[]) => {
    const flashId = `alert-flash-${Date.now()}`;
    const newAlert: Alert = {
      id: flashId,
      crime,
      change,
      currentMonth: Math.round(180 + change * 2.5),
      prevMonth: 140,
      severity: "Critical",
      timestamp: new Date(),
      status: "Unread",
      location,
      slaMinutes: 15,
      suggestedUnits: units,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setSelectedId(flashId);
  };

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status !== "Resolved"), [alerts]);
  
  const filteredAlerts = useMemo(() => {
    return activeAlerts.filter((a) => filter === "All" || a.severity === filter);
  }, [activeAlerts, filter]);

  const criticalCount = activeAlerts.filter((a) => a.severity === "Critical").length;
  const highCount = activeAlerts.filter((a) => a.severity === "High").length;
  
  const selectedAlert = alerts.find(a => a.id === selectedId) || null;

  const getTierColorHex = (tier: RiskTier) => {
    switch (tier) {
      case "Critical": return brandColors.customRed;
      case "High": return brandColors.customYellow;
      case "Moderate": return brandColors.amber;
      default: return brandColors.green;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Header & KPI Bar */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center flex-shrink-0">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-brand-purple tracking-tight">
            <div className="p-2 bg-brand-purple/10 rounded-lg">
              <Siren className="h-6 w-6 text-brand-purple animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
            {t("Incident Command Center")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("Real-time triage dashboard for high-priority automated alerts and spatial anomalies.")}</p>
          <div className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            source === "live"
              ? "text-brand-teal border-brand-teal/30 bg-brand-teal/10"
              : "text-brand-amber border-brand-amber/30 bg-brand-amber/10"
          }`}>
            <Radio className="h-3 w-3" />
            {source === "live"
              ? `${t("Live Poisson Surge Detection")}${generatedFor ? ` — ${generatedFor}` : ""}`
              : t("Offline Simulation (backend unreachable)")}
          </div>
        </motion.div>

        {/* Mini KPI Dashboard */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-4">
          <div className="flex flex-col bg-muted/20 border border-border/50 rounded-xl px-4 py-2 min-w-[120px]">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t("Active Alerts")}</span>
            <span className="text-2xl font-bold font-mono">{activeAlerts.length}</span>
          </div>
          <div className={`flex flex-col rounded-xl px-4 py-2 min-w-[120px] border transition-all ${criticalCount > 0 ? 'bg-brand-red/10 border-brand-red/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-muted/20 border-border/50'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${criticalCount > 0 ? 'text-brand-red' : 'text-muted-foreground'}`}>{t("Critical Priority")}</span>
            <span className={`text-2xl font-bold font-mono ${criticalCount > 0 ? 'text-brand-red' : 'text-foreground'}`}>{criticalCount}</span>
          </div>
        </motion.div>
      </div>

      {/* Tactical Emergency Injection Bar for Live Review */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 border border-border/60 p-3 rounded-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <Siren className="h-4 w-4 text-brand-red animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("Live Alert Simulation Console")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => injectFlashAlert("Violent Robbery Surge", "Bengaluru South (Electronic City Corridor)", 48, ["Dispatch 3x Hoysala Interceptors", "Alert Checkpoint Alpha-2", "Activate Highway Ring Surveillance"])}
            className="px-3 py-1.5 rounded-lg border border-brand-red/40 bg-brand-red/10 hover:bg-brand-red/20 text-xs font-bold text-brand-red flex items-center gap-1.5 transition-all shadow-sm"
          >
            ⚡ {t("Inject Robbery Surge (+48%)")}
          </button>
          <button
            onClick={() => injectFlashAlert("Cyber Financial Fraud Spike", "Mysuru Commercial District", 36, ["Deploy CEN Cyber Unit", "Alert State Bank Nodal Desk", "Freeze Flagged UPI Gateway Accounts"])}
            className="px-3 py-1.5 rounded-lg border border-brand-purple/40 bg-brand-purple/10 hover:bg-brand-purple/20 text-xs font-bold text-brand-purple flex items-center gap-1.5 transition-all shadow-sm"
          >
            💻 {t("Inject Cyber Spike (+36%)")}
          </button>
          <button
            onClick={() => injectFlashAlert("NDPS Narcotics Transit Anomaly", "Mangaluru Port & Highway Checkpoint", 42, ["Deploy Anti-Narcotics Special Task Force", "Establish Coastal Route Interdiction", "Notify Excise Intelligence"])}
            className="px-3 py-1.5 rounded-lg border border-brand-teal/40 bg-brand-teal/10 hover:bg-brand-teal/20 text-xs font-bold text-brand-teal flex items-center gap-1.5 transition-all shadow-sm"
          >
            🌊 {t("Inject Narcotics Alert (+42%)")}
          </button>
        </div>
      </div>

      {/* Split-Pane Layout */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Live Feed (40%) */}
        <div className="lg:w-[40%] flex flex-col h-full gap-4">
          
          {/* Filters */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-2 flex-shrink-0 bg-muted/20 p-1.5 rounded-xl border border-border/50">
            {(["All", "Critical", "High", "Moderate"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilter(tier)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === tier 
                    ? 'bg-background shadow-sm text-foreground border border-border/50' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                }`}
              >
                {t(tier)}
              </button>
            ))}
          </motion.div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/50 rounded-2xl">
                  <CheckCircle2 className="h-12 w-12 text-brand-green/50 mb-3" />
                  <p className="text-muted-foreground font-semibold">{t("All Clear. No active alerts.")}</p>
                </motion.div>
              ) : (
                filteredAlerts.map((alert, i) => {
                  const isCritical = alert.severity === "Critical";
                  const isSelected = selectedId === alert.id;
                  const isUnread = alert.status === "Unread";

                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -50 }}
                      transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
                      onClick={() => setSelectedId(alert.id)}
                    >
                      <Card className={`glass-card cursor-pointer transition-all duration-300 relative overflow-hidden
                        ${isSelected ? 'border-brand-blue shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-muted/10' : 'hover:border-border/80'}
                        ${isCritical && isUnread && !isSelected ? 'border-brand-red/40 bg-brand-red/5' : ''}
                      `}>
                        {/* Status indicators */}
                        {isUnread && <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue" />}
                        {isCritical && isUnread && <div className="absolute inset-0 bg-brand-red/10 animate-pulse pointer-events-none" />}
                        
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${riskTierBg[alert.severity]} flex items-center gap-1`}>
                              {isCritical ? <ShieldAlert className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {t(alert.severity)}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-foreground/90 mb-1 line-clamp-1">{t(alert.crime)}</h4>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{t(alert.location)}</span>
                            </div>
                            <span className={`text-[11px] font-bold ${isCritical ? 'text-brand-red' : 'text-brand-amber'}`}>
                              +{alert.change.toFixed(1)}% {t("Surge")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Deep Triage Pane (60%) */}
        <div className="lg:w-[60%] h-full flex flex-col min-h-[600px]">
          <AnimatePresence mode="wait">
            {!selectedAlert ? (
              <motion.div key="empty-pane" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <Card className="glass-card h-full flex flex-col items-center justify-center text-center p-8 border-dashed border-2">
                  <Radio className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-heading font-bold text-foreground/50">{t("Select an Alert")}</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mt-2">{t("Choose an incident from the live feed to view detailed forensics, telemetry, and actionable dispatch recommendations.")}</p>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedAlert.id} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col gap-4"
              >
                {/* Triage Header Card */}
                <Card className={`glass-card relative overflow-hidden flex-shrink-0 transition-colors duration-500 ${selectedAlert.severity === 'Critical' ? 'border-brand-red/40' : 'border-border/50'}`}>
                  {selectedAlert.severity === "Critical" && <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />}
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      
                      {/* Left: Info */}
                      <div className="flex-1 z-10">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${riskTierBg[selectedAlert.severity]}`}>
                            {t(selectedAlert.severity)} {t("PRIORITY")}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                            selectedAlert.status === 'Resolved' ? 'text-brand-green border-brand-green/30 bg-brand-green/10' :
                            selectedAlert.status === 'Investigating' ? 'text-brand-blue border-brand-blue/30 bg-brand-blue/10' :
                            'text-brand-purple border-brand-purple/30 bg-brand-purple/10'
                          }`}>
                            {t("STATUS:")} {t(selectedAlert.status)}
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-heading font-black text-foreground tracking-tight mb-2">
                          {t(selectedAlert.crime)}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-blue" /> {t(selectedAlert.location)}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-purple" /> {selectedAlert.timestamp.toLocaleString(lang === "KA" ? "kn-IN" : "en-US")}</span>
                        </div>
                      </div>

                      {/* Right: SLA Timer */}
                      <div className="z-10 bg-background/50 backdrop-blur-md border border-border/50 p-4 rounded-xl flex flex-col items-center min-w-[160px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("SLA Countdown")}</span>
                        <div className="text-3xl tracking-tight">
                          {/* We must wrap SLATimer with a simple wrapper to pass `t` function to it, or just not pass it since `t` is available in the parent, but wait `SLATimer` does not use context currently. I will pass `t` as a prop if I update SLATimer, wait I already added `t("SLA MET")` by doing `t("SLA MET")` inside SLATimer? Wait, `SLATimer` does not have access to `t`! Let's pass `t` to `SLATimer` */}
                          <SLATimer timestamp={selectedAlert.timestamp} slaMinutes={selectedAlert.slaMinutes} status={selectedAlert.status} t={t} />
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* Main Details Body */}
                <div className="flex-1 grid gap-4 grid-cols-1 xl:grid-cols-2 overflow-hidden">
                  
                  {/* Left Column: Data & Actions */}
                  <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    
                    {/* Volume Metrics */}
                    <Card className="glass-card flex-shrink-0">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("Volume Metrics")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="text-4xl font-mono font-bold text-foreground">{selectedAlert.currentMonth.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">{t("cases (30 days)")}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded ${selectedAlert.severity === 'Critical' ? 'bg-brand-red/10 text-brand-red' : 'bg-brand-amber/10 text-brand-amber'}`}>
                            <TrendingUp className="h-4 w-4" /> +{selectedAlert.change.toFixed(1)}% {t("vs Prior Month")}
                          </div>
                          <span className="text-xs text-muted-foreground">({selectedAlert.prevMonth.toLocaleString()} {t("cases")})</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Recommendations */}
                    <Card className="glass-card flex-shrink-0">
                      <CardHeader className="pb-2 border-b border-border/30 bg-muted/10">
                        <CardTitle className="text-sm font-heading flex items-center gap-2">
                          <Brain className="h-4 w-4 text-brand-teal" /> {t("AI Recommended Actions")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {selectedAlert.suggestedUnits.map((unit, i) => (
                          <div key={i} className="flex items-start gap-2 bg-muted/20 p-3 rounded-lg border border-border/40">
                            <Crosshair className="h-4 w-4 text-brand-teal flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-foreground/90">{t(unit)}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Action Matrix */}
                    <div className="mt-auto pt-4 flex flex-col gap-3">
                      {selectedAlert.status !== "Resolved" && (
                        <Button 
                          onClick={() => handleDeploy(selectedAlert.id)}
                          disabled={isDeploying || selectedAlert.status === "Investigating"}
                          className={`w-full h-12 text-sm font-bold transition-all shadow-lg ${
                            selectedAlert.status === "Investigating" 
                              ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30 hover:bg-brand-blue/20' 
                              : 'bg-gradient-to-r from-brand-blue to-brand-purple text-white hover:opacity-90'
                          }`}
                        >
                          {isDeploying ? (
                            <><Activity className="h-5 w-5 mr-2 animate-pulse" /> {t("DISPATCHING UNITS...")}</>
                          ) : selectedAlert.status === "Investigating" ? (
                            <><ShieldCheck className="h-5 w-5 mr-2" /> {t("UNITS DEPLOYED (INVESTIGATING)")}</>
                          ) : (
                            <><Radio className="h-5 w-5 mr-2" /> {t("INITIATE DISPATCH & INVESTIGATE")}</>
                          )}
                        </Button>
                      )}
                      
                      {selectedAlert.status !== "Resolved" ? (
                        <Button 
                          onClick={() => updateAlertStatus(selectedAlert.id, "Resolved")}
                          variant="outline"
                          className="w-full h-12 text-sm font-bold border-border/50 hover:bg-brand-green/10 hover:text-brand-green hover:border-brand-green/30"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> {t("MARK AS RESOLVED")}
                        </Button>
                      ) : (
                        <div className="w-full h-12 flex items-center justify-center bg-brand-green/10 border border-brand-green/30 text-brand-green font-bold rounded-md">
                          <CheckCircle className="h-5 w-5 mr-2" /> {t("INCIDENT RESOLVED")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Visualization */}
                  <div className="h-full flex flex-col">
                    <Card className="glass-card h-full flex flex-col overflow-hidden">
                      <CardHeader className="pb-2 border-b border-border/30 bg-muted/10 flex-shrink-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Activity className="h-4 w-4" /> {t("Trajectory Telemetry")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: t("Prior 30 Days"), value: selectedAlert.prevMonth },
                            { name: t("Current 30 Days"), value: selectedAlert.currentMonth }
                          ]} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`grad-chart-${selectedAlert.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={getTierColorHex(selectedAlert.severity)} stopOpacity={0.8}/>
                                <stop offset="100%" stopColor={getTierColorHex(selectedAlert.severity)} stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                            <RechartsTooltip 
                              cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                              contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "12px" }}
                              itemStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                              {[0, 1].map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={index === 0 ? 'var(--muted-foreground)' : `url(#grad-chart-${selectedAlert.id})`} 
                                  opacity={index === 0 ? 0.4 : 1}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
