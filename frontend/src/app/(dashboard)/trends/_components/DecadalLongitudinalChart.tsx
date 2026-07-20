"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  karnatakaStateDecadalSeries,
  districtDecadalProfiles,
  type DecadalTrendPoint,
} from "@/data/longitudinalData";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Calendar, ArrowUpRight, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

type MetricKey = "totalIpc" | "sll" | "cyber" | "theft" | "violentCrime" | "murder";

export function DecadalLongitudinalChart({ series = karnatakaStateDecadalSeries }: { series?: DecadalTrendPoint[] }) {
  const { t } = useLanguage();
  const [metric, setMetric] = useState<MetricKey>("totalIpc");

  const metricLabels: Record<MetricKey, { name: string; color: string }> = {
    totalIpc: { name: "Total IPC Crime Volume", color: "#8b5cf6" },
    sll: { name: "Special & Local Laws (SLL)", color: "#10b981" },
    cyber: { name: "Cyber & Digital Frauds", color: "#c084fc" },
    theft: { name: "Property Theft & Burglary", color: "#f59e0b" },
    violentCrime: { name: "Violent Body Offences", color: "#ec4899" },
    murder: { name: "Homicide & Murder", color: "#ef4444" },
  };

  return (
    <Card className="glass-card overflow-hidden border-border/50 shadow-lg">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-brand-purple/15 text-brand-purple border border-brand-purple/30">
                {t("NCRB 25-YEAR SERIES")}
              </span>
              <span className="text-xs text-muted-foreground">
                2001 – 2028 (Grounded in Historical KSP Archive)
              </span>
            </div>
            <CardTitle className="text-lg font-heading mt-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-purple" />
                {t("Multi-Decade Longitudinal Crime Pattern Forecasting")}
              </div>
              <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full border border-brand-purple/20 ml-auto">2001–2028 Longitudinal</span>
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "totalIpc", label: "Total IPC" },
                { id: "sll", label: "SLL Cases" },
                { id: "cyber", label: "Cyber Frauds" },
                { id: "theft", label: "Property Theft" },
                { id: "violentCrime", label: "Violent Crime" },
                { id: "murder", label: "Homicide" },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={metric === item.id ? "default" : "ghost"}
                onClick={() => setMetric(item.id)}
                className="text-xs h-7 px-3 rounded-md font-semibold"
              >
                {t(item.label)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        {/* Longitudinal Chart */}
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ left: 10, right: 20, top: 30, bottom: 20 }}
            >
              <defs>
                <linearGradient id="gradLongitudinal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricLabels[metric].color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={metricLabels[metric].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => v.toLocaleString("en-IN")}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.9)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value: any, name: any, props: any) => [
                  value?.toLocaleString("en-IN"),
                  props?.payload?.isForecast ? `${t(metricLabels[metric].name)} (Forecast)` : t(metricLabels[metric].name),
                ]}
                labelFormatter={(year) => `${t("Year")}: ${year}`}
              />
              <ReferenceLine
                x={2025}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: t("AI Forecast Horizon →"),
                  position: "top",
                  fill: "#f59e0b",
                  fontSize: 11,
                  fontWeight: 600,
                  dy: -4,
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={metricLabels[metric].color}
                fill="url(#gradLongitudinal)"
                strokeWidth={3}
                tooltipType="none"
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={metricLabels[metric].color}
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={payload.isForecast ? 5 : 4}
                      fill={payload.isForecast ? "#f59e0b" : metricLabels[metric].color}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Decadal District CAGR Drivers Grid */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-brand-purple" />
            {t("Decadal District Progression & Primary Growth Drivers (2001 – 2025)")}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {districtDecadalProfiles.map((dp) => (
              <div
                key={dp.name}
                className="p-3.5 rounded-xl border border-border/50 bg-card/60 hover:border-brand-purple/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{t(dp.name)}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      dp.trajectory === "Accelerating"
                        ? "bg-brand-red/10 text-brand-red border border-brand-red/30"
                        : dp.trajectory === "Decelerating"
                        ? "bg-brand-green/10 text-brand-green border border-brand-green/30"
                        : "bg-brand-blue/10 text-brand-blue border border-brand-blue/30"
                    }`}
                  >
                    {t(dp.trajectory)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">{t("20-Year CAGR")}:</span>
                  <span className="font-mono font-bold text-foreground">
                    +{dp.cagr20Year}% / {t("yr")}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <span className="font-semibold text-foreground">{t("Driver")}: </span>
                  {t(dp.primaryGrowthDriver)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
