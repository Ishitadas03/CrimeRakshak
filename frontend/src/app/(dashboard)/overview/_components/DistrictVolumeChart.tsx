"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTopDistricts } from "@/lib/derive";
import { useLanguage } from "@/components/LanguageContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ViewMode = "total" | "ipc" | "sll";
type TimeScale = "annual" | "monthly" | "daily";

export function DistrictVolumeChart() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<ViewMode>("total");
  const [time, setTime] = useState<TimeScale>("annual");
  const top10 = getTopDistricts(10, mode);

  const data = top10.map((d) => {
    // Exact official statutory figures or accurate mathematical averages
    const divisor = time === "monthly" ? 12 : time === "daily" ? 365 : 1;
    const ipcVal = time === "daily" ? Math.round((d.ipc / divisor) * 10) / 10 : Math.round(d.ipc / divisor);
    const sllVal = time === "daily" ? Math.round((d.sll / divisor) * 10) / 10 : Math.round(d.sll / divisor);
    const totalVal = time === "daily" ? Math.round(((d.ipc + d.sll) / divisor) * 10) / 10 : Math.round((d.ipc + d.sll) / divisor);

    return {
      name: t(d.name).length > 12 ? t(d.name).slice(0, 12) + "…" : t(d.name),
      fullName: d.name,
      IPC: ipcVal,
      SLL: sllVal,
      Total: totalVal,
    };
  });

  return (
    <Card className="glass-card relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
        <div>
          <CardTitle className="font-heading text-base text-foreground flex items-center gap-2">
            <span>{t("Top 10 Districts — Crime Volume")}</span>
            <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full border border-brand-purple/20">
              {time === "annual" ? t("2025 Annual Official") : time === "monthly" ? t("2025 Monthly Average") : t("2025 Daily Average")}
            </span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("Official KSP statutory jurisdiction volume (Real reported IPC & SLL cases)")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
            {(
              [
                { id: "annual", label: "Annual (Official)" },
                { id: "monthly", label: "Monthly Avg" },
                { id: "daily", label: "Daily Avg" },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={time === item.id ? "secondary" : "ghost"}
                className="text-xs h-7 px-2.5 rounded-md font-semibold"
                onClick={() => setTime(item.id)}
              >
                {t(item.label)}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
            {(["total", "ipc", "sll"] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "default" : "ghost"}
                className="text-xs h-7 px-3 rounded-md shadow-none font-bold"
                onClick={() => setMode(m)}
              >
                {t(m.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 15, top: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorIpc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                angle={-35}
                textAnchor="end"
                height={70}
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
              />
              {mode === "total" ? (
                <>
                  <Area
                    type="natural"
                    name={t("IPC Cases")}
                    dataKey="IPC"
                    stroke="var(--chart-1)"
                    fill="url(#colorIpc)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                  <Area
                    type="natural"
                    name={t("SLL Cases")}
                    dataKey="SLL"
                    stroke="#10b981"
                    fill="url(#colorSll)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                  <Legend />
                </>
              ) : mode === "ipc" ? (
                <Area
                  type="natural"
                  name={t("IPC Cases")}
                  dataKey="IPC"
                  stroke="var(--chart-1)"
                  fill="url(#colorIpc)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1500}
                />
              ) : (
                <Area
                  type="natural"
                  name={t("SLL Cases")}
                  dataKey="SLL"
                  stroke="#10b981"
                  fill="url(#colorSll)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1500}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
