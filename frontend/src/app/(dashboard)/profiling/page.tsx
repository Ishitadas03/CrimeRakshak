"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Fingerprint, AlertTriangle, Search, ChevronRight, Clock, MapPin, Shield,
  ArrowLeft, Activity, User, Ruler, Weight, Eye, Home, BadgeCheck, FileText,
  Scale, Gavel, Users, Phone, Sparkles, Brain, BookOpen, Briefcase, Droplet,
  FolderOpen, SortDesc
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from "recharts";
import { brandColors } from "@/lib/design-tokens";
import { offenders, type Offender } from "@/data/intelligenceData";
import { useLanguage } from "@/components/LanguageContext";
import CriminologyRecidivismMatrix from "./_components/CriminologyRecidivismMatrix";

// ─── Styles ──────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  active: "text-brand-green bg-brand-green/10 border-brand-green/30",
  jailed: "text-muted-foreground bg-muted/30 border-border",
  absconding: "text-brand-red bg-brand-red/10 border-brand-red/30",
  "on-bail": "text-brand-amber bg-brand-amber/10 border-brand-amber/30",
};

const statusDot: Record<string, string> = {
  active: "bg-brand-green",
  jailed: "bg-muted-foreground",
  absconding: "bg-brand-red",
  "on-bail": "bg-brand-amber",
};

type StatusFilter = "all" | "active" | "absconding" | "jailed" | "on-bail";
type RiskFilter = "all" | "high" | "habitual";
type SortOption = "risk" | "firs" | "recent" | "name";

// ─── Risk Meter ──────────────────────────────────────────────────────

