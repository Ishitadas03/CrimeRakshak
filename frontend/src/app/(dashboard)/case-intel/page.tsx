"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  FileSearch, Search, ArrowLeft, Clock, MapPin, Users, Scale, ChevronRight,
  Lightbulb, FileText, AlertTriangle, CheckCircle2, Target, Video,
  Smartphone, Briefcase, Calendar, Fingerprint, Activity, Banknote, SortDesc
} from "lucide-react";
import { brandColors } from "@/lib/design-tokens";
import { cases, type CaseRecord } from "@/data/intelligenceData";
import { useLanguage } from "@/components/LanguageContext";
import { fetchAPI } from "@/lib/apiClient";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  "under-investigation": { label: "Under Investigation", color: "text-brand-amber bg-brand-amber/10 border-brand-amber/30", icon: Clock },
  "charge-sheeted": { label: "Charge Sheeted", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/30", icon: FileText },
  "court-pending": { label: "Court Pending", color: "text-brand-purple bg-brand-purple/10 border-brand-purple/30", icon: Scale },
  "convicted": { label: "Convicted", color: "text-brand-green bg-brand-green/10 border-brand-green/30", icon: CheckCircle2 },
  "closed": { label: "Closed", color: "text-muted-foreground bg-muted/20 border-border", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  "critical": { label: "Critical", color: "text-brand-red bg-brand-red/10 border-brand-red/30" },
  "high": { label: "High", color: "text-brand-orange bg-brand-orange/10 border-brand-orange/30" },
  "medium": { label: "Medium", color: "text-brand-amber bg-brand-amber/10 border-brand-amber/30" },
  "low": { label: "Low", color: "text-muted-foreground bg-muted/20 border-border" },
};

type SortOption = "date" | "solvability" | "priority";
type PriorityFilter = "all" | "critical" | "high" | "medium" | "low";

function EvidenceIcon({ type }: { type: string }) {
  if (type.includes("CCTV") || type.includes("Video")) return <Video className="h-4 w-4" />;
  if (type.includes("Mobile") || type.includes("Digital") || type.includes("Phone")) return <Smartphone className="h-4 w-4" />;
  if (type.includes("Fingerprint") || type.includes("Print")) return <Fingerprint className="h-4 w-4" />;
  return <Briefcase className="h-4 w-4" />;
}

// ─── Detail View Component ───────────────────────────────────────────

function CaseDetail({ c, onBack }: { c: CaseRecord; onBack: () => void }) {
  const { t } = useLanguage();
  const [liveCase, setLiveCase] = useState<CaseRecord>(c);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      fetchAPI(`/graph/fir/${c.firNumber}`).catch(() => null),
      fetchAPI(`/graph/fir/${c.firNumber}/timeline`).catch(() => null),
      fetchAPI(`/graph/fir/${c.firNumber}/similar`).catch(() => null),
      fetchAPI(`/graph/fir/${c.firNumber}/leads`).catch(() => null)
    ])
      .then(([firProfile, timelineData, similarData, leadsData]) => {
        if (!mounted) return;

        let accusedList = c.accused;
        let victimVal = c.victim;
        let witnessCountVal = c.witnessCount || 0;
        let summaryVal = c.summary;
        let timelineList = c.timeline;
        let leadsList = c.leads;
        let similarList = c.similarCases;

        if (firProfile && !firProfile.error) {
          if (firProfile.accused) {
            accusedList = firProfile.accused.map((a: any) => a.properties?.name || a.id);
          }
          if (firProfile.victims) {
            victimVal = firProfile.victims.map((v: any) => v.properties?.name || v.id).join(", ");
          }
          if (firProfile.witnesses) {
            witnessCountVal = firProfile.witnesses.length;
          }
          if (firProfile.fir?.properties?.modus_operandi) {
            summaryVal = firProfile.fir.properties.modus_operandi;
          }
        }

        if (timelineData && !timelineData.error && timelineData.timeline) {
          timelineList = timelineData.timeline.map((ev: any) => ({
            date: ev.date || "",
            event: ev.event,
          }));
        }

        if (leadsData && !leadsData.error && leadsData.leads) {
          leadsList = leadsData.leads.map((l: any) => `${l.lead}: ${l.rationale}`);
        }

        if (similarData && !similarData.error && similarData.similar_cases) {
          similarList = similarData.similar_cases.map((s: any) => ({
            firNumber: s.fir_id,
            crimeType: s.reasons.join(", "),
            relation: `Match Score: ${s.score}`,
          }));
        }

        setLiveCase({
          ...c,
          accused: accusedList.length > 0 ? accusedList : c.accused,
          victim: victimVal || c.victim,
          witnessCount: witnessCountVal,
          summary: summaryVal || c.summary,
          timeline: timelineList.length > 0 ? timelineList : c.timeline,
          leads: leadsList.length > 0 ? leadsList : c.leads,
          similarCases: similarList.length > 0 ? similarList : c.similarCases,
          solvabilityScore: Math.min(98, 40 + (witnessCountVal * 10) + (accusedList.length * 10)),
        });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch live case details:", err);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [c.firNumber]);

  const st = statusConfig[liveCase.status] || statusConfig["under-investigation"];
  const pr = priorityConfig[liveCase.priority || "medium"];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("Back to Case List")}
        </Button>
      </motion.div>

      {/* Case Header & Solvability Banner */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Card className="glass-card overflow-hidden relative border-brand-blue/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
              {/* Left Info */}
              <div className="flex-1 min-w-0 z-10">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight font-mono">{liveCase.firNumber}</h1>
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded border ${pr.color}`}>
                    {t(pr.label)} {t("Priority")}
                  </span>
                </div>
                <p className="text-lg text-foreground/90 font-semibold mb-4">{t(liveCase.crimeType)}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded border ${st.color}`}>
                    {t(st.label)}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/20 px-2.5 py-1 rounded border border-border/50">{t("Section:")} {liveCase.section}</span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/20 px-2.5 py-1 rounded border border-border/50 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {t(liveCase.location)}
                  </span>
                </div>
              </div>

              {/* Right: Solvability Score (NEW) */}
              <div className="w-full lg:w-72 flex-shrink-0 z-10 bg-muted/10 p-5 rounded-2xl border border-border/50 shadow-inner">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-brand-teal" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {isLoading ? t("AI ANALYSING...") : t("AI Solvability")}
                    </span>
                  </div>
                  <span className="text-3xl font-bold text-foreground leading-none">
                    {isLoading ? "..." : `${liveCase.solvabilityScore || 0}%`}
                  </span>
                </div>
                <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden mt-3 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${liveCase.solvabilityScore || 0}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${brandColors.teal}, ${(liveCase.solvabilityScore || 0) >= 80 ? brandColors.green : (liveCase.solvabilityScore || 0) >= 50 ? brandColors.amber : brandColors.customRed})`
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Row (EXPANDED) */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: t("Date Filed"), value: liveCase.date, icon: Calendar, color: "brand-blue" },
          { label: t("IO Assigned"), value: liveCase.investigatingOfficer || t("Unassigned"), icon: Users, color: "brand-purple" },
          { label: t("Total Accused"), value: liveCase.accused.length, icon: Users, color: "brand-red" },
          { label: t("Witnesses"), value: liveCase.witnessCount || 0, icon: Users, color: "brand-amber" },
          { label: t("Recovered Assets"), value: liveCase.recoveredAssets || t("None"), icon: Banknote, color: "brand-green" },
          { label: t("Next Hearing"), value: liveCase.nextHearingDate || t("N/A"), icon: Scale, color: "brand-cyan" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + (0.05 * i) }}>
            <Card className="glass-card hover:!transform-none h-full">
              <CardContent className="p-4 text-center flex flex-col justify-center h-full">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
                  <kpi.icon className="h-3 w-3" /> {kpi.label}
                </p>
                <p className="text-sm md:text-base font-sans font-bold text-foreground truncate">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Narrative Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Insights & Summary (ENHANCED) */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card hover:!transform-none h-full">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Activity className="h-5 w-5 text-brand-blue" /> {t("Case Narrative & AI Analysis")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("Initial Summary")}</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-border/50 pl-4 py-1">{t(liveCase.summary)}</p>
                </div>
                
                {liveCase.aiAnalysis && (
                  <div className="bg-brand-blue/5 rounded-xl p-4 border border-brand-blue/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4" /> {t("AI Pattern Analysis")}
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">{t(liveCase.aiAnalysis)}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-1">{t("Accused")}</p>
                    <p className="text-sm font-semibold text-foreground">{liveCase.accused.join(", ") || t("None")}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-1">{t("Victim")}</p>
                    <p className="text-sm font-semibold text-foreground">{t(liveCase.victim)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Leads (ENHANCED) */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card hover:!transform-none border-t-4 border-t-brand-amber">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-brand-amber" /> {t("Recommended AI Leads")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("Generating leads from crime graph...")}</p>
                ) : liveCase.leads && liveCase.leads.length > 0 ? (
                  liveCase.leads.map((lead, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-brand-amber/30 hover:bg-brand-amber/5 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-amber/10 text-brand-amber flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground/90 font-medium group-hover:text-foreground transition-colors">{t(lead)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("No leads generated.")}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Timeline & Evidence */}
        <div className="space-y-6">
          
          {/* Evidence Locker (NEW) */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card hover:!transform-none h-full">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-brand-teal" /> {t("Evidence Locker")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {liveCase.evidence && liveCase.evidence.length > 0 ? (
                  liveCase.evidence.map((ev, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/10 border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-muted/30">
                            <EvidenceIcon type={ev.type} />
                          </div>
                          <span className="text-xs font-bold text-foreground">{t(ev.type)}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          ev.status === 'processed' ? 'text-brand-green bg-brand-green/10 border-brand-green/30' :
                          ev.status === 'at-forensics' ? 'text-brand-amber bg-brand-amber/10 border-brand-amber/30' :
                          'text-muted-foreground bg-muted/20 border-border/50'
                        }`}>
                          {t(ev.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t(ev.description)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("No evidence logged.")}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Investigation Timeline */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card hover:!transform-none">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand-purple" /> {t("Investigation Timeline")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative space-y-0">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("Generating timeline from crime history...")}</p>
                  ) : liveCase.timeline && liveCase.timeline.length > 0 ? (
                    liveCase.timeline.map((event, i) => (
                      <div key={i} className="relative pl-6 pb-5 last:pb-0">
                        {i < liveCase.timeline.length - 1 && <div className="absolute left-[9px] top-5 w-[2px] h-full bg-border" />}
                        <div className={`absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center ${i === liveCase.timeline.length - 1 ? 'bg-brand-purple/10 border-2 border-brand-purple' : 'bg-muted border-2 border-border'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${i === liveCase.timeline.length - 1 ? 'bg-brand-purple' : 'bg-muted-foreground'}`} />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{event.date}</p>
                        <p className="text-xs font-semibold text-foreground mt-0.5">{t(event.event)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("No timeline events logged.")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Main List View ──────────────────────────────────────────────────

export default function CaseIntelPage() {
  const { t } = useLanguage();
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [activeCases, setActiveCases] = useState<CaseRecord[]>(cases);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoadingList(true);
    fetchAPI("/graph/firs/list")
      .then((data) => {
        if (!mounted || !data) return;
        
        const mapped: CaseRecord[] = data.map((f: any) => {
          const mock = cases.find(m => m.firNumber === f.fir_id);
          return {
            firNumber: f.fir_id,
            crimeType: f.crime_type || "Unknown",
            section: f.sections || "IPC Section",
            status: f.status?.toLowerCase().replace(" ", "-") || "under-investigation",
            priority: mock?.priority || "medium",
            location: f.district || "Unknown District",
            date: f.date || "",
            summary: f.modus_operandi || "",
            accused: mock?.accused || [],
            victim: mock?.victim || "Unknown",
            solvabilityScore: mock?.solvabilityScore || 65,
            evidence: mock?.evidence || [],
            timeline: mock?.timeline || [],
            leads: mock?.leads || [],
            similarCases: mock?.similarCases || [],
            investigatingOfficer: mock?.investigatingOfficer || "IO Assigned",
            witnessCount: mock?.witnessCount || 0,
            recoveredAssets: mock?.recoveredAssets || "None",
            nextHearingDate: mock?.nextHearingDate || "N/A"
          };
        });
        
        if (mapped.length > 0) {
          setActiveCases(mapped);
        }
        setIsLoadingList(false);
      })
      .catch((err) => {
        console.error("Failed to load live cases, using mock data fallback:", err);
        setIsLoadingList(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Filter
  const filtered = activeCases.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      c.firNumber.toLowerCase().includes(q) ||
      c.accused.some((a) => a.toLowerCase().includes(q)) ||
      c.crimeType.toLowerCase().includes(q) ||
      (c.investigatingOfficer && c.investigatingOfficer.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "solvability": return (b.solvabilityScore || 0) - (a.solvabilityScore || 0);
      case "priority": {
        const priorityOrder: Record<string, number> = { "critical": 4, "high": 3, "medium": 2, "low": 1 };
        return (priorityOrder[b.priority || "medium"] || 0) - (priorityOrder[a.priority || "medium"] || 0);
      }
      case "date": return new Date(b.date).getTime() - new Date(a.date).getTime();
      default: return 0;
    }
  });

  const openCases = activeCases.filter((c) => c.status === "under-investigation").length;
  const criticalCases = activeCases.filter((c) => c.priority === "critical").length;
  const totalAccused = new Set(activeCases.flatMap((c) => c.accused)).size;

  if (selectedCase) {
    return <CaseDetail c={selectedCase} onBack={() => setSelectedCase(null)} />;
  }

  const priorityFilters: { label: string; value: PriorityFilter }[] = [
    { label: t("All Priority"), value: "all" },
    { label: t("Critical"), value: "critical" },
    { label: t("High"), value: "high" },
  ];

  const statusFilters = [
    { label: t("All Status"), value: "all" },
    { label: t("Investigating"), value: "under-investigation" },
    { label: t("In Court"), value: "court-pending" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-foreground tracking-tight">
          <div className="p-2 bg-brand-blue/10 rounded-lg">
            <FileSearch className="h-6 w-6 text-brand-blue" />
          </div>
          {t("Case Intelligence")}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{t("AI solvability tracking, evidence management, and smart investigation leads.")}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t("Total Cases"), value: activeCases.length, icon: FileText, color: "brand-blue" },
          { label: t("Active Investigations"), value: openCases, icon: Clock, color: "brand-amber" },
          { label: t("Critical Priority"), value: criticalCases, icon: AlertTriangle, color: "brand-red" },
          { label: t("Total Accused"), value: totalAccused, icon: Users, color: "brand-purple" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * (i + 1) }}>
            <Card className="glass-card hover:!transform-none border-l-4" style={{ borderLeftColor: (brandColors as any)[kpi.color.replace('brand-', '')] || 'var(--border)' }}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${kpi.color}/10 text-${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">{kpi.label}</p>
                  <p className="text-3xl font-sans font-bold text-foreground">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Controls Bar */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        
        {/* Search */}
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("Search FIR, Crime, Accused, IO...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm bg-muted/20 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Priority Filters */}
          <div className="flex gap-1 bg-muted/20 p-1 rounded-lg border border-border/30">
            {priorityFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setPriorityFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${priorityFilter === f.value
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 bg-muted/20 p-1 rounded-lg border border-border/30">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${statusFilter === f.value
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative ml-auto xl:ml-2">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SortDesc className="h-4 w-4 text-muted-foreground" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-9 pr-8 py-2.5 text-sm font-semibold bg-muted/20 rounded-lg border border-border/30 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <option value="date">{t("Sort: Newest First")}</option>
              <option value="solvability">{t("Sort: Solvability Score")}</option>
              <option value="priority">{t("Sort: Priority Level")}</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="h-3 w-3 text-muted-foreground rotate-90" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Case Grid (NEW GRID LAYOUT) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {sorted.map((caseItem, i) => {
            const st = statusConfig[caseItem.status];
            const pr = priorityConfig[caseItem.priority || "medium"];
            return (
              <motion.div
                key={caseItem.firNumber}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: 0.05 * i }}
                layout
              >
                <Card
                  className="glass-card cursor-pointer hover:border-brand-blue/30 transition-all group h-full flex flex-col"
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-mono font-bold text-foreground text-base tracking-tight">{caseItem.firNumber}</h3>
                        <p className="text-sm font-semibold text-foreground/90 mt-0.5 truncate">{t(caseItem.crimeType)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${pr.color}`}>{t(pr.label)}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${st.color}`}>{t(st.label)}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 mb-4 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{t(caseItem.location)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{caseItem.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{t("Accused:")} {caseItem.accused.join(", ")}</span>
                      </div>
                    </div>

                    {/* Footer Row (Solvability Meter) */}
                    <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-4 mt-auto">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                          <span>{t("Solvability")}</span>
                          <span className={caseItem.solvabilityScore >= 80 ? 'text-brand-green' : 'text-brand-amber'}>{caseItem.solvabilityScore || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${caseItem.solvabilityScore || 0}%`,
                              backgroundColor: (caseItem.solvabilityScore || 0) >= 80 ? brandColors.green : brandColors.amber
                            }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-blue transition-colors flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {sorted.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-2 xl:col-span-3">
            <Card className="glass-card border-dashed border-2 hover:!transform-none">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border/50">
                  <FileSearch className="h-7 w-7 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-heading font-bold mb-1 text-foreground">{t("No Cases Found")}</h3>
                <p className="text-muted-foreground text-sm">{t("Adjust your search criteria or filters.")}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
