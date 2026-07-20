"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { districtSocioProfiles, socialIndicatorCorrelations } from "@/data/sociologicalData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from "recharts";
import { Activity, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

export default function SocioRiskRadar() {
  const { t } = useLanguage();

  const radarData = districtSocioProfiles.map((d) => ({
    district: t(d.name),
    RiskScore: d.riskScore,
    Urbanization: d.urbanizationRate,
    Enforcement: d.cotpaEnforcementIndex,
  }));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Radar Chart */}
        <Card className="glass-card hover:!transform-none lg:col-span-5 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-purple" />
              {t("District Multi-Factor Sociological Radar")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6 flex-1 flex flex-col justify-center">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
                  <PolarAngleAxis
                    dataKey="district"
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
                    name={t("Sociological Risk Score")}
                    dataKey="RiskScore"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Radar
                    name={t("Urbanization Rate")}
                    dataKey="Urbanization"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1.5 text-brand-purple font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
                {t("Sociological Risk Index")}
              </span>
              <span className="flex items-center gap-1.5 text-brand-pink font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-pink" />
                {t("Urbanization Stress %")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Social Indicator Correlations */}
        <Card className="glass-card hover:!transform-none lg:col-span-7 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-amber" />
              {t("Macro Social Indicators & Public Health Impact")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="grid gap-3 sm:grid-cols-2">
              {socialIndicatorCorrelations.map((item) => (
                <div
                  key={item.indicator}
                  className="p-3.5 rounded-xl bg-muted/20 border border-border/40 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {t(item.indicator)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.impactLevel === "High Positive"
                          ? "bg-brand-red/15 text-brand-red border border-brand-red/30"
                          : item.impactLevel === "Moderate Positive"
                          ? "bg-brand-amber/15 text-brand-amber border border-brand-amber/30"
                          : "bg-brand-green/15 text-brand-green border border-brand-green/30"
                      }`}
                    >
                      {t(item.impactLevel)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(item.description)}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px]">
                    <span className="text-muted-foreground">{t("Correlation Coefficient")}</span>
                    <span className="font-mono font-bold text-foreground">
                      {item.correlationCoefficient > 0 ? "+" : ""}
                      {item.correlationCoefficient}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Action Policy Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-purple/15 to-transparent border border-brand-purple/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-brand-purple/20 text-brand-purple mt-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-foreground uppercase tracking-wide">
                  {t("AI Sociological Policy Recommendation")}
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "High urbanization corridors require targeted intervention combining public transit lighting, rapid response kiosks, and stringent COTPA enforcement to reduce street-level disturbance."
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
