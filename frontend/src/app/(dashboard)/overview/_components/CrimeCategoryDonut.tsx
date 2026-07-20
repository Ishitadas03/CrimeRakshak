"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ipcCrimes } from "@/data/crimeData";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { chartPalette } from "@/lib/design-tokens";
import { useLanguage } from "@/components/LanguageContext";

export function CrimeCategoryDonut() {
  const { t } = useLanguage();
  const top8 = [...ipcCrimes]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const otherTotal = ipcCrimes
    .filter((c) => !top8.includes(c))
    .reduce((s, c) => s + c.total, 0);

  const stateTotalIpc = ipcCrimes.reduce((s, c) => s + c.total, 0);

  const data = [
    ...top8.map((c) => ({ name: t(c.category), value: c.total })),
    { name: t("Other Categories"), value: otherTotal },
  ];

  return (
    <Card className="glass-card relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:border-brand-purple/20">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base text-foreground flex items-center justify-between gap-2">
          <span>{t("Crime Category Breakdown")}</span>
          <span className="text-xs font-semibold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full border border-brand-purple/20">2024 Annual Telemetry</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("Official IPC statewide statutory volume share")}
        </p>
      </CardHeader>
      <CardContent className="relative">
        <div className="h-[320px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
                </filter>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                animationDuration={1500}
                animationEasing="ease-out"
                style={{ filter: "url(#pieShadow)" }}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={chartPalette[i % chartPalette.length]}
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.7)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 30px rgba(80, 140, 255, 0.12)",
                  color: "#0f172a",
                  fontSize: 12,
                }}
                itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                formatter={(value: any) => value?.toLocaleString("en-IN")}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Donut Label displaying Official Total */}
          <div className="absolute inset-0 top-[-25px] flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {t("TOTAL IPC")}
            </span>
            <span className="text-base font-mono font-bold text-foreground">
              {stateTotalIpc.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-500 tracking-wider mt-0.5 pt-0.5 border-t border-border/40">
              + SLL: 78,900
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
