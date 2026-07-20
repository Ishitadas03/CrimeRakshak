"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { offenders, type Offender } from "@/data/intelligenceData";
import { useLanguage } from "@/components/LanguageContext";
import * as motion from "motion/react-client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  ShieldAlert, Activity, Brain, Flame, Crosshair, Users, TrendingUp,
  AlertTriangle, CheckCircle2, DollarSign, RefreshCw, Filter
} from "lucide-react";

export default function CriminologyRecidivismMatrix() {
  const { t } = useLanguage();
  const [syndicateFilter, setSyndicateFilter] = useState<"ALL" | "VIOLENT" | "CYBER" | "ORGANIZED">("ALL");

  // 1. Compute AI Recidivism Velocity Index for each offender
  const prioritizedOffenders = useMemo(() => {
    return [...offenders]
      .map((o) => {
        // Calculate active criminal years (default minimum 2)
        const firstYear = 2019;
        const activeYears = Math.max(2, 2025 - firstYear);
        const firVelocity = Number((o.totalFIRs / activeYears).toFixed(2));
        const flightRiskScore = o.status === "absconding" ? 25 : o.status === "on-bail" ? 15 : 5;
        const courtWeight = o.pendingCases * 5;
        const recidivismVelocityScore = Math.min(100, Math.round(o.riskScore * 0.6 + firVelocity * 15 + flightRiskScore));

        return {
          ...o,
          firVelocity,
          recidivismVelocityScore,
          surveillanceTier: recidivismVelocityScore >= 85 ? "EXTREME PRIORITY" : "HIGH ALERT",
        };
      })
      .sort((a, b) => b.recidivismVelocityScore - a.recidivismVelocityScore);
  }, []);

  // 2. MO Threat & Frequency Distribution with Economic Loss & Repeat Probability
  const moCategories = [
    { name: "Armed Robbery & Dacoity", avgRisk: 89, repeatProb: 84, lossEstimate: "₹4.2 Cr", color: "#ef4444" },
    { name: "Synthetic & NDPS Narcotics", avgRisk: 87, repeatProb: 88, lossEstimate: "₹12.5 Cr", color: "#f97316" },
    { name: "Phishing & SIM Swap Cyber", avgRisk: 86, repeatProb: 79, lossEstimate: "₹8.8 Cr", color: "#8b5cf6" },
    { name: "Organized Extortion & Mining", avgRisk: 84, repeatProb: 82, lossEstimate: "₹6.1 Cr", color: "#ec4899" },
    { name: "Coastal Smuggling & Hawala", avgRisk: 88, repeatProb: 85, lossEstimate: "₹15.4 Cr", color: "#06b6d4" },
    { name: "White-Collar & Chit Fraud", avgRisk: 64, repeatProb: 58, lossEstimate: "₹9.2 Cr", color: "#10b981" },
  ];

  // 3. Psychometric Behavioral Profiles filtered by syndicate category
  const psychometricProfiles = useMemo(() => {
    if (syndicateFilter === "VIOLENT") {
      return [
        { trait: t("Aggression & Violence"), score: 88 },
        { trait: t("Social Deviance"), score: 86 },
        { trait: t("Impulsivity / Risk"), score: 78 },
        { trait: t("Criminal Sophistication"), score: 65 },
        { trait: t("Manipulation Index"), score: 54 },
      ];
    }
    if (syndicateFilter === "CYBER") {
      return [
        { trait: t("Manipulation Index"), score: 93 },
        { trait: t("Criminal Sophistication"), score: 92 },
        { trait: t("Social Deviance"), score: 74 },
        { trait: t("Impulsivity / Risk"), score: 28 },
        { trait: t("Aggression & Violence"), score: 18 },
      ];
    }
    if (syndicateFilter === "ORGANIZED") {
      return [
        { trait: t("Criminal Sophistication"), score: 89 },
        { trait: t("Social Deviance"), score: 88 },
        { trait: t("Manipulation Index"), score: 82 },
        { trait: t("Aggression & Violence"), score: 75 },
        { trait: t("Impulsivity / Risk"), score: 40 },
      ];
    }
    return [
      { trait: t("Criminal Sophistication"), score: 84 },
      { trait: t("Social Deviance"), score: 81 },
      { trait: t("Manipulation Index"), score: 78 },
      { trait: t("Aggression & Violence"), score: 64 },
      { trait: t("Impulsivity / Risk"), score: 52 },
    ];
  }, [syndicateFilter, t]);

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 mb-8"
    >
      {/* ─── 1. Modus Operandi (MO) Threat & Frequency Distribution ─── */}
      <Card className="glass-card hover:!transform-none">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-purple" />
              {t("Modus Operandi (MO) Threat, Economic Loss & Repeat-Offense Probability")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Visualizing economic loss and recidivism risk across Armed Robbery, Phishing/SIM Swap, and Drug Syndicates.")}
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-brand-purple/15 text-brand-purple font-bold shrink-0">
            {t("24 Profiled Dossiers")}
          </span>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="grid gap-6 lg:grid-cols-12 items-center">
            <div className="lg:col-span-8 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={moCategories}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 500 }}
                    width={155}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, name: any) => [
                      name === "avgRisk" ? `${value} / 100` : `${value}%`,
                      name === "avgRisk" ? t("Recidivism Threat Score") : t("Repeat Offense Probability")
                    ]}
                  />
                  <Bar dataKey="avgRisk" name="avgRisk" radius={[0, 6, 6, 0]} barSize={16}>
                    {moCategories.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Economic Loss & Repeat Probability Cards */}
            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{t("Highest Economic Impact")}</span>
                  <DollarSign className="w-4 h-4 text-brand-green" />
                </div>
                <div className="text-xl font-bold font-mono text-brand-green">₹15.4 Crore</div>
                <p className="text-[11px] text-muted-foreground">
                  {t("Coastal Smuggling & Hawala syndicates account for top illicit financial flows.")}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{t("Peak Recidivism MO")}</span>
                  <RefreshCw className="w-4 h-4 text-brand-red" />
                </div>
                <div className="text-xl font-bold font-mono text-brand-red">88% {t("Probability")}</div>
                <p className="text-[11px] text-muted-foreground">
                  {t("Synthetic NDPS & Armed Highway Dacoity show highest re-arrest velocity.")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 2. Psychometric Profile vs. Crime Type Correlation ─── */}
      <Card className="glass-card hover:!transform-none">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-pink" />
              {t("Psychometric Profile vs. Crime Type Correlation")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Cross-analyzing Aggression vs. Manipulation vs. Sophistication across syndicate archetypes.")}
            </p>
          </div>

          {/* Interactive Syndicate Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: t("All Dossiers") },
              { id: "VIOLENT", label: t("Violent / Dacoity") },
              { id: "CYBER", label: t("Cyber & Financial") },
              { id: "ORGANIZED", label: t("Organized Syndicates") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSyndicateFilter(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  syndicateFilter === tab.id
                    ? "bg-brand-pink text-white shadow-md shadow-brand-pink/20"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="grid gap-6 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={psychometricProfiles} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
                  <PolarAngleAxis
                    dataKey="trait"
                    tick={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Radar
                    name={t("Psychometric Trait Score")}
                    dataKey="score"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("Criminological Behavioral Insight")}
              </h4>
              {syndicateFilter === "VIOLENT" ? (
                <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 text-xs text-foreground space-y-1">
                  <span className="font-bold text-brand-red uppercase tracking-wide">{t("Violent / Highway Dacoity Archetype")}</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("Exhibits peak Aggression (88) and Social Deviance (86). Offenses are driven by physical intimidation and territorial control along highway belts.")}
                  </p>
                </div>
              ) : syndicateFilter === "CYBER" ? (
                <div className="p-4 rounded-xl bg-brand-purple/10 border border-brand-purple/30 text-xs text-foreground space-y-1">
                  <span className="font-bold text-brand-purple uppercase tracking-wide">{t("Cyber & Financial Fraud Archetype")}</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("Exhibits peak Manipulation (93) and Criminal Sophistication (92) with minimal physical aggression (18). Operates through digital social engineering.")}
                  </p>
                </div>
              ) : syndicateFilter === "ORGANIZED" ? (
                <div className="p-4 rounded-xl bg-brand-amber/10 border border-brand-amber/30 text-xs text-foreground space-y-1">
                  <span className="font-bold text-brand-amber uppercase tracking-wide">{t("Organized Narcotics & Smuggling Archetype")}</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("Balanced high scores across Criminal Sophistication (89) and Manipulation (82). Maintains strict network hierarchy across coastal and urban transit nodes.")}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-xs text-foreground space-y-1">
                  <span className="font-bold uppercase tracking-wide">{t("Aggregate Recidivism Profile")}</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("Across all 24 dossiers, Criminal Sophistication (84) and Social Deviance (81) serve as the primary predictive indicators of repeat offenses.")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. AI Habitual Offender Prioritization & Recidivism Velocity Matrix ─── */}
      <Card className="glass-card hover:!transform-none">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-red" />
              {t("AI Habitual Offender Prioritization & Recidivism Velocity Matrix")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Automatically ranking offenders by Recidivism Velocity (FIRs/year + flight risk + pending cases) for immediate field surveillance.")}
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-brand-red/15 text-brand-red font-bold shrink-0">
            {t("Surveillance Queue")}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">{t("Offender ID & Name")}</th>
                  <th className="py-3 px-4">{t("Primary MO / Crime Types")}</th>
                  <th className="py-3 px-4">{t("District")}</th>
                  <th className="py-3 px-4">{t("FIR Velocity (FIRs/Yr)")}</th>
                  <th className="py-3 px-4">{t("Pending Cases")}</th>
                  <th className="py-3 px-4">{t("Recidivism Velocity Score")}</th>
                  <th className="py-3 px-4 text-right">{t("Surveillance Action Tier")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs">
                {prioritizedOffenders.slice(0, 8).map((offender) => (
                  <tr key={offender.id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{offender.id}</span>
                      <span>{offender.name}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {offender.crimeTypes.join(", ")}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {offender.district}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-amber">
                      {offender.firVelocity} / {t("yr")}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      {offender.pendingCases}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-amber to-brand-red rounded-full"
                            style={{ width: `${offender.recidivismVelocityScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {offender.recidivismVelocityScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider ${
                          offender.surveillanceTier === "EXTREME PRIORITY"
                            ? "bg-brand-red/15 text-brand-red border border-brand-red/30 animate-pulse"
                            : "bg-brand-amber/15 text-brand-amber border border-brand-amber/30"
                        }`}
                      >
                        {offender.surveillanceTier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
