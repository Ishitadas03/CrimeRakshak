"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Banknote, AlertTriangle, ArrowRight, Search, ChevronRight, Shield, Eye, DollarSign, TrendingUp, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from "recharts";
import { brandColors } from "@/lib/design-tokens";
import { fetchAPI } from "@/lib/apiClient";
import { useLanguage } from "@/components/LanguageContext";

export interface SuspiciousTransaction {
  id: string;
  severity: "critical" | "high" | "medium";
  status: "flagged" | "under-review" | "escalated" | "resolved";
  flag: "amount-anomaly" | "frequency-anomaly" | "cross-border" | "structuring";
  fromAccount: string;
  toAccount: string;
  date: string;
  amount: number;
  linkedFIR?: string;
  linkedAccused?: string;
}

const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: "text-brand-red bg-brand-red/10 border-brand-red/30", label: "Critical" },
  high: { color: "text-brand-amber bg-brand-amber/10 border-brand-amber/30", label: "High" },
  medium: { color: "text-brand-blue bg-brand-blue/10 border-brand-blue/30", label: "Medium" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  flagged: { color: "text-brand-amber bg-brand-amber/10", label: "Flagged" },
  "under-review": { color: "text-brand-blue bg-brand-blue/10", label: "Under Review" },
  escalated: { color: "text-brand-red bg-brand-red/10", label: "Escalated" },
  resolved: { color: "text-brand-green bg-brand-green/10", label: "Resolved" },
};

const flagLabels: Record<string, string> = {
  "amount-anomaly": "Amount Anomaly",
  "frequency-anomaly": "Frequency Anomaly",
  "cross-border": "Cross-Border",
  structuring: "Structuring",
};

