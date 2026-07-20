"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Award, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface SllDistrictRecord {
  district: string;
  range: string;
  cotpaCases: number;
  ndpsCases: number;
  exciseCases: number;
  totalSll: number;
  enforcementIndex: number; // 0 - 100
  rating: "Proactive Benchmark" | "Standard Enforcement" | "Deficit Alert";
}

const sllDistrictData: SllDistrictRecord[] = [
  {
    district: "Bengaluru City",
    range: "Commissionerate",
    cotpaCases: 8940,
    ndpsCases: 1420,
    exciseCases: 4120,
    totalSll: 19301,
    enforcementIndex: 96,
    rating: "Proactive Benchmark",
  },
  {
    district: "Mysuru City",
    range: "Southern Range",
    cotpaCases: 1450,
    ndpsCases: 210,
    exciseCases: 890,
    totalSll: 2845,
    enforcementIndex: 88,
    rating: "Proactive Benchmark",
  },
  {
    district: "Hubli-Dharwad City",
    range: "North Karnataka Range",
    cotpaCases: 1120,
    ndpsCases: 180,
    exciseCases: 710,
    totalSll: 2312,
    enforcementIndex: 84,
    rating: "Proactive Benchmark",
  },
  {
    district: "Dakshina Kannada",
    range: "Coastal Range",
    cotpaCases: 820,
    ndpsCases: 340,
    exciseCases: 610,
    totalSll: 1980,
    enforcementIndex: 81,
    rating: "Standard Enforcement",
  },
  {
    district: "Belagavi District",
    range: "North Karnataka Range",
    cotpaCases: 540,
    ndpsCases: 110,
    exciseCases: 490,
    totalSll: 1340,
    enforcementIndex: 65,
    rating: "Standard Enforcement",
  },
  {
    district: "Ballari District",
    range: "Eastern Range",
    cotpaCases: 210,
    ndpsCases: 45,
    exciseCases: 290,
    totalSll: 610,
    enforcementIndex: 48,
    rating: "Deficit Alert",
  },
];

export function SllEnforcementBenchmark() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All"
    ? sllDistrictData
    : sllDistrictData.filter((d) => d.rating === filter);

  return (
    <Card className="glass-card overflow-hidden border-border/50 shadow-lg">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-brand-green/15 text-brand-green border border-brand-green/30">
                {t("PROACTIVE ENFORCEMENT INDEX")}
              </span>
              <span className="text-xs text-muted-foreground">
                Grounded in KSP SLL & COTPA District Reports
              </span>
            </div>
            <CardTitle className="text-lg font-heading mt-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-brand-green" />
                {t("COTPA & Special Local Law (SLL) Enforcement Benchmarking")}
              </div>
              <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full border border-brand-green/20 ml-auto">2025 Annual Index</span>
            </CardTitle>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", "Proactive Benchmark", "Standard Enforcement", "Deficit Alert"].map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  filter === r
                    ? "bg-brand-green text-white shadow-sm"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {t(r)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/10">
                <th className="py-3 px-4">{t("District Jurisdiction")}</th>
                <th className="py-3 px-4">{t("Police Range")}</th>
                <th className="py-3 px-4 text-right">{t("COTPA (2025)")}</th>
                <th className="py-3 px-4 text-right">{t("NDPS (2025)")}</th>
                <th className="py-3 px-4 text-right">{t("Excise (2025)")}</th>
                <th className="py-3 px-4 text-right">{t("Total SLL (2025)")}</th>
                <th className="py-3 px-4 text-right">{t("Enforcement Score")}</th>
                <th className="py-3 px-4 text-center">{t("Rating")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-xs">
              {filtered.map((row) => (
                <tr key={row.district} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">
                    {t(row.district)}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {t(row.range)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                    {row.cotpaCases.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-brand-red">
                    {row.ndpsCases.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                    {row.exciseCases.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                    {row.totalSll.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-green rounded-full"
                          style={{ width: `${row.enforcementIndex}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold">{row.enforcementIndex}/100</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        row.rating === "Proactive Benchmark"
                          ? "bg-brand-green/10 text-brand-green border border-brand-green/30"
                          : row.rating === "Standard Enforcement"
                          ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/30"
                          : "bg-brand-red/10 text-brand-red border border-brand-red/30"
                      }`}
                    >
                      {row.rating === "Proactive Benchmark" && <Award className="w-3 h-3" />}
                      {row.rating === "Deficit Alert" && <AlertTriangle className="w-3 h-3" />}
                      {t(row.rating)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
