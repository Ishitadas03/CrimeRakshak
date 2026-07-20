"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthlyComparison } from "@/data/crimeData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLanguage } from "@/components/LanguageContext";

export function MonthlyTrendChart() {
  const { t } = useLanguage();
  const data = monthlyComparison.map((row) => ({
    name: t(row.crime).length > 14 ? t(row.crime).slice(0, 14) + "…" : t(row.crime),
    fullName: row.crime,
    "Dec 2024 (Prev Year)": row.prevYearMonth,
    "Nov 2025 (Prev Month)": row.prevMonth,
    "Dec 2025 (Current)": row.currentMonth,
  }));

  return (
    <Card className="glass-card relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base text-foreground flex items-center justify-between gap-2">
          <span>{t("Monthly Crime Volume Comparison — December 2025 vs Baseline")}</span>
          <span className="text-xs font-semibold text-brand-blue bg-brand-blue/10 px-2.5 py-0.5 rounded-full border border-brand-blue/20 ml-auto">Dec 2024 vs Nov 2025 vs Dec 2025</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("Official statutory monthly reported cases across major IPC heads (KSP / NCRB Telemetry)")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="colorPrevYear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8cc5e3" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8cc5e3" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorPrevMonth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52a2d0" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#52a2d0" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a80bb" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#1a80bb" stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                angle={-30}
                textAnchor="end"
                height={65}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.7)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 30px rgba(80, 140, 255, 0.12)",
                  color: "#0f172a",
                }}
                itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                formatter={(value: any) => value?.toLocaleString("en-IN")}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                cursor={{ fill: "rgba(143, 211, 255, 0.1)" }}
              />
              <Legend />
              <Bar
                name={t("Dec 2024 (Prev Year)")}
                dataKey="Dec 2024 (Prev Year)"
                fill="url(#colorPrevYear)"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              />
              <Bar
                name={t("Nov 2025 (Prev Month)")}
                dataKey="Nov 2025 (Prev Month)"
                fill="url(#colorPrevMonth)"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              />
              <Bar
                name={t("Dec 2025 (Current)")}
                dataKey="Dec 2025 (Current)"
                fill="url(#colorCurrent)"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
