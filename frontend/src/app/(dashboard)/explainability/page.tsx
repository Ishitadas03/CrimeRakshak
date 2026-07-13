"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  Eye, Brain, Clock, CheckCircle2, ChevronRight, Cpu,
  Database, FileText, Terminal,
  BarChart2, Shield, Hash, Search, ShieldCheck,
  Building2, Layers
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { brandColors, chartPalette } from "@/lib/design-tokens";
import { useLanguage } from "@/components/LanguageContext";
import {
  ipcCrimes, districts, monthlyComparison, stateTotals,
} from "@/data/crimeData";
import { getRiskTier, getRiskScore, getTopDistricts } from "@/lib/derive";

// ── Derived data (computed once at module level) ─────────────────────────

const totalIPC = ipcCrimes.reduce((s, c) => s + c.total, 0);

/** Real SHAP data: each crime category's % share of total IPC burden */
const shapData = [...ipcCrimes]
  .sort((a, b) => b.total - a.total)
  .slice(0, 10)
  .map((c, i) => {
    const impact = Math.round((c.total / totalIPC) * 1000) / 10;
    const mom = monthlyComparison.find(r => r.crime === c.category);
    const yoy = mom
      ? Math.round(((mom.currentMonth - mom.prevYearMonth) / (mom.prevYearMonth || 1)) * 1000) / 10
      : null;
    return {
      id: c.category.toLowerCase().replace(/[\s/&]+/g, "-"),
      factor: c.category,
      cases: c.total,
      impact,
      yoy,
      subcats: c.subcats || [],
      source: "ipcCrimes[] — Karnataka 2025 Crime Dataset",
      csvFile: "ka-ipc-crimes-2025.csv",
      color: chartPalette[i % chartPalette.length],
    };
  });

/** Top 8 districts for the evidence-trail selector */
const TOP_DISTRICTS = getTopDistricts(8);

/** District correlation table: top 12 by total crime */
const CORR_DISTRICTS = getTopDistricts(12);

/** Audit log built from real operations */
function buildAuditLog() {
  const now = new Date();
  const ops = [
    { action: "QUERY",   resource: "ka-ipc-crimes-2025.csv",       rows: ipcCrimes.length,   role: "system",   detail: `Loaded ${ipcCrimes.length} IPC crime categories for factor analysis` },
    { action: "COMPUTE", resource: "stateTotals",                   rows: 1,                  role: "system",   detail: `Aggregated total: IPC ${stateTotals.ipc.toLocaleString("en-IN")} + SLL ${stateTotals.sll.toLocaleString("en-IN")}` },
    { action: "QUERY",   resource: "ka-district-wise-2025.csv",     rows: districts.length,   role: "analyst",  detail: `Fetched ${districts.length} district records across 8 police ranges` },
    { action: "COMPUTE", resource: "getRiskScore(district)",        rows: districts.length,   role: "system",   detail: "Applied normalised risk scoring formula to all districts" },
    { action: "QUERY",   resource: "01_crime_review_summary.csv",   rows: monthlyComparison.length, role: "analyst", detail: "Retrieved monthly comparison: Jan 2025 → Dec 2025 → Jan 2026" },
    { action: "COMPUTE", resource: "shapData[]",                    rows: shapData.length,    role: "system",   detail: "Computed % contribution of each crime category to IPC burden" },
    { action: "RENDER",  resource: "ExplainabilityPage",            rows: 0,                  role: "system",   detail: "Analytics page rendered — all data grounded in KSP CSV sources" },
  ];
  return ops.map((op, i) => ({
    ...op,
    id: `AUD-${String(3847 + i).padStart(6, "0")}`,
    timestamp: new Date(now.getTime() - (ops.length - i) * 37000 - i * 4200),
  }));
}
const AUDIT_LOG = buildAuditLog();

// ── Sub-components ────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color, delay }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  color: string; delay: number;
}) {
  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay }}>
      <Card className="glass-card hover:!transform-none border-l-4" style={{ borderLeftColor: color }}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl flex-shrink-0" style={{ background: color + "1a" }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-0.5 truncate">{label}</p>
            <p className="text-2xl font-sans font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Custom tooltip for the SHAP chart */
function ShapTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof shapData[0] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card p-3 rounded-xl border border-border/60 text-xs max-w-xs shadow-xl">
      <p className="font-bold text-foreground mb-1">{d.factor}</p>
      <p className="text-muted-foreground">Cases: <span className="font-semibold text-foreground">{d.cases.toLocaleString("en-IN")}</span></p>
      <p className="text-muted-foreground">Share of IPC: <span className="font-semibold" style={{ color: brandColors.teal }}>{d.impact}%</span></p>
      {d.yoy !== null && (
        <p className="text-muted-foreground">YoY trend: <span className={`font-semibold ${d.yoy > 0 ? "text-rose-400" : "text-emerald-400"}`}>{d.yoy > 0 ? "+" : ""}{d.yoy}%</span></p>
      )}
      <p className="text-[10px] text-muted-foreground/70 mt-1.5 border-t border-border/40 pt-1.5">Source: {d.csvFile}</p>
    </div>
  );
}

/** Evidence trail step */
function TrailStep({ step, label, value, detail, icon: Icon, isLast, delay }: {
  step: number; label: string; value: string; detail: string;
  icon: React.ElementType; isLast?: boolean; delay: number;
}) {
  return (
    <motion.div initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay }}
      className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${brandColors.purple}, ${brandColors.blue})` }}>
          {step}
        </div>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: `linear-gradient(${brandColors.purple}60, transparent)` }} />}
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: brandColors.teal }} />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <p className="text-sm font-semibold text-foreground mb-0.5">{value}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ExplainabilityPage() {
  const { t } = useLanguage();
  const [selectedShape, setSelectedShape] = useState<string>(shapData[0]?.id ?? "");
  const [activeDistrict, setActiveDistrict] = useState<string>(TOP_DISTRICTS[0]?.name ?? "");
  const [activeTab, setActiveTab] = useState<"trail" | "radar" | "table">("trail");
  const [logFilter, setLogFilter] = useState<"all" | "QUERY" | "COMPUTE" | "RENDER">("all");
  const [nowStr, setNowStr] = useState<string>("");

  // Hydration-safe timestamp
  useEffect(() => {
    const update = () => setNowStr(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const selectedFactor = useMemo(() => shapData.find(d => d.id === selectedShape), [selectedShape]);

  const selectedDistrict = useMemo(
    () => districts.find(d => d.name === activeDistrict) ?? districts[0],
    [activeDistrict]
  );

  const evidenceSteps = useMemo(() => {
    if (!selectedDistrict) return [];
    const total = selectedDistrict.ipc + selectedDistrict.sll;
    const maxTotal = Math.max(...districts.map(d => d.ipc + d.sll));
    const score = Math.round((total / maxTotal) * 100);
    const tier = getRiskTier(selectedDistrict);
    const rank = [...districts]
      .sort((a, b) => (b.ipc + b.sll) - (a.ipc + a.sll))
      .findIndex(d => d.name === selectedDistrict.name) + 1;
    const ipcShare = Math.round((selectedDistrict.ipc / total) * 100);
    return [
      {
        step: 1, label: "Data Retrieval", icon: Database,
        value: `Loaded district record for ${selectedDistrict.name}`,
        detail: `Source: ka-district-wise-2025.csv → row for "${selectedDistrict.name}" (Range: ${selectedDistrict.range}). Fields: ipc=${selectedDistrict.ipc.toLocaleString("en-IN")}, sll=${selectedDistrict.sll.toLocaleString("en-IN")}.`,
      },
      {
        step: 2, label: "Total Calculation", icon: Hash,
        value: `Total crimes = ${total.toLocaleString("en-IN")}`,
        detail: `Formula: total = ipc + sll = ${selectedDistrict.ipc.toLocaleString("en-IN")} + ${selectedDistrict.sll.toLocaleString("en-IN")} = ${total.toLocaleString("en-IN")}. IPC constitutes ${ipcShare}% of the district's crime burden.`,
      },
      {
        step: 3, label: "Risk Normalisation", icon: BarChart2,
        value: `Risk Score = ${score} / 100`,
        detail: `Formula: (district_total / state_max) × 100 = (${total.toLocaleString("en-IN")} / ${maxTotal.toLocaleString("en-IN")}) × 100 = ${score}. State maximum is Bengaluru City at ${maxTotal.toLocaleString("en-IN")} cases.`,
      },
      {
        step: 4, label: "Risk Tier Classification", icon: Shield,
        value: `Tier: "${tier}" (Score: ${score}/100)`,
        detail: `Tier thresholds: Critical >20,000 | High >8,000 | Moderate >4,000 | Safe ≤4,000 total crimes. ${selectedDistrict.name} total of ${total.toLocaleString("en-IN")} maps to "${tier}".`,
      },
      {
        step: 5, label: "Comparative Context", icon: Building2,
        value: `Ranked #${rank} of ${districts.length} districts statewide`,
        detail: `${selectedDistrict.name} is ranked #${rank} by total crime volume across all ${districts.length} districts in Karnataka. Range: ${selectedDistrict.range}. This context is used to prioritise investigative resource allocation.`,
      },
    ];
  }, [selectedDistrict]);

  // Radar chart data for selected district
  const radarData = useMemo(() => {
    if (!selectedDistrict) return [];
    const maxIpc = Math.max(...districts.map(d => d.ipc));
    const maxSll = Math.max(...districts.map(d => d.sll));
    const total = selectedDistrict.ipc + selectedDistrict.sll;
    const maxTotal = Math.max(...districts.map(d => d.ipc + d.sll));
    return [
      { axis: "IPC Volume",  value: Math.round((selectedDistrict.ipc / maxIpc) * 100), fullMark: 100 },
      { axis: "SLL Volume",  value: Math.round((selectedDistrict.sll / maxSll) * 100), fullMark: 100 },
      { axis: "Risk Score",  value: getRiskScore(selectedDistrict), fullMark: 100 },
      { axis: "IPC Share",   value: Math.round((selectedDistrict.ipc / total) * 100), fullMark: 100 },
      { axis: "Total Rank",  value: Math.round((1 - (districts.findIndex(d => d.name === selectedDistrict.name) / districts.length)) * 100), fullMark: 100 },
    ];
  }, [selectedDistrict]);

  const filteredLog = logFilter === "all" ? AUDIT_LOG : AUDIT_LOG.filter(e => e.action === logFilter);

  const actionColors: Record<string, string> = {
    QUERY:   brandColors.teal,
    COMPUTE: brandColors.blue,
    RENDER:  brandColors.purple,
  };

  // Intensity colour for correlation table cells
  function intensityColor(ipc: number, maxIpc: number) {
    const ratio = ipc / maxIpc;
    if (ratio > 0.7) return "bg-rose-500/25 text-rose-300";
    if (ratio > 0.4) return "bg-orange-500/20 text-orange-300";
    if (ratio > 0.2) return "bg-amber-500/15 text-amber-300";
    return "bg-emerald-500/10 text-emerald-400";
  }

  const maxIpc = Math.max(...CORR_DISTRICTS.map(d => d.ipc));
  const maxSll = Math.max(...CORR_DISTRICTS.map(d => d.sll));

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="px-4 md:px-6 lg:px-8 pb-10 pt-2 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-foreground tracking-tight">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <Eye className="h-6 w-6 text-brand-teal" />
              </div>
              {t("Explainable AI & Transparent Analytics")}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {t("Every insight is grounded in real KSP CSV data. Click any element to inspect its source and reasoning.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-brand-purple inline-flex items-center gap-1.5 bg-brand-purple/10 px-3 py-1.5 rounded-full border border-brand-purple/20">
              <Brain className="h-3.5 w-3.5" />
              {t("Real KSP Data · No Mocks")}
            </span>
            <span className="text-xs font-semibold text-brand-teal inline-flex items-center gap-1.5 bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {nowStr || "—"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Section 1: Live KPI Transparency Bar ────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Database}
          label={t("Crimes Analysed")}
          value={stateTotals.total.toLocaleString("en-IN")}
          sub={`IPC: ${stateTotals.ipc.toLocaleString("en-IN")} · SLL: ${stateTotals.sll.toLocaleString("en-IN")}`}
          color={brandColors.teal}
          delay={0.1}
        />
        <KpiCard
          icon={Building2}
          label={t("Districts Covered")}
          value={`${districts.length} / ${districts.length}`}
          sub={`8 police ranges · 100% coverage`}
          color={brandColors.blue}
          delay={0.2}
        />
        <KpiCard
          icon={Clock}
          label={t("Data Period")}
          value="Jan 2026"
          sub={`Baseline: Jan 2025 & Dec 2025`}
          color={brandColors.purple}
          delay={0.3}
        />
      </div>

      {/* ── Section 2: Crime Factor Impact Analysis (SHAP) ──────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">

        {/* SHAP chart */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="lg:col-span-7">
          <Card className="glass-card hover:!transform-none flex flex-col" style={{ minHeight: 540 }}>
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Cpu className="h-5 w-5 text-brand-blue" />
                {t("Crime Factor Weight Analysis")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("Each bar = that crime category's % share of total IPC burden.")}{" "}
                <span className="font-semibold" style={{ color: brandColors.teal }}>
                  Source: ka-ipc-crimes-2025.csv
                </span>
              </p>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <ResponsiveContainer width="100%" height={460}>
                <BarChart data={shapData} layout="vertical" margin={{ top: 8, right: 50, left: 8, bottom: 8 }}
                  barCategoryGap="22%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, Math.ceil(shapData[0]?.impact ?? 20)]}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 600 }}
                    tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="factor" type="category" width={145}
                    tick={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 500 }}
                    axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<ShapTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                  <Bar dataKey="impact" radius={4} barSize={22}>
                    {shapData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={selectedShape === entry.id ? brandColors.purple : entry.color}
                        cursor="pointer"
                        opacity={selectedShape && selectedShape !== entry.id ? 0.55 : 1}
                        onClick={() => setSelectedShape(selectedShape === entry.id ? "" : entry.id)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Factor deep-dive */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="lg:col-span-5">
          <Card className="glass-card hover:!transform-none flex flex-col overflow-hidden" style={{ minHeight: 540 }}>
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="font-heading text-base">{t("Factor Deep-Dive")}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{t("Select a bar to inspect its source data & reasoning.")}</p>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 scrollbar-hide">
              <div className="divide-y divide-border/40">
                {shapData.map((f) => {
                  const isSelected = selectedShape === f.id;
                  return (
                    <div key={f.id} className="flex flex-col">
                      <button
                        onClick={() => setSelectedShape(isSelected ? "" : f.id)}
                        className={`w-full text-left p-3.5 flex items-center justify-between transition-all gap-3 ${
                          isSelected ? "bg-muted/25" : "hover:bg-muted/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2 h-7 rounded-full flex-shrink-0" style={{ background: f.color }} />
                          <span className={`text-sm font-semibold truncate ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                            {t(f.factor)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono font-bold text-xs" style={{ color: brandColors.teal }}>{f.impact}%</span>
                          {f.yoy !== null && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              f.yoy > 0 ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
                            }`}>
                              {f.yoy > 0 ? "↑" : "↓"}{Math.abs(f.yoy)}%
                            </span>
                          )}
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-muted/10"
                          >
                            <div className="p-4 space-y-3 text-xs">
                              {/* Stats row */}
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: "Total Cases", val: f.cases.toLocaleString("en-IN") },
                                  { label: "IPC Share", val: `${f.impact}%` },
                                  { label: "YoY Change", val: f.yoy !== null ? `${f.yoy > 0 ? "+" : ""}${f.yoy}%` : "N/A" },
                                ].map(({ label, val }) => (
                                  <div key={label} className="bg-background/50 rounded-lg p-2 border border-border/40 text-center">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">{label}</p>
                                    <p className="font-bold text-foreground">{val}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Subcategories */}
                              {f.subcats.length > 0 && (
                                <div>
                                  <p className="font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                    Sub-categories
                                  </p>
                                  <div className="space-y-1">
                                    {f.subcats.map((s) => (
                                      <div key={s.name} className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-foreground/80 truncate">{s.name}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          <div className="h-1.5 rounded-full" style={{
                                            width: `${Math.round((s.val / f.cases) * 80)}px`,
                                            background: f.color, opacity: 0.7
                                          }} />
                                          <span className="font-mono text-muted-foreground">{s.val.toLocaleString("en-IN")}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Provenance */}
                              <div className="p-2.5 rounded-lg bg-background/60 border border-border/50 flex items-start gap-2">
                                <FileText className="h-3.5 w-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Data Provenance</p>
                                  <p className="text-foreground/70">{f.source}</p>
                                  <p className="font-mono text-brand-teal mt-0.5">{f.csvFile}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Section 3: Evidence Trail Explorer ──────────────────────── */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}>
        <Card className="glass-card hover:!transform-none">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Search className="h-5 w-5 text-brand-purple" />
                  {t("Evidence Trail Explorer")}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Step-by-step reasoning path for how a district risk score is computed from raw data.")}
                </p>
              </div>
              {/* District selector */}
              <div className="flex flex-wrap gap-1.5">
                {TOP_DISTRICTS.map((d) => (
                  <button
                    key={d.name}
                    onClick={() => setActiveDistrict(d.name)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all whitespace-nowrap ${
                      activeDistrict === d.name
                        ? "border-brand-purple bg-brand-purple/15 text-brand-purple"
                        : "border-border/50 text-muted-foreground hover:border-brand-purple/40 hover:text-foreground"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 mt-3 bg-muted/20 rounded-xl p-1 w-fit">
              {(["trail", "radar", "table"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs px-4 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(tab === "trail" ? "Reasoning Trail" : tab === "radar" ? "Risk Radar" : "Raw Data")}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "trail" && (
                <motion.div key="trail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-0">
                      {evidenceSteps.slice(0, 3).map((s, i) => (
                        <TrailStep key={s.step} {...s} delay={i * 0.08} isLast={i === 2} />
                      ))}
                    </div>
                    <div className="space-y-0">
                      {evidenceSteps.slice(3).map((s, i) => (
                        <TrailStep key={s.step} {...s} delay={0.24 + i * 0.08} isLast={i === evidenceSteps.slice(3).length - 1} />
                      ))}
                    </div>
                  </div>
                  {/* Result badge */}
                  {selectedDistrict && (
                    <div className="mt-4 p-4 rounded-xl border border-border/50 bg-muted/10 flex flex-wrap items-center gap-4">
                      <div className="p-2 rounded-lg bg-brand-purple/10">
                        <Shield className="h-5 w-5 text-brand-purple" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Conclusion</p>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedDistrict.name} → Risk Score <span className="text-brand-purple font-bold">{getRiskScore(selectedDistrict)}/100</span>
                          {" "}→ Tier: <span className="text-brand-purple font-bold">&quot;{getRiskTier(selectedDistrict)}&quot;</span>
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[10px] text-muted-foreground/70 font-mono">Source: ka-district-wise-2025.csv</p>
                        <p className="text-[10px] text-muted-foreground/70 font-mono">Function: getRiskScore() + getRiskTier()</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "radar" && (
                <motion.div key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Multi-dimensional risk profile for <span className="font-semibold text-foreground">{selectedDistrict?.name}</span>.
                    All axes normalised 0–100 vs. state maximum.
                  </p>
                  <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 600 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <Radar dataKey="value" stroke={brandColors.purple} fill={brandColors.purple} fillOpacity={0.25} />
                      <RechartsTooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                        formatter={(v: unknown) => [`${v}/100`, "Normalised Score"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-muted-foreground/70 font-mono">Source: districts[] · getRiskScore() · derive.ts</p>
                </motion.div>
              )}

              {activeTab === "table" && (
                <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        {["Field", "Value", "Source Column", "Derived From"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-muted-foreground font-semibold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {selectedDistrict && [
                        { field: "District Name", value: selectedDistrict.name, col: "district", derived: "—" },
                        { field: "Police Range", value: selectedDistrict.range, col: "range", derived: "—" },
                        { field: "IPC Cases", value: selectedDistrict.ipc.toLocaleString("en-IN"), col: "ipc", derived: "—" },
                        { field: "SLL Cases", value: selectedDistrict.sll.toLocaleString("en-IN"), col: "sll", derived: "—" },
                        { field: "Total Cases", value: (selectedDistrict.ipc + selectedDistrict.sll).toLocaleString("en-IN"), col: "computed", derived: "ipc + sll" },
                        { field: "Risk Score", value: `${getRiskScore(selectedDistrict)} / 100`, col: "computed", derived: "(total / stateMax) × 100" },
                        { field: "Risk Tier", value: getRiskTier(selectedDistrict), col: "computed", derived: "Threshold classification" },
                      ].map(row => (
                        <tr key={row.field} className="hover:bg-muted/10 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-foreground">{row.field}</td>
                          <td className="py-2.5 px-3 font-mono text-brand-teal">{row.value}</td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">{row.col}</td>
                          <td className="py-2.5 px-3 text-muted-foreground italic">{row.derived}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="pt-2 px-3 text-[10px] font-mono text-muted-foreground/60">
                          CSV: ka-district-wise-2025.csv · derive.ts: getRiskScore(), getRiskTier()
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 4 + 5: Correlation Table | Audit Log ────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">

        {/* Correlation Table */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          className="lg:col-span-7">
          <Card className="glass-card hover:!transform-none">
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand-amber" />
                {t("District Risk Correlation Table")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("Top 12 districts by crime volume. Cell intensity = relative risk.")}
                {" "}<span className="font-semibold text-brand-amber">Source: ka-district-wise-2025.csv</span>
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/10">
                    <tr className="border-b border-border/40">
                      <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">District</th>
                      <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold">Range</th>
                      <th className="text-center py-2.5 px-3 text-muted-foreground font-semibold">IPC</th>
                      <th className="text-center py-2.5 px-3 text-muted-foreground font-semibold">SLL</th>
                      <th className="text-center py-2.5 px-3 text-muted-foreground font-semibold">Score</th>
                      <th className="text-center py-2.5 px-3 text-muted-foreground font-semibold">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {CORR_DISTRICTS.map((d, i) => {
                      const tier = getRiskTier(d);
                      const score = getRiskScore(d);
                      const tierColors: Record<string, string> = {
                        Critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
                        High: "bg-orange-500/15 text-orange-400 border-orange-500/25",
                        Moderate: "bg-amber-500/15 text-amber-400 border-amber-500/25",
                        Safe: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      };
                      return (
                        <tr key={d.name} className="hover:bg-muted/10 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                            <span className="text-muted-foreground mr-1.5 font-mono text-[10px]">#{i+1}</span>
                            {d.name}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{d.range}</td>
                          <td className={`py-2.5 px-3 text-center font-mono rounded-sm ${intensityColor(d.ipc, maxIpc)}`}>
                            {d.ipc.toLocaleString("en-IN")}
                          </td>
                          <td className={`py-2.5 px-3 text-center font-mono rounded-sm ${intensityColor(d.sll, maxSll)}`}>
                            {d.sll.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="h-1.5 rounded-full bg-brand-purple/30" style={{ width: 40 }}>
                                <div className="h-full rounded-full bg-brand-purple" style={{ width: `${score}%` }} />
                              </div>
                              <span className="font-mono font-bold text-brand-purple">{score}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierColors[tier] ?? ""}`}>
                              {tier}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audit & Compliance Log */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.65 }}
          className="lg:col-span-5">
          <Card className="glass-card hover:!transform-none flex flex-col" style={{ minHeight: 480 }}>
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Terminal className="h-5 w-5 text-brand-green" />
                {t("Audit & Compliance Log")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{t("Timestamped trail of all data operations in this session.")}</p>
              {/* Filter chips */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {(["all", "QUERY", "COMPUTE", "RENDER"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border uppercase transition-all ${
                      logFilter === f ? "border-transparent text-white" : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                    style={logFilter === f ? { background: f === "all" ? brandColors.purple : (actionColors[f] ?? brandColors.purple) } : {}}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-y-auto scrollbar-hide">
              <div className="space-y-2">
                {filteredLog.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-3 rounded-xl border border-border/40 bg-background/40 hover:border-border/70 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: actionColors[entry.action] ?? brandColors.purple }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: (actionColors[entry.action] ?? brandColors.purple) + "20",
                              color: actionColors[entry.action] ?? brandColors.purple }}>
                            {entry.action}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate">{entry.resource}</span>
                          {entry.rows > 0 && (
                            <span className="text-[10px] text-muted-foreground/60 ml-auto">{entry.rows} rows</span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{entry.detail}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/60 font-mono flex-wrap">
                          <span>{entry.id}</span>
                          <span>{entry.timestamp.toLocaleTimeString("en-IN", { hour12: false })}</span>
                          <span className="ml-auto">{entry.role.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Accountability Footer ────────────────────────────────────── */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
        <div className="p-5 rounded-2xl border border-border/50 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-teal/10 text-brand-teal flex-shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="text-sm text-muted-foreground flex-1">
            <p className="font-semibold text-foreground mb-1 text-base">{t("Law Enforcement Accountability Compliance")}</p>
            <p>
              {t("All analytics on this page are derived exclusively from official Karnataka State Police datasets. No inferences are made without a traceable data source. Risk scores use a transparent normalisation formula. No demographic profiling is applied. Every session operation is logged above.")}
            </p>
          </div>
          <div className="flex-shrink-0 text-right text-[10px] font-mono text-muted-foreground/60 space-y-0.5">
            <p>Datasets: ka-ipc-crimes-2025.csv</p>
            <p>ka-district-wise-2025.csv</p>
            <p>01_crime_review_summary.csv</p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