function RiskMeter({ score }: { score: number }) {
  const color = score >= 80 ? brandColors.customRed : score >= 60 ? brandColors.amber : brandColors.teal;
  return (
    <div className="relative w-full h-3 bg-muted/30 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(to right, ${brandColors.teal}, ${color})` }}
      />
      <div className="absolute inset-0 flex items-center justify-end pr-2">
        <span className="text-[10px] font-bold text-foreground">{score}</span>
      </div>
    </div>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────

function OffenderDetail({ o, onBack }: { o: Offender; onBack: () => void }) {
  const { t } = useLanguage();
  // Radar chart data
  const radarData = [
    { subject: "Violence", value: o.crimeTypes.some(c => ["Assault", "Robbery", "Armed Robbery"].includes(c)) ? Math.min(o.riskScore + 5, 100) : Math.max(o.riskScore - 20, 15) },
    { subject: "Recidivism", value: Math.min(o.totalFIRs * 13, 100) },
    { subject: "Flight Risk", value: o.status === "absconding" ? 95 : o.status === "on-bail" ? 65 : o.status === "active" ? 50 : 20 },
    { subject: "Network", value: Math.min(o.associates.length * 35, 100) },
    { subject: "Sophistication", value: o.crimeTypes.some(c => ["Cybercrime", "Fraud", "White Collar Crime", "Identity Theft"].includes(c)) ? 85 : o.modusOperandi.length * 25 },
  ];

  // Find associate offender records
  const associateRecords = o.associates.map(name => offenders.find(off => off.name === name)).filter(Boolean) as Offender[];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("Back to Offender List")}
        </Button>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Card className="glass-card overflow-hidden relative border-brand-purple/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Mugshot */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-border/50 shadow-xl">
                  <Image
                    src={o.photo}
                    alt={o.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-background ${statusDot[o.status]}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight">{o.name}</h1>
                  {o.alias.length > 0 && (
                    <span className="text-sm text-muted-foreground italic">{t("a.k.a.")} {o.alias.join(", ")}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded border ${statusStyles[o.status]}`}>{t(o.status)}</span>
                  {o.isHabitual && <span className="text-xs font-bold uppercase px-2.5 py-1 rounded border border-brand-red/30 bg-brand-red/10 text-brand-red">{t("Habitual Offender")}</span>}
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/20 px-2.5 py-1 rounded border border-border/50">{t("ID:")} {o.id}</span>
                </div>

                {/* Physical Description Row */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{o.age}{t("y,")} {t(o.gender)}</span>
                  <span className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" />{o.height}</span>
                  <span className="flex items-center gap-1.5"><Weight className="h-3.5 w-3.5" />{o.weight}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{t(o.district)}</span>
                  <span className="flex items-center gap-1.5"><Droplet className="h-3.5 w-3.5" />{o.bloodGroup}</span>
                </div>

                {/* Crime type tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {o.crimeTypes.map((type) => (
                    <span key={type} className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">{t(type)}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Behavioral Banner (NEW) */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-purple/10 to-transparent border-l-4 border-brand-purple p-5 shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-16 w-16 text-brand-purple" />
          </div>
          <div className="relative z-10 flex gap-4">
            <div className="mt-1">
              <Sparkles className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-purple mb-1.5">{t("AI Behavioral Profile")}</h3>
              <p className="text-sm text-foreground/90 leading-relaxed">{t(o.aiBehavioralNote)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Row (EXPANDED to 8) */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: t("Total FIRs"), value: o.totalFIRs, icon: FileText, color: "brand-red" },
          { label: t("Convictions"), value: o.convictions, icon: Gavel, color: "brand-amber" },
          { label: t("Acquittals"), value: o.acquittals, icon: Scale, color: "brand-green" },
          { label: t("Pending"), value: o.pendingCases, icon: Clock, color: "brand-cyan" },
          { label: t("Victims"), value: o.victimCount, icon: Users, color: "brand-orange" },
          { label: t("Est. Loss"), value: o.estimatedLoss, icon: AlertTriangle, color: "brand-amber" },
          { label: t("Risk Score"), value: `${o.riskScore}/100`, icon: Activity, color: o.riskScore >= 80 ? "brand-red" : "brand-amber" },
          { label: t("Age"), value: o.age, icon: User, color: "brand-blue" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + (0.05 * i) }}>
            <Card className="glass-card hover:!transform-none h-full">
              <CardContent className="p-4 text-center flex flex-col justify-center h-full">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1.5">{kpi.label}</p>
                <p className={`text-xl sm:text-2xl font-sans font-bold text-foreground`}>{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expanded Profile Card */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card hover:!transform-none h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-brand-purple" /> {t("Identity & Background")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Fingerprint, label: "Fingerprint", value: o.fingerprint },
                  { icon: Shield, label: "National ID", value: o.nationalId },
                  { icon: User, label: "Father's Name", value: o.fatherName },
                  { icon: BookOpen, label: "Education", value: o.education },
                  { icon: Briefcase, label: "Occupation", value: o.occupation },
                  { icon: Phone, label: "Phone", value: o.phoneNumber },
                  { icon: Home, label: "Address", value: o.lastKnownAddress, full: true },
                  { icon: Eye, label: "Distinguishing Marks", value: o.scars.join("; "), full: true },
                ].map((item) => (
                  <div key={item.label} className={`flex items-start gap-3 ${item.full ? 'sm:col-span-2' : ''}`}>
                    <div className="p-2 rounded-lg bg-muted/30 flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(item.label)}</p>
                      <p className="text-sm text-foreground mt-0.5 break-words">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modus Operandi */}
              <div className="pt-3 border-t border-border/30 mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("Modus Operandi")}</p>
                <div className="space-y-2">
                  {o.modusOperandi.map((mo, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />
                      {t(mo)}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Crime Timeline & Frequency */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col gap-6">
          <Card className="glass-card hover:!transform-none flex-1">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-cyan" /> {t("Crime Timeline")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative space-y-0">
                {o.timeline.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="relative pl-8 pb-6 last:pb-0"
                  >
                    {i < o.timeline.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-0.5 h-full bg-border" />
                    )}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${i === o.timeline.length - 1 ? 'bg-brand-red/10 border-2 border-brand-red' : 'bg-muted border-2 border-border'}`}>
                      <div className={`w-2 h-2 rounded-full ${i === o.timeline.length - 1 ? 'bg-brand-red' : 'bg-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">{event.date}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{t(event.crime)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {t(event.location)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Crime Frequency Chart (NEW) */}
          <Card className="glass-card hover:!transform-none">
             <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-sm font-heading flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" /> {t("Crime Frequency (Annual)")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-6 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={o.frequencyByYear} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ background: "var(--card)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {o.frequencyByYear.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.count > 1 ? brandColors.customRed : brandColors.teal} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Radar, Traits, and Associates */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Psychological Traits (NEW) */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="lg:col-span-1">
          <Card className="glass-card hover:!transform-none h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Brain className="h-5 w-5 text-brand-purple" /> {t("Psych Trait Analysis")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {o.personalityTraits.map((t_item) => (
                  <div key={t_item.trait}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">{t(t_item.trait)}</span>
                      <span className="text-xs font-bold text-foreground">{t_item.score}</span>
                    </div>
                    <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${t_item.score}%`,
                          backgroundColor: t_item.score >= 80 ? brandColors.customRed : t_item.score >= 60 ? brandColors.amber : brandColors.teal
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Risk Radar Chart */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="lg:col-span-1">
          <Card className="glass-card hover:!transform-none h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand-red" /> {t("Operational Risk")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tickFormatter={(val) => t(val)} tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                        color: "var(--foreground)",
                        padding: "12px",
                      }}
                    />
                    <Radar name={t("Risk Profile")} dataKey="value" stroke={brandColors.customRed} fill={brandColors.customRed} fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Known Associates */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="lg:col-span-1">
          <Card className="glass-card hover:!transform-none h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-teal" /> {t("Known Associates")} ({o.associates.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {associateRecords.length > 0 ? associateRecords.map((assoc, i) => (
                <div
                  key={assoc.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/30 hover:border-brand-purple/30 hover:bg-muted/20 transition-all cursor-pointer"
                  onClick={() => onBack()}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                    <Image src={assoc.photo} alt={assoc.name} width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm truncate">{assoc.name}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{assoc.crimeTypes.map(c => t(c)).join(" · ")}</p>
                  </div>
                  <div className="w-16 flex-shrink-0">
                    <RiskMeter score={assoc.riskScore} />
                  </div>
                </div>
              )) : (
                o.associates.map((name, i) => (
                  <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/30">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted/30 text-muted-foreground flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t("No profile record")}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section: Court History & Linked FIRs */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Court History (NEW) */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="lg:col-span-1">
          <Card className="glass-card hover:!transform-none h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Gavel className="h-5 w-5 text-brand-amber" /> {t("Court History")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {o.courtDates.map((c, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        c.outcome === 'convicted' ? 'bg-brand-red' :
                        c.outcome === 'acquitted' ? 'bg-brand-green' :
                        c.outcome === 'pending' ? 'bg-brand-amber' : 'bg-muted-foreground'
                      }`} />
                      {i < o.courtDates.length - 1 && <div className="w-px h-full bg-border my-1" />}
                    </div>
                    <div className="pb-2 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{c.date}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{c.court}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{c.caseRef}</span>
                        <span className={`text-[10px] font-bold uppercase ${
                          c.outcome === 'convicted' ? 'text-brand-red' :
                          c.outcome === 'acquitted' ? 'text-brand-green' :
                          c.outcome === 'pending' ? 'text-brand-amber' : 'text-muted-foreground'
                        }`}>{t(c.outcome)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linked FIR Records (NEW) */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.0 }} className="lg:col-span-2">
          <Card className="glass-card hover:!transform-none h-full">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-brand-blue" /> {t("Linked FIR Records")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase text-muted-foreground bg-muted/5 border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">{t("FIR Number")}</th>
                      <th className="px-4 py-3 font-semibold">{t("Date")}</th>
                      <th className="px-4 py-3 font-semibold">{t("Crime")}</th>
                      <th className="px-4 py-3 font-semibold">{t("Section")}</th>
                      <th className="px-4 py-3 font-semibold">{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.linkedFIRs.map((fir, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground/80">{fir.firNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fir.date}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{t(fir.crime)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{fir.section}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            fir.status === 'convicted' ? statusStyles.absconding :
                            fir.status === 'charge-sheeted' ? statusStyles['on-bail'] :
                            fir.status === 'under-investigation' ? 'text-brand-blue bg-brand-blue/10 border-brand-blue/30' :
                            statusStyles.active
                          }`}>
                            {t(fir.status)}
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
      </div>
    </div>
  );
}

// ─── List View ───────────────────────────────────────────────────────

export default function ProfilingPage() {
  const { t } = useLanguage();
  const [selectedOffender, setSelectedOffender] = useState<Offender | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("risk"); // NEW

  // Filter
  const filtered = offenders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      o.name.toLowerCase().includes(q) ||
      o.alias.some(a => a.toLowerCase().includes(q)) ||
      o.crimeTypes.some(c => c.toLowerCase().includes(q)) ||
      o.district.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "high" && o.riskScore >= 80) ||
      (riskFilter === "habitual" && o.isHabitual);

    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "risk": return b.riskScore - a.riskScore;
      case "firs": return b.totalFIRs - a.totalFIRs;
      case "recent": return new Date(b.lastOffense).getTime() - new Date(a.lastOffense).getTime();
      case "name": return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const habitualCount = offenders.filter((o) => o.isHabitual).length;
  const highRiskCount = offenders.filter((o) => o.riskScore >= 80).length;
  const abscondingCount = offenders.filter((o) => o.status === "absconding").length;

  // Detail view
  if (selectedOffender) {
    return <OffenderDetail o={selectedOffender} onBack={() => setSelectedOffender(null)} />;
  }

  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: t("All"), value: "all" },
    { label: t("Active"), value: "active" },
    { label: t("Absconding"), value: "absconding" },
    { label: t("Jailed"), value: "jailed" },
    { label: t("On Bail"), value: "on-bail" },
  ];

  const riskFilters: { label: string; value: RiskFilter }[] = [
    { label: t("All Risk"), value: "all" },
    { label: t("High Risk"), value: "high" },
    { label: t("Habitual"), value: "habitual" },
  ];

  // List view
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-foreground tracking-tight">
          <div className="p-2 bg-brand-purple/10 rounded-lg">
            <Fingerprint className="h-6 w-6 text-brand-purple" />
          </div>
          {t("Offender Profiling")}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{t("Behavioral analysis, psychometric tracking, and historical case records.")}</p>
      </motion.div>

      {/* Feature 5: Criminology Recidivism & Modus Operandi Matrix */}
      <CriminologyRecidivismMatrix />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t("Total Profiled"), value: offenders.length, icon: Fingerprint, color: "brand-purple" },
          { label: t("High Risk"), value: highRiskCount, icon: AlertTriangle, color: "brand-red" },
          { label: t("Habitual"), value: habitualCount, icon: Activity, color: "brand-amber" },
          { label: t("Absconding"), value: abscondingCount, icon: Shield, color: "brand-red" },
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

      {/* Controls Bar (Search + Filters + Sort) */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("Search by name, alias, crime, district...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm bg-muted/20 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status filter pills */}
          <div className="flex gap-1 bg-muted/20 p-1 rounded-lg border border-border/30">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${statusFilter === f.value
                  ? "bg-brand-purple text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Risk filter pills */}
          <div className="flex gap-1 bg-muted/20 p-1 rounded-lg border border-border/30">
            {riskFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setRiskFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${riskFilter === f.value
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown (NEW) */}
          <div className="relative ml-auto lg:ml-2">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SortDesc className="h-4 w-4 text-muted-foreground" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-9 pr-8 py-2.5 text-sm font-semibold bg-muted/20 rounded-lg border border-border/30 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/30 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <option value="risk">{t("Sort: Risk Score (High → Low)")}</option>
              <option value="firs">{t("Sort: Total FIRs (High → Low)")}</option>
              <option value="recent">{t("Sort: Most Recent Offense")}</option>
              <option value="name">{t("Sort: Name (A-Z)")}</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="h-3 w-3 text-muted-foreground rotate-90" />
            </div>
          </div>
        </div>

      </motion.div>

      {/* Offender Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {sorted.map((offender, i) => (
            <motion.div
              key={offender.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.05 * i }}
              layout
            >
              <Card
                className="glass-card cursor-pointer hover:border-brand-purple/30 transition-all group"
                onClick={() => setSelectedOffender(offender)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Mugshot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-border/50 group-hover:border-brand-purple/30 transition-colors shadow-md">
                        <Image
                          src={offender.photo}
                          alt={offender.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${statusDot[offender.status]}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{offender.name}</h3>
                        {offender.isHabitual && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/20">{t("Habitual")}</span>}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusStyles[offender.status]}`}>{t(offender.status)}</span>
                      </div>
                      {offender.alias.length > 0 && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">{t("a.k.a.")} {offender.alias.join(", ")}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 truncate">{offender.crimeTypes.map(c => t(c)).join(" · ")}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{offender.totalFIRs} {t("Total FIRs").split(" ")[1]}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t(offender.district)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{offender.lastOffense}</span>
                      </div>
                    </div>

                    {/* Risk + Arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0 self-center">
                      <div className="w-24 hidden sm:block">
                        <RiskMeter score={offender.riskScore} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-purple transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {sorted.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-2">
            <Card className="glass-card border-dashed border-2 hover:!transform-none">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border/50">
                  <Search className="h-7 w-7 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-heading font-bold mb-1 text-foreground">{t("No Offenders Found")}</h3>
                <p className="text-muted-foreground text-sm">{t("Try adjusting your search or filters.")}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
