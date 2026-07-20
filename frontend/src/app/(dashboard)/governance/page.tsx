"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";
import { ShieldCheck, Users, Clock, CheckCircle2, AlertTriangle, Search, Eye, Lock, FileText, Activity } from "lucide-react";
import { brandColors } from "@/lib/design-tokens";
import { useLanguage } from "@/components/LanguageContext";

interface AuditEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  resource: string;
  timestamp: string;
  ip: string;
}

const roles = [
  { name: "Investigator", users: 24, permissions: ["View Cases", "Edit Own Cases", "View Network", "View Profiles"], color: brandColors.blue },
  { name: "Analyst", users: 12, permissions: ["View All Data", "Export Reports", "View Predictions", "View Financial"], color: brandColors.purple },
  { name: "Supervisor", users: 6, permissions: ["All Analyst Permissions", "Approve Cases", "Manage Team", "View Audit Log"], color: brandColors.teal },
  { name: "Policymaker", users: 3, permissions: ["View Dashboards", "View Trends", "View Forecasts", "Download Reports"], color: brandColors.amber },
];

const auditLog: AuditEntry[] = [
  { id: "AUD-001", user: "Soumyadip M.", role: "Supervisor", action: "Viewed", resource: "Offender Profile: Rajesh Kumar", timestamp: "2025-07-11 23:01:14", ip: "192.168.1.45" },
  { id: "AUD-002", user: "Priya S.", role: "Investigator", action: "Edited", resource: "FIR-2025-BLR-0847", timestamp: "2025-07-11 22:48:33", ip: "192.168.1.78" },
  { id: "AUD-003", user: "Rahul K.", role: "Analyst", action: "Exported", resource: "Crime Trend Report Q2 2025", timestamp: "2025-07-11 22:30:12", ip: "192.168.1.22" },
  { id: "AUD-004", user: "Deepa R.", role: "Policymaker", action: "Viewed", resource: "AI Prediction Dashboard", timestamp: "2025-07-11 22:15:55", ip: "10.0.0.5" },
  { id: "AUD-005", user: "Amit V.", role: "Investigator", action: "Viewed", resource: "Financial Trails: HDFC-****4521", timestamp: "2025-07-11 21:58:01", ip: "192.168.1.91" },
  { id: "AUD-006", user: "Soumyadip M.", role: "Supervisor", action: "Approved", resource: "Case Escalation: FIR-2025-BLR-1234", timestamp: "2025-07-11 21:45:20", ip: "192.168.1.45" },
  { id: "AUD-007", user: "Neha P.", role: "Analyst", action: "Accessed", resource: "Criminal Network Graph", timestamp: "2025-07-11 21:30:44", ip: "192.168.1.33" },
  { id: "AUD-008", user: "Vikram S.", role: "Investigator", action: "Downloaded", resource: "Chat History PDF", timestamp: "2025-07-11 21:12:08", ip: "192.168.1.67" },
];

const complianceItems = [
  { name: "Data Protection (DPDP Act 2023)", status: "compliant", detail: "All PII data encrypted at rest and in transit" },
  { name: "IT Act 2000 Compliance", status: "compliant", detail: "Audit logging enabled for all data access" },
  { name: "Role-Based Access Control", status: "compliant", detail: "4-tier RBAC with principle of least privilege" },
  { name: "Data Retention Policy", status: "review", detail: "Annual review scheduled for August 2025" },
  { name: "Incident Response Plan", status: "compliant", detail: "Last drill conducted: June 2025" },
  { name: "Third-Party Data Sharing", status: "compliant", detail: "No external data sharing without authorization" },
];

export default function GovernancePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"roles" | "audit" | "compliance">("roles");
  const [auditSearch, setAuditSearch] = useState("");

  const filteredAudit = auditLog.filter((entry) =>
    !auditSearch ||
    entry.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.resource.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.action.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const totalUsers = roles.reduce((sum, r) => sum + r.users, 0);
  const complianceScore = Math.round((complianceItems.filter((c) => c.status === "compliant").length / complianceItems.length) * 100);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3 text-foreground tracking-tight">
          <div className="p-2 bg-brand-teal/10 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-brand-teal" />
          </div>
          {t("Governance & Compliance")}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{t("Role-based access management, audit trails, and regulatory compliance dashboard.")}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t("Total Users"), value: totalUsers, icon: Users, color: "blue" },
          { label: t("Active Roles"), value: roles.length, icon: Lock, color: "purple" },
          { label: t("Audit Events"), value: auditLog.length, icon: Activity, color: "amber" },
          { label: t("Compliance"), value: `${complianceScore}%`, icon: ShieldCheck, color: "teal" },
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

      {/* Tab Switcher */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="flex gap-1.5 bg-muted/20 p-1 rounded-xl w-fit border border-border/50">
          {(["roles", "audit", "compliance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "roles" ? t("Role Management") : tab === "audit" ? t("Audit Log") : t("Compliance")}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === "roles" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2">
          {roles.map((role, i) => (
            <motion.div key={role.name} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i }}>
              <Card className="glass-card hover:!transform-none border-t-4" style={{ borderTopColor: role.color }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading font-bold text-foreground">{t(role.name)}</h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${role.color}15`, color: role.color }}>
                      {role.users} {t("users")}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("Permissions")}</p>
                    <div className="space-y-2">
                      {role.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-2 text-sm text-foreground/90">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-teal flex-shrink-0" />
                          {t(perm)}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === "audit" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("Search by user, action, or resource...")}
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm bg-muted/20 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Card className="glass-card hover:!transform-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/10 border-b border-border/50">
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("User")}</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Role")}</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Action")}</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Resource")}</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Time")}</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("IP")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredAudit.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{entry.user}</td>
                      <td className="p-4"><span className="text-xs font-bold px-2 py-1 rounded bg-muted/30">{t(entry.role)}</span></td>
                      <td className="p-4 text-foreground/80">{t(entry.action)}</td>
                      <td className="p-4 font-mono text-xs text-foreground/70 max-w-[200px] truncate">{entry.resource}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{entry.timestamp}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{entry.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === "compliance" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Compliance Score */}
          <Card className="glass-card hover:!transform-none border-t-4 border-t-brand-teal">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("Overall Compliance Score")}</p>
                  <p className="text-4xl font-sans font-bold text-brand-teal">{complianceScore}%</p>
                </div>
                <div className="p-4 rounded-full bg-brand-teal/10">
                  <ShieldCheck className="h-10 w-10 text-brand-teal" />
                </div>
              </div>
              <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${complianceScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, ${brandColors.teal}, ${brandColors.cyan})` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Compliance Checklist */}
          <div className="space-y-3">
            {complianceItems.map((item, i) => (
              <motion.div key={item.name} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 * i }}>
                <Card className="glass-card hover:!transform-none">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`p-2.5 rounded-full flex-shrink-0 ${item.status === "compliant" ? "bg-brand-teal/10" : "bg-brand-amber/10"}`}>
                      {item.status === "compliant" ? (
                        <CheckCircle2 className="h-5 w-5 text-brand-teal" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-brand-amber" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{t(item.name)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t(item.detail)}</p>
                    </div>
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded border flex-shrink-0 ${
                      item.status === "compliant" ? "text-brand-teal bg-brand-teal/10 border-brand-teal/30" : "text-brand-amber bg-brand-amber/10 border-brand-amber/30"
                    }`}>
                      {item.status === "compliant" ? t("Compliant") : t("Under Review")}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
