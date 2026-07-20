"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopSurges, getTopDrops, type ClusterAlert } from "@/data/trendAnalyticsData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import { AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, ShieldCheck } from "lucide-react";

const severityStyles: Record<ClusterAlert["severity"], { badge: string; icon: string }> = {
  critical: { badge: "bg-red-500/15 text-red-400 border-red-500/30", icon: "text-red-500" },
  high: { badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: "text-orange-500" },
  moderate: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: "text-amber-500" },
  low: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: "text-blue-400" },
};

function AlertCard({ alert, index }: { alert: ClusterAlert; index: number }) {
  const { t } = useLanguage();
  const style = severityStyles[alert.severity];
  const isSurge = alert.direction === "surge";

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.9 + index * 0.1 }}
    >
      <Card className={`glass-card hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${isSurge ? "border-red-500/10" : "border-emerald-500/10"}`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${isSurge ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`} />

        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${isSurge ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
              {isSurge ? (
                <ShieldAlert className={`w-5 h-5 ${style.icon}`} />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-bold text-sm text-foreground truncate">
                  {t(alert.crimeHead)}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${style.badge}`}>
                  {t(alert.severity)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {t(alert.insight)}
              </p>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase">{t("Dec")}</span>
                  <span className="font-mono text-xs text-muted-foreground">{alert.prevValue.toLocaleString()}</span>
                </div>
                <div className={`flex items-center gap-0.5 ${isSurge ? "text-red-400" : "text-emerald-400"}`}>
                  {isSurge ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase">{t("Jan")}</span>
                  <span className="font-mono text-xs font-bold text-foreground">{alert.currentValue.toLocaleString()}</span>
                </div>
                <span className={`ml-auto font-mono text-sm font-bold ${isSurge ? "text-red-400" : "text-emerald-400"}`}>
                  {alert.changePercent > 0 ? "+" : ""}{alert.changePercent}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function EmergingClusterAlerts() {
  const { t } = useLanguage();
  const surges = getTopSurges(4);
  const drops = getTopDrops(3);

  return (
    <div className="space-y-4">
      {/* Surging Alerts */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.85 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="font-heading font-bold text-base text-foreground">{t("Emerging Crime Surges")}</h3>
          <span className="text-xs font-semibold text-brand-red bg-brand-red/10 px-2.5 py-0.5 rounded-full border border-brand-red/20">{t("Dec 2025 → Jan 2026 Shift")}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {surges.map((alert, i) => (
            <AlertCard key={alert.id} alert={alert} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Declining Alerts */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-heading font-bold text-base text-foreground">{t("Positive Trends (Declining)")}</h3>
          <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full border border-brand-green/20">{t("Dec 2025 → Jan 2026 Shift")}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {drops.map((alert, i) => (
            <AlertCard key={alert.id} alert={alert} index={i + 4} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
