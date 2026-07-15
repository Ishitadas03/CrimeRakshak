"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crimeCategoryGroups } from "@/data/trendAnalyticsData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";
import { Layers } from "lucide-react";

export default function CrimeCategoryBreakdown() {
  const { t } = useLanguage();

  const totalAll = crimeCategoryGroups.reduce((sum, g) => sum + g.total, 0);

  const radarData = crimeCategoryGroups.map((g) => ({
    category: t(g.name),
    value: g.total,
    fullMark: Math.max(...crimeCategoryGroups.map((x) => x.total)),
  }));

  const barData = crimeCategoryGroups
    .sort((a, b) => b.total - a.total)
    .map((g) => ({
      name: t(g.name),
      value: g.total,
      color: g.color,
      pct: Math.round((g.total / totalAll) * 100),
    }));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.3 }}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <Card className="glass-card hover:!transform-none">
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-purple" />
              {t("Crime Composition Radar")}
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                {t("Jan 2026")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <PolarRadiusAxis
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                  />
                  <Radar
                    name={t("Cases")}
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Composition Bar Chart + Detail Cards */}
        <Card className="glass-card hover:!transform-none">
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-blue" />
              {t("Category Volume & Share")}
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                {totalAll.toLocaleString()} {t("total cases")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                      color: "var(--foreground)",
                      padding: "10px",
                    }}
                    formatter={(value) => [Number(value).toLocaleString() + " cases", ""]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sub-crime detail chips */}
            <div className="space-y-3">
              {crimeCategoryGroups.map((group) => (
                <div key={group.name} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: group.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{t(group.name)}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {group.total.toLocaleString()} ({Math.round((group.total / totalAll) * 100)}%)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {group.crimes.map((c) => (
                        <span
                          key={c.name}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground"
                        >
                          {t(c.name)}: {c.value.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
