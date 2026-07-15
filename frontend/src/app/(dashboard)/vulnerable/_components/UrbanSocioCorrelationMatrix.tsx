"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { districtSocioProfiles, type DistrictSocioProfile } from "@/data/sociologicalData";
import * as motion from "motion/react-client";
import { useLanguage } from "@/components/LanguageContext";
import { Building2, Factory, Trees, Waves, MapPin, TrendingUp, ShieldCheck } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type CategoryFilter = "All" | "Urban Tech Hub" | "Industrial Belt" | "Rural / Agrarian";

export default function UrbanSocioCorrelationMatrix() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<CategoryFilter>("All");

  const filteredDistricts = districtSocioProfiles.filter(
    (d) => filter === "All" || d.category === filter
  );

  const chartData = filteredDistricts.map((d) => ({
    name: t(d.name),
    Women: d.womenCrimeRate,
    Children: d.childCrimeRate,
    SCST: d.scstCrimeRate,
  }));

  const getCategoryIcon = (cat: DistrictSocioProfile["category"]) => {
    switch (cat) {
      case "Urban Tech Hub": return <Building2 className="w-4 h-4 text-brand-purple" />;
      case "Industrial Belt": return <Factory className="w-4 h-4 text-brand-amber" />;
      case "Coastal / Tourism": return <Waves className="w-4 h-4 text-brand-blue" />;
      default: return <Trees className="w-4 h-4 text-brand-green" />;
    }
  };

  const getCategoryBadgeColor = (cat: DistrictSocioProfile["category"]) => {
    switch (cat) {
      case "Urban Tech Hub": return "bg-brand-purple/10 text-brand-purple border-brand-purple/20";
      case "Industrial Belt": return "bg-brand-amber/10 text-brand-amber border-brand-amber/20";
      case "Coastal / Tourism": return "bg-brand-blue/10 text-brand-blue border-brand-blue/20";
      default: return "bg-brand-green/10 text-brand-green border-brand-green/20";
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl flex items-center gap-2.5 text-foreground">
            <div className="p-2 bg-brand-purple/10 rounded-lg">
              <Building2 className="w-5 h-5 text-brand-purple" />
            </div>
            {t("Urbanization & Socio-Geographic Crime Matrix")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Demographic crime rates (per 100k population) correlated against urbanization & industrial density")}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 bg-muted/30 p-1.5 rounded-xl border border-border/50">
          {(["All", "Urban Tech Hub", "Industrial Belt", "Rural / Agrarian"] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === cat
                  ? "bg-brand-purple text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart + Table Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Comparison Bar Chart */}
        <Card className="glass-card hover:!transform-none lg:col-span-5 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-purple" />
              {t("Demographic Crime Rate per 100k")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6 flex-1">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="Women" name={t("Women")} fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Children" name={t("Children")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SCST" name={t("SC/ST")} fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* District Socio-Geographic Profile Table */}
        <Card className="glass-card hover:!transform-none lg:col-span-7 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-blue" />
              {t("District Socio-Economic Risk Profiles")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 text-[11px] font-bold text-muted-foreground uppercase bg-muted/20">
                    <th className="py-3 px-4">{t("District")}</th>
                    <th className="py-3 px-3">{t("Socio-Geo Zone")}</th>
                    <th className="py-3 px-3 text-right">{t("Urban %")}</th>
                    <th className="py-3 px-3 text-right">{t("Women Rate")}</th>
                    <th className="py-3 px-3 text-right">{t("SC/ST Rate")}</th>
                    <th className="py-3 px-4 text-center">{t("Socio Risk")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {filteredDistricts.map((d) => (
                    <tr key={d.name} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex flex-col">
                          <span>{t(d.name)}</span>
                          <span className="text-[11px] text-muted-foreground font-normal line-clamp-1">
                            {t(d.dominantSocialFactor)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeColor(d.category)}`}>
                          {getCategoryIcon(d.category)}
                          {t(d.category)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-muted-foreground">
                        {d.urbanizationRate}%
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-brand-pink">
                        {d.womenCrimeRate}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-brand-teal">
                        {d.scstCrimeRate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                            d.riskScore >= 70
                              ? "bg-brand-red/15 text-brand-red border border-brand-red/30"
                              : d.riskScore >= 60
                              ? "bg-brand-amber/15 text-brand-amber border border-brand-amber/30"
                              : "bg-brand-green/15 text-brand-green border border-brand-green/30"
                          }`}
                        >
                          {d.riskScore}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