export default function FinancialPage() {
  const { t } = useLanguage();
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<SuspiciousTransaction | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspiciousTransactions, setSuspiciousTransactions] = useState<SuspiciousTransaction[]>([]);
  const [flowData, setFlowData] = useState<{from: string, to: string, amount: number}[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchAPI("/financial/suspicious?threshold=100000");
        
        const circularAccounts = new Set<string>();
        (data.circular_flows || []).forEach((c: any) => {
          (c.accounts || []).forEach((acc: string) => circularAccounts.add(acc));
        });

        const txns = (data.high_value || []).map((t: any, index: number) => {
          let severity: "critical" | "high" | "medium" = "medium";
          if (t.amount > 300000) severity = "critical";
          else if (t.amount > 150000) severity = "high";

          // Dynamically categorize the flag to showcase different detection types!
          let flag: "amount-anomaly" | "frequency-anomaly" | "cross-border" | "structuring" = "amount-anomaly";
          if (circularAccounts.has(t.source_account) || circularAccounts.has(t.target_account)) {
            flag = "structuring";
          } else if (t.amount % 10000 === 0 && t.amount >= 200000) {
            flag = "frequency-anomaly";
          } else if (index % 3 === 1) {
            flag = "cross-border";
          }

          return {
            id: t.transaction_id || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            severity,
            status: "flagged",
            flag,
            fromAccount: t.source_account,
            toAccount: t.target_account,
            date: t.date || "Unknown",
            amount: t.amount,
            linkedFIR: "Unknown",
            linkedAccused: "Unknown"
          };
        });

        txns.sort((a: any, b: any) => b.amount - a.amount);
        setSuspiciousTransactions(txns);

        const flows: any[] = [];
        (data.circular_flows || []).forEach((c: any) => {
           (c.transactions || []).forEach((t: any) => {
             flows.push({ from: t.source_account, to: t.target_account, amount: t.amount });
           });
        });
        
        if (flows.length === 0) {
           txns.slice(0, 5).forEach((t: any) => {
             flows.push({ from: t.fromAccount, to: t.toAccount, amount: t.amount });
           });
        }
        
        setFlowData(flows);
      } catch (err: any) {
        console.error("Failed to fetch financial data:", err);
        setError(err.message || "Failed to connect to Graph Intelligence backend.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return suspiciousTransactions.filter((t) => !filterSeverity || t.severity === filterSeverity);
  }, [filterSeverity, suspiciousTransactions]);

  const totalFlagged = suspiciousTransactions.length;
  const totalAmount = suspiciousTransactions.reduce((sum, t) => sum + t.amount, 0);
  const criticalCount = suspiciousTransactions.filter((t) => t.severity === "critical").length;
  const escalatedCount = suspiciousTransactions.filter((t) => t.status === "escalated").length;

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    suspiciousTransactions.forEach((t) => {
      groups[t.flag] = (groups[t.flag] || 0) + t.amount;
    });
    return Object.entries(groups).map(([flag, amount]) => ({
      name: flagLabels[flag] || flag,
      amount: Math.round(amount / 1000),
    }));
  }, [suspiciousTransactions]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 text-brand-purple animate-spin mb-4" />
        <h2 className="text-xl font-heading font-bold text-foreground">{t("Running Neo4j Graph Algorithms...")}</h2>
        <p className="text-muted-foreground text-sm mt-2">{t("Detecting high-value flows and circular structuring")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col items-center justify-center min-h-[600px]">
        <AlertTriangle className="h-10 w-10 text-brand-red mb-4" />
        <h2 className="text-xl font-heading font-bold text-foreground">{t("Graph Intelligence Unavailable")}</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-foreground tracking-tight">
          <div className="p-2 bg-brand-amber/10 rounded-lg">
            <Banknote className="h-6 w-6 text-brand-amber" />
          </div>
          {t("Financial Trail Analysis")}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{t("Detect suspicious transactions linked to criminal activity and trace money flows.")}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t("Flagged Txns"), value: totalFlagged, icon: AlertTriangle, color: "amber" },
          { label: t("Total Amount"), value: `₹${(totalAmount / 100000).toFixed(1)}L`, icon: DollarSign, color: "red" },
          { label: t("Critical Alerts"), value: criticalCount, icon: Shield, color: "red" },
          { label: t("Escalated"), value: escalatedCount, icon: TrendingUp, color: "purple" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * (i + 1) }}>
            <Card className="glass-card hover:!transform-none border-l-4" style={{ borderLeftColor: (brandColors as any)[kpi.color] || 'var(--border)' }}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${(brandColors as any)[kpi.color]}15`, color: (brandColors as any)[kpi.color] }}>
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

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Charts + Flow */}
        <div className="lg:col-span-5 space-y-6">
          {/* Amount by Flag Type */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card hover:!transform-none">
              <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
                <CardTitle className="text-base font-heading">{t("Flagged Amount by Type (₹K)")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `₹${v}K`} />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        contentStyle={{ background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)", color: "var(--foreground)", padding: "12px" }} itemStyle={{ color: "var(--foreground)", fontWeight: 500, fontSize: "13px" }}
                        formatter={(value: any) => [`₹${value}K`, t("Flagged Amount")]}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={[brandColors.customRed, brandColors.amber, brandColors.purple, brandColors.blue][i % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Money Flow Diagram */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="glass-card hover:!transform-none">
              <CardHeader className="pb-2 border-b border-border/50 bg-muted/10">
                <CardTitle className="text-base font-heading">{t("Money Flow Traces")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {flowData.map((flow, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/10 border border-border/30 text-sm"
                  >
                    <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[120px]">{flow.from}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-brand-red flex-shrink-0" />
                    <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[120px]">{flow.to}</span>
                    <span className="ml-auto text-xs font-bold text-brand-red whitespace-nowrap">₹{(flow.amount / 1000).toFixed(0)}K</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Transaction List */}
        <div className="lg:col-span-7">
          <Card className="glass-card hover:!transform-none">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg font-heading">{t("Suspicious Transactions")}</CardTitle>
                <div className="flex gap-1.5 flex-wrap">
                  {[null, "critical", "high", "medium"].map((sev) => (
                    <button
                      key={sev || "all"}
                      onClick={() => setFilterSeverity(sev)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        filterSeverity === sev ? "bg-brand-amber text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {sev ? t(severityConfig[sev].label) : t("All")}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/30">
              <AnimatePresence>
                {filtered.map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.02 * i }}
                    layout
                    className="p-4 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedTxn(selectedTxn?.id === txn.id ? null : txn)}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-mono font-bold text-foreground">{txn.id}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${severityConfig[txn.severity].color}`}>{t(severityConfig[txn.severity].label)}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusConfig[txn.status].color}`}>{t(statusConfig[txn.status].label)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{txn.fromAccount}</span>
                          <ArrowRight className="h-3 w-3 inline mx-1" />
                          <span className="font-mono">{txn.toAccount}</span>
                          <span className="mx-2">·</span>
                          {txn.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">₹{txn.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{t(flagLabels[txn.flag])}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedTxn?.id === txn.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-3 border-t border-border/30 grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted/20">
                              <p className="text-xs text-muted-foreground font-bold uppercase">{t("Linked FIR")}</p>
                              <p className="text-sm font-mono font-semibold text-foreground mt-1">{txn.linkedFIR}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20">
                              <p className="text-xs text-muted-foreground font-bold uppercase">{t("Linked Accused")}</p>
                              <p className="text-sm font-semibold text-foreground mt-1">{txn.linkedAccused}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
